export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { env } from "@/lib/env";
import { intakeLead } from "@/lib/leads/intake";
import { appendMessage, findLeadByPhone } from "@/lib/inbox/upsert";
import { logCrmActivityAsync } from "@/lib/crm/activity-log";

const log = logger.child({ route: "/api/webhooks/vapi" });

/**
 * POST /api/webhooks/vapi
 *
 * PUBLIC — VAPI server-side webhook receiver. Replaces GHL as the
 * VAPI ↔ Skinet bridge: VAPI fires events directly here, we create
 * Lead + Conversation + transcript inside Skinet without GHL.
 *
 * VAPI events we care about:
 *   - end-of-call-report: full transcript + customer info → create Lead
 *   - status-update / conversation-update: skipped (logged only)
 *
 * Auth: VAPI dashboard → Server URL → set X-Vapi-Secret header.
 * Skip verification when env.VAPI_WEBHOOK_SECRET is unset (local dev).
 *
 * VAPI docs: https://docs.vapi.ai/server-url
 */
export async function POST(request: NextRequest) {
  if (env.VAPI_WEBHOOK_SECRET) {
    const provided = request.headers.get("x-vapi-secret");
    if (provided !== env.VAPI_WEBHOOK_SECRET) {
      log.warn("VAPI webhook secret mismatch");
      return NextResponse.json({ error: "Invalid secret" }, { status: 403 });
    }
  }

  let payload: VapiPayload;
  try {
    payload = (await request.json()) as VapiPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const message = payload.message ?? payload;
  const eventType = message.type;

  if (!eventType) {
    return NextResponse.json({ error: "Missing message.type" }, { status: 400 });
  }

  // Only process end-of-call-report — the rest are noise for our use case
  if (eventType !== "end-of-call-report") {
    log.info({ eventType }, "VAPI event ignored");
    return NextResponse.json({ ok: true, ignored: true });
  }

  if (!env.DEFAULT_TENANT_ID) {
    log.error("DEFAULT_TENANT_ID unset — cannot route VAPI event");
    return NextResponse.json({ error: "Tenant routing not configured" }, { status: 500 });
  }
  const tenantId = env.DEFAULT_TENANT_ID;

  const call = message.call ?? {};
  const callId = call.id ?? "";
  const customerPhone = call.customer?.number ?? "";
  const customerName = call.customer?.name ?? null;
  const summary = message.summary ?? message.analysis?.summary ?? "";
  const transcript = message.transcript ?? "";
  const endedReason = call.endedReason ?? "unknown";

  if (!customerPhone) {
    log.warn({ callId }, "VAPI end-of-call-report without customer phone — skipping");
    return NextResponse.json({ ok: true, skipped: "no_phone" });
  }

  try {
    // Try to match an existing lead by phone before creating a new one
    const existing = await findLeadByPhone(tenantId, customerPhone);

    let leadId: string;
    if (existing) {
      leadId = existing.id;
      log.info({ leadId, callId, customerPhone }, "VAPI call linked to existing lead");
    } else {
      const intake = await intakeLead({
        tenantId,
        name: customerName ?? `Llamada ${customerPhone}`,
        phone: customerPhone,
        source: "ghl_webhook", // closest existing source value; "vapi_call" not yet in enum
        notes: summary || `[VAPI] Llamada ${callId} — ${endedReason}`,
        tags: ["vapi", `vapi:${endedReason}`],
        customFields: {
          vapiCallId: callId,
          vapiSummary: summary,
          vapiEndedReason: endedReason,
          vapiTranscriptPreview: transcript.slice(0, 500),
        },
      });
      leadId = intake.lead.id;
      log.info({ leadId, callId, customerPhone }, "VAPI call created new lead");
    }

    // Save transcript as a voice Conversation + InboxMessage
    if (transcript) {
      await appendMessage({
        tenantId,
        channel: "voice",
        channelRef: callId || customerPhone,
        direction: "inbound",
        fromAddr: customerPhone,
        toAddr: call.phoneNumber?.number ?? "vapi",
        body: transcript,
        externalId: callId,
        rawProvider: "vapi",
        status: "completed",
        leadId,
        subject: summary
          ? summary.slice(0, 200)
          : `Llamada VAPI ${customerPhone}`,
      });
    }

    logCrmActivityAsync({
      tenantId,
      entityType: "lead",
      entityId: leadId,
      action: "note_added",
      details: {
        kind: "vapi_call_completed",
        callId,
        customerPhone,
        endedReason,
        summaryPreview: summary.slice(0, 200),
      },
    });

    return NextResponse.json({ ok: true, leadId });
  } catch (err) {
    log.error({ err, callId }, "VAPI webhook handler failed");
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

// ==================== TYPES ====================
// Minimal subset of the VAPI server-message envelope we consume.
// Schema may evolve — kept narrow + permissive (extra fields ignored).

type VapiPayload = {
  message?: VapiMessage;
} & Partial<VapiMessage>;

type VapiMessage = {
  type?: string;
  call?: {
    id?: string;
    endedReason?: string;
    customer?: { number?: string; name?: string };
    phoneNumber?: { number?: string };
  };
  summary?: string;
  transcript?: string;
  analysis?: { summary?: string; structuredData?: unknown };
};
