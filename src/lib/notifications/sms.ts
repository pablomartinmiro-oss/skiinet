/**
 * SMS / WhatsApp dispatcher — provider-agnostic.
 *
 * Resolution order:
 *   1. Twilio (if TWILIO_ACCOUNT_SID + TWILIO_AUTH_TOKEN set)
 *   2. GHL fallback (if tenant has ghlAccessToken + ghl contactId provided)
 *   3. No-op + log warning (return ok=false but never throw)
 *
 * Always writes a TwilioMessageLog row when Twilio is the path used,
 * so admins have an audit trail independent of GHL.
 */

import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { isTwilioConfigured, twilioSendMessage, type TwilioChannel } from "@/lib/twilio/client";
import { env } from "@/lib/env";

const log = logger.child({ module: "notifications/sms" });

export type SendSmsInput = {
  tenantId: string;
  channel?: TwilioChannel;          // default "sms"
  /** Phone in E.164 format (preferred path — Twilio). */
  to?: string;
  /** GHL contact ID (fallback path — only used when Twilio unconfigured). */
  ghlContactId?: string | null;
  body: string;
  /** Optional links to the source entity for the audit log. */
  leadId?: string;
  quoteId?: string;
  reservationId?: string;
  actorId?: string | null;
};

export type SendSmsResult =
  | { ok: true; provider: "twilio" | "ghl"; sid?: string }
  | { ok: false; provider: "twilio" | "ghl" | "none"; error: string };

export async function sendSmsOrWhatsApp(input: SendSmsInput): Promise<SendSmsResult> {
  const channel = input.channel ?? "sms";

  // Path 1: Twilio (preferred)
  if (isTwilioConfigured() && input.to) {
    const result = await twilioSendMessage({ channel, to: input.to, body: input.body });
    const fromNumber = result.ok ? result.from : channel === "whatsapp" ? env.TWILIO_FROM_WHATSAPP ?? "" : env.TWILIO_FROM_SMS ?? "";

    // Audit log (best-effort)
    try {
      await prisma.twilioMessageLog.create({
        data: {
          tenantId: input.tenantId,
          channel,
          direction: "outbound",
          fromNumber,
          toNumber: input.to,
          body: input.body,
          twilioSid: result.ok ? result.sid : null,
          status: result.ok ? result.status : "failed",
          errorCode: result.ok ? null : result.code ?? null,
          errorMessage: result.ok ? null : result.error,
          leadId: input.leadId ?? null,
          quoteId: input.quoteId ?? null,
          reservationId: input.reservationId ?? null,
          actorId: input.actorId ?? null,
        },
      });
    } catch (logErr) {
      log.warn({ err: logErr }, "Failed to write TwilioMessageLog row");
    }

    if (result.ok) return { ok: true, provider: "twilio", sid: result.sid };
    return { ok: false, provider: "twilio", error: result.error };
  }

  // Path 2: GHL fallback (legacy — still supported until GHL is fully removed)
  if (input.ghlContactId) {
    try {
      const tenant = await prisma.tenant.findUnique({
        where: { id: input.tenantId },
        select: { ghlAccessToken: true },
      });
      if (!tenant?.ghlAccessToken) {
        return {
          ok: false,
          provider: "ghl",
          error: "Tenant no tiene GHL access token",
        };
      }
      // Lazy import to avoid loading GHL stack when Twilio is the active path.
      const { getGHLClient } = await import("@/lib/ghl/api");
      const client = await getGHLClient(input.tenantId);
      await client.sendMessage(input.ghlContactId, {
        type: channel === "whatsapp" ? "WhatsApp" : "SMS",
        body: input.body,
        contactId: input.ghlContactId,
      });
      return { ok: true, provider: "ghl" };
    } catch (err) {
      return {
        ok: false,
        provider: "ghl",
        error: err instanceof Error ? err.message : "GHL send error",
      };
    }
  }

  log.warn(
    { tenantId: input.tenantId, channel },
    "No provider available — neither Twilio configured nor GHL contact provided",
  );
  return { ok: false, provider: "none", error: "No SMS provider configurado" };
}
