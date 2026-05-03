export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireTenant } from "@/lib/auth/guard";
import { apiError, badRequest } from "@/lib/api-response";
import { validateBody } from "@/lib/validation";
import { sendSmsOrWhatsApp } from "@/lib/notifications/sms";
import { logCrmActivityAsync } from "@/lib/crm/activity-log";

const sendSmsSchema = z
  .object({
    channel: z.enum(["sms", "whatsapp"]).default("sms"),
    /** E.164 phone (preferred — Twilio path). */
    to: z.string().min(8).max(20).optional(),
    /** GHL contact ID (legacy fallback path). */
    ghlContactId: z.string().optional(),
    body: z.string().min(1).max(1600),
    leadId: z.string().optional(),
    quoteId: z.string().optional(),
    reservationId: z.string().optional(),
  })
  .refine((d) => !!d.to || !!d.ghlContactId, {
    message: "Debes proporcionar `to` (E.164) o `ghlContactId`",
  });

/**
 * POST /api/notifications/sms
 *
 * Admin manual send of SMS or WhatsApp through the dispatcher.
 * Provider preference: Twilio first, GHL fallback. Logs to
 * TwilioMessageLog when Twilio path is used.
 *
 * Logs a CrmActivityLog entry "email_sent" (closest available action)
 * when linked to a lead/quote/reservation, so the entity timeline
 * reflects outbound contact attempts.
 */
export async function POST(request: NextRequest) {
  const [session, authError] = await requireTenant();
  if (authError) return authError;
  const { tenantId, userId, email } = session;

  try {
    const body = await request.json();
    const validated = validateBody(body, sendSmsSchema);
    if (!validated.ok) return badRequest(validated.error);
    const data = validated.data;

    const result = await sendSmsOrWhatsApp({
      tenantId,
      channel: data.channel,
      to: data.to,
      ghlContactId: data.ghlContactId ?? null,
      body: data.body,
      leadId: data.leadId,
      quoteId: data.quoteId,
      reservationId: data.reservationId,
      actorId: userId,
    });

    if (!result.ok) {
      return NextResponse.json(
        {
          ok: false,
          provider: result.provider,
          error: result.error,
        },
        { status: 502 },
      );
    }

    // Activity log on the linked entity (best-effort)
    const target =
      data.leadId
        ? { entityType: "lead" as const, entityId: data.leadId }
        : data.quoteId
          ? { entityType: "quote" as const, entityId: data.quoteId }
          : data.reservationId
            ? { entityType: "reservation" as const, entityId: data.reservationId }
            : null;
    if (target) {
      logCrmActivityAsync({
        tenantId,
        entityType: target.entityType,
        entityId: target.entityId,
        action: "email_sent",
        actorId: userId,
        actorName: email ?? null,
        details: {
          kind: data.channel === "whatsapp" ? "whatsapp_sent" : "sms_sent",
          provider: result.provider,
          to: data.to ?? null,
          preview: data.body.slice(0, 120),
        },
      });
    }

    return NextResponse.json({
      ok: true,
      provider: result.provider,
      sid: "sid" in result ? result.sid : undefined,
    });
  } catch (error) {
    return apiError(error, {
      publicMessage: "No se pudo enviar el mensaje",
      code: "SMS_SEND_ERROR",
      logContext: { tenantId },
    });
  }
}
