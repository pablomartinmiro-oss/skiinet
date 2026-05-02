export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireTenant } from "@/lib/auth/guard";
import { prisma } from "@/lib/db";
import { apiError } from "@/lib/api-response";
import { validateBody } from "@/lib/validation";
import { createNotification } from "@/lib/notifications/create";

const sendMessageSchema = z.object({
  toUserId: z.string().min(1),
  body: z.string().trim().min(1).max(4000),
});

/**
 * GET /api/messages
 *  - default: returns the inbox grouped into conversations (one row per peer user)
 *  - ?with=<userId>: returns the full thread with that peer (newest last)
 */
export async function GET(request: NextRequest) {
  const [session, authError] = await requireTenant();
  if (authError) return authError;

  const { tenantId, userId } = session;
  const peer = request.nextUrl.searchParams.get("with");

  try {
    if (peer) {
      const messages = await prisma.message.findMany({
        where: {
          tenantId,
          OR: [
            { fromUserId: userId, toUserId: peer },
            { fromUserId: peer, toUserId: userId },
          ],
        },
        orderBy: { createdAt: "asc" },
        include: {
          fromUser: { select: { id: true, name: true, email: true } },
          toUser: { select: { id: true, name: true, email: true } },
        },
        take: 500,
      });
      return NextResponse.json({ messages, peerId: peer });
    }

    // Inbox = all messages I sent or received → group per peer (latest message + unread count)
    const messages = await prisma.message.findMany({
      where: {
        tenantId,
        OR: [{ fromUserId: userId }, { toUserId: userId }],
      },
      orderBy: { createdAt: "desc" },
      include: {
        fromUser: { select: { id: true, name: true, email: true } },
        toUser: { select: { id: true, name: true, email: true } },
      },
      take: 500,
    });

    const conversations = new Map<
      string,
      {
        peerId: string;
        peerName: string;
        peerEmail: string;
        lastMessage: string;
        lastAt: string;
        unread: number;
      }
    >();

    for (const m of messages) {
      const peerSide = m.fromUserId === userId ? m.toUser : m.fromUser;
      const peerKey = peerSide.id;
      const existing = conversations.get(peerKey);
      if (!existing) {
        conversations.set(peerKey, {
          peerId: peerKey,
          peerName: peerSide.name ?? peerSide.email,
          peerEmail: peerSide.email,
          lastMessage: m.body,
          lastAt: m.createdAt.toISOString(),
          unread: m.toUserId === userId && !m.isRead ? 1 : 0,
        });
      } else if (m.toUserId === userId && !m.isRead) {
        existing.unread += 1;
      }
    }

    const totalUnread = Array.from(conversations.values()).reduce(
      (sum, c) => sum + c.unread,
      0
    );

    return NextResponse.json({
      conversations: Array.from(conversations.values()),
      totalUnread,
    });
  } catch (error) {
    return apiError(error, {
      publicMessage: "Error al cargar mensajes",
      code: "MESSAGES_FETCH_FAILED",
      logContext: { tenantId, userId },
    });
  }
}

/** POST /api/messages — send a message */
export async function POST(request: NextRequest) {
  const [session, authError] = await requireTenant();
  if (authError) return authError;

  const { tenantId, userId } = session;

  try {
    const raw = await request.json();
    const parsed = validateBody(raw, sendMessageSchema);
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }
    const { toUserId, body } = parsed.data;

    if (toUserId === userId) {
      return NextResponse.json({ error: "No puedes enviarte mensajes a ti mismo" }, { status: 400 });
    }

    // Recipient must belong to the same tenant
    const recipient = await prisma.user.findFirst({
      where: { id: toUserId, tenantId },
      select: { id: true, name: true, email: true },
    });
    if (!recipient) {
      return NextResponse.json({ error: "Destinatario no encontrado" }, { status: 404 });
    }

    const sender = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true },
    });

    const message = await prisma.message.create({
      data: {
        tenantId,
        fromUserId: userId,
        toUserId,
        body,
      },
    });

    // Fire-and-forget notification for recipient
    const senderName = sender?.name ?? sender?.email ?? "Alguien";
    createNotification({
      tenantId,
      userId: toUserId,
      type: "new_message",
      title: `Mensaje de ${senderName}`,
      body: body.length > 120 ? body.slice(0, 117) + "…" : body,
      data: { messageId: message.id, peerId: userId },
    });

    return NextResponse.json({ message }, { status: 201 });
  } catch (error) {
    return apiError(error, {
      publicMessage: "Error al enviar mensaje",
      code: "MESSAGE_SEND_FAILED",
      logContext: { tenantId, userId },
    });
  }
}
