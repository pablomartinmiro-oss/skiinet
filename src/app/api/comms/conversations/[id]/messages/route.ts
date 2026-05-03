export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { requireTenant } from "@/lib/auth/guard";
import { prisma } from "@/lib/db";
import { apiError } from "@/lib/api-response";

/**
 * GET /api/comms/conversations/[id]/messages
 * Returns the message thread (oldest first) for a conversation.
 * Marks the conversation as read (unreadCount=0) on access.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const [session, authError] = await requireTenant();
  if (authError) return authError;
  const { tenantId } = session;
  const { id } = await params;

  try {
    const conv = await prisma.conversation.findFirst({
      where: { id, tenantId },
      include: {
        lead: { select: { id: true, name: true, email: true, phone: true, status: true } },
        client: { select: { id: true, name: true, email: true, phone: true } },
      },
    });
    if (!conv) {
      return NextResponse.json({ error: "Conversación no encontrada" }, { status: 404 });
    }

    const messages = await prisma.inboxMessage.findMany({
      where: { tenantId, conversationId: id },
      orderBy: { sentAt: "asc" },
    });

    // Mark as read
    if (conv.unreadCount > 0) {
      await prisma.conversation
        .update({
          where: { id },
          data: { unreadCount: 0 },
        })
        .catch(() => null);
    }

    return NextResponse.json({ conversation: conv, messages });
  } catch (error) {
    return apiError(error, {
      publicMessage: "No se pudo cargar la conversación",
      code: "COMMS_THREAD_ERROR",
      logContext: { tenantId, conversationId: id },
    });
  }
}
