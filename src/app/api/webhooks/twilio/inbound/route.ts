export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "node:crypto";
import { logger } from "@/lib/logger";
import { env } from "@/lib/env";
import { appendMessage, findLeadByPhone } from "@/lib/inbox/upsert";
import { logCrmActivityAsync } from "@/lib/crm/activity-log";

const log = logger.child({ route: "/api/webhooks/twilio/inbound" });

/**
 * POST /api/webhooks/twilio/inbound
 *
 * PUBLIC — Twilio inbound webhook for SMS / WhatsApp.
 * Verifies HMAC-SHA1 signature with TWILIO_AUTH_TOKEN, then appends
 * an InboxMessage to the Conversation matching (tenantId, channel, fromPhone).
 *
 * Twilio docs: https://www.twilio.com/docs/usage/webhooks/webhooks-security
 *
 * Signature scheme:
 *   - signedString = URL + sorted (key + value) concatenation of form fields
 *   - X-Twilio-Signature = base64( hmac-sha1( signedString, AUTH_TOKEN ) )
 */
export async function POST(request: NextRequest) {
  // Twilio sends application/x-www-form-urlencoded
  const rawBody = await request.text();
  const params = new URLSearchParams(rawBody);

  // Verify signature (skip only when token unset — local dev convenience)
  if (env.TWILIO_AUTH_TOKEN) {
    const signature = request.headers.get("x-twilio-signature");
    if (!signature) {
      log.warn("Missing x-twilio-signature header");
      return NextResponse.json({ error: "Missing signature" }, { status: 401 });
    }
    const url = request.url;
    const sortedKeys = Array.from(params.keys()).sort();
    let signedString = url;
    for (const k of sortedKeys) signedString += k + (params.get(k) ?? "");
    const expected = createHmac("sha1", env.TWILIO_AUTH_TOKEN)
      .update(signedString, "utf-8")
      .digest("base64");
    if (expected !== signature) {
      log.warn({ expected: expected.slice(0, 12), received: signature.slice(0, 12) }, "Twilio signature mismatch");
      return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
    }
  }

  const messageSid = params.get("MessageSid") ?? params.get("SmsMessageSid") ?? null;
  const fromRaw = params.get("From") ?? "";
  const toRaw = params.get("To") ?? "";
  const body = params.get("Body") ?? "";
  const numMedia = parseInt(params.get("NumMedia") ?? "0", 10);

  // Detect channel from address scheme
  const isWhatsApp = fromRaw.startsWith("whatsapp:") || toRaw.startsWith("whatsapp:");
  const channel = isWhatsApp ? "whatsapp" : "sms";

  // Strip "whatsapp:" prefix for clean E.164 in DB
  const fromAddr = fromRaw.replace(/^whatsapp:/, "");
  const toAddr = toRaw.replace(/^whatsapp:/, "");

  // Resolve tenant — for MVP use DEFAULT_TENANT_ID. Future: look up by `to` against per-tenant Twilio numbers registry.
  if (!env.DEFAULT_TENANT_ID) {
    log.error("DEFAULT_TENANT_ID not set — cannot route inbound Twilio message");
    return NextResponse.json({ error: "Tenant routing not configured" }, { status: 500 });
  }
  const tenantId = env.DEFAULT_TENANT_ID;

  // Capture media if any
  const media: Array<{ url: string; contentType: string }> = [];
  for (let i = 0; i < numMedia; i++) {
    const url = params.get(`MediaUrl${i}`);
    const ct = params.get(`MediaContentType${i}`) ?? "application/octet-stream";
    if (url) media.push({ url, contentType: ct });
  }

  // Try to match this phone to an existing lead
  const lead = await findLeadByPhone(tenantId, fromAddr).catch(() => null);

  try {
    const result = await appendMessage({
      tenantId,
      channel,
      channelRef: fromAddr,
      direction: "inbound",
      fromAddr,
      toAddr,
      body,
      externalId: messageSid,
      rawProvider: "twilio",
      status: "received",
      media: media.length > 0 ? (media as unknown as object) : null,
      leadId: lead?.id ?? null,
    });

    log.info(
      {
        tenantId,
        channel,
        from: fromAddr,
        conversationId: result.conversationId,
        messageId: result.messageId,
        leadMatched: !!lead,
      },
      "Twilio inbound message stored",
    );

    if (lead?.id) {
      logCrmActivityAsync({
        tenantId,
        entityType: "lead",
        entityId: lead.id,
        action: "note_added",
        details: {
          kind: channel === "whatsapp" ? "whatsapp_inbound" : "sms_inbound",
          from: fromAddr,
          preview: body.slice(0, 120),
          conversationId: result.conversationId,
        },
      });
    }

    // Twilio expects a 200 + empty TwiML (or empty 200) to ack
    return new NextResponse("<Response/>", {
      status: 200,
      headers: { "Content-Type": "text/xml" },
    });
  } catch (err) {
    log.error({ err, fromAddr, channel }, "Failed to persist Twilio inbound message");
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
