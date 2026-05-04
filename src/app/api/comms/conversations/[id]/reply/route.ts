export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireTenant } from "@/lib/auth/guard";
import { prisma } from "@/lib/db";
import { apiError, badRequest } from "@/lib/api-response";
import { validateBody } from "@/lib/validation";
import { sendSmsOrWhatsApp } from "@/lib/notifications/sms";
import { appendMessage } from "@/lib/inbox/upsert";
import { logCrmActivityAsync } from "@/lib/crm/activity-log";
import { env } from "@/lib/env";

const replySchema = z.object({
  body: z.string().min(1).max(1600),
});

/**
 * POST /api/comms/conversations/[id]/reply
 *
 * Outbound reply on an existing Conversation. Routes via Twilio for
 * SMS/WhatsApp; email channel currently unsupported (use Resend
 * directly until we wire it). Persists the message to InboxMessage,
 * updates conversation header, logs CRM activity if linked to a lead.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const [session, authError] = await requireTenant();
  if (authError) return authError;
  const { tenantId, userId, email } = session;
  const { id } = await params;

  try {
    const body = await request.json();
    const validated = validateBody(body, replySchema);
    if (!validated.ok) return badRequest(validated.error);

    const conv = await prisma.conversation.findFirst({
      where: { id, tenantId },
    });
    if (!conv) {
      return NextResponse.json({ error: "Conversación no encontrada" }, { status: 404 });
    }

    if (conv.channel !== "sms" && conv.channel !== "whatsapp") {
      return badRequest(
        `Canal "${conv.channel}" no soportado todavía en reply. Por ahora solo sms y whatsapp.`,
      );
    }

    // Outbound via dispatcher
    const result = await sendSmsOrWhatsApp({
      tenantId,
      channel: conv.channel,
      to: conv.channelRef,
      body: validated.data.body,
      leadId: conv.leadId ?? undefined,
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

    const fromAddr =
      conv.channel === "whatsapp"
        ? (env.TWILIO_FROM_WHATSAPP ?? "system")
        : (env.TWILIO_FROM_SMS ?? "system");

    // Persist message in InboxMessage so it shows in the thread
    const appended = await appendMessage({
      tenantId,
      channel: conv.channel,
      channelRef: conv.channelRef,
      direction: "outbound",
      fromAddr,
      toAddr: conv.channelRef,
      body: validated.data.body,
      externalId: "sid" in result ? result.sid ?? null : null,
      rawProvider: result.provider === "twilio" ? "twilio" : null,
      status: "sent",
      actorId: userId,
      leadId: conv.leadId ?? undefined,
      clientId: conv.clientId ?? undefined,
    });

    if (conv.leadId) {
      logCrmActivityAsync({
        tenantId,
        entityType: "lead",
        entityId: conv.leadId,
        action: "email_sent",
        actorId: userId,
        actorName: email ?? null,
        details: {
          kind: conv.channel === "whatsapp" ? "whatsapp_sent" : "sms_sent",
          provider: result.provider,
          to: conv.channelRef,
          preview: validated.data.body.slice(0, 120),
          conversationId: conv.id,
        },
      });
    }

    return NextResponse.json({
      ok: true,
      provider: result.provider,
      messageId: appended.messageId,
    });
  } catch (error) {
    return apiError(error, {
      publicMessage: "No se pudo enviar la respuesta",
      code: "COMMS_REPLY_ERROR",
      logContext: { tenantId, conversationId: id },
    });
  }
}
