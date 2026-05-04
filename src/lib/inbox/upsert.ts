import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { Prisma } from "@/generated/prisma/client";

const log = logger.child({ module: "inbox/upsert" });

export type AppendMessageInput = {
  tenantId: string;
  channel: "sms" | "whatsapp" | "email" | "voice";
  /** External identifier — phone E.164, email, or VAPI callId. Used to find/create the conversation. */
  channelRef: string;
  direction: "inbound" | "outbound";
  fromAddr: string;
  toAddr: string;
  body: string;
  externalId?: string | null;
  rawProvider?: "twilio" | "vapi" | "resend" | null;
  status?: string | null;
  errorMessage?: string | null;
  media?: Prisma.InputJsonValue | null;
  /** When inbound, optionally set the lead/client by upstream resolution. */
  leadId?: string | null;
  clientId?: string | null;
  actorId?: string | null;
  subject?: string | null;
};

export type AppendMessageResult = {
  conversationId: string;
  messageId: string;
  conversationCreated: boolean;
};

/**
 * Append a message to its conversation, creating the Conversation row
 * the first time we see this (tenantId, channel, channelRef) tuple.
 *
 * Idempotency-light: if a Message with the same externalId already
 * exists for this tenant we skip the insert and return the existing
 * row. Used by Twilio/VAPI webhooks to handle re-deliveries.
 *
 * Updates Conversation.lastMessageAt/Body/Direction and bumps
 * unreadCount on inbound messages.
 */
export async function appendMessage(
  input: AppendMessageInput,
): Promise<AppendMessageResult> {
  // Idempotency check
  if (input.externalId) {
    const existing = await prisma.inboxMessage.findFirst({
      where: { tenantId: input.tenantId, externalId: input.externalId },
      select: { id: true, conversationId: true },
    });
    if (existing) {
      log.info(
        { tenantId: input.tenantId, externalId: input.externalId },
        "Message already exists — skipping (idempotent)",
      );
      return {
        conversationId: existing.conversationId,
        messageId: existing.id,
        conversationCreated: false,
      };
    }
  }

  // Find or create Conversation
  const existingConv = await prisma.conversation.findFirst({
    where: {
      tenantId: input.tenantId,
      channel: input.channel,
      channelRef: input.channelRef,
    },
    select: { id: true },
  });

  let conversationId: string;
  let conversationCreated = false;

  if (existingConv) {
    conversationId = existingConv.id;
  } else {
    const created = await prisma.conversation.create({
      data: {
        tenantId: input.tenantId,
        leadId: input.leadId ?? null,
        clientId: input.clientId ?? null,
        channel: input.channel,
        channelRef: input.channelRef,
        subject: input.subject ?? null,
        status: "open",
        lastMessageAt: new Date(),
        lastMessageBody: input.body.slice(0, 280),
        lastMessageDirection: input.direction,
        unreadCount: input.direction === "inbound" ? 1 : 0,
      },
      select: { id: true },
    });
    conversationId = created.id;
    conversationCreated = true;
  }

  // Insert message
  const message = await prisma.inboxMessage.create({
    data: {
      tenantId: input.tenantId,
      conversationId,
      direction: input.direction,
      channel: input.channel,
      fromAddr: input.fromAddr,
      toAddr: input.toAddr,
      body: input.body,
      externalId: input.externalId ?? null,
      rawProvider: input.rawProvider ?? null,
      status: input.status ?? null,
      errorMessage: input.errorMessage ?? null,
      media: input.media ?? Prisma.JsonNull,
      actorId: input.actorId ?? null,
    },
    select: { id: true },
  });

  // Update conversation header (skip if we just created it)
  if (!conversationCreated) {
    await prisma.conversation.update({
      where: { id: conversationId },
      data: {
        lastMessageAt: new Date(),
        lastMessageBody: input.body.slice(0, 280),
        lastMessageDirection: input.direction,
        ...(input.direction === "inbound"
          ? { unreadCount: { increment: 1 }, status: "open" }
          : {}),
      },
    });
  }

  return {
    conversationId,
    messageId: message.id,
    conversationCreated,
  };
}

/**
 * Best-effort lead lookup by inbound phone number, scoped to the tenant.
 * Used when Twilio webhook fires and we want to link the conversation
 * to an existing Lead automatically.
 */
export async function findLeadByPhone(
  tenantId: string,
  phoneE164: string,
): Promise<{ id: string } | null> {
  // Match by exact phone or by tail (last 9 digits) for robustness against
  // country-code variations.
  const tail = phoneE164.replace(/\D/g, "").slice(-9);
  const lead = await prisma.lead.findFirst({
    where: {
      tenantId,
      OR: [
        { phone: phoneE164 },
        { phone: { endsWith: tail } },
      ],
    },
    orderBy: { createdAt: "desc" },
    select: { id: true },
  });
  return lead;
}
