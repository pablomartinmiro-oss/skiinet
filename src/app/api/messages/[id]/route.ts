export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { requireTenant } from "@/lib/auth/guard";
import { prisma } from "@/lib/db";
import { apiError } from "@/lib/api-response";

/** PATCH /api/messages/[id]/read — mark a single message as read */
export async function PATCH(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const [session, authError] = await requireTenant();
  if (authError) return authError;

  const { id } = await params;
  const { tenantId, userId } = session;

  try {
    await prisma.message.updateMany({
      where: { id, tenantId, toUserId: userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return apiError(error, {
      publicMessage: "Error al marcar mensaje",
      code: "MESSAGE_MARK_READ_FAILED",
      logContext: { tenantId, userId },
    });
  }
}

/** DELETE /api/messages/[id] — delete a message I sent or received */
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const [session, authError] = await requireTenant();
  if (authError) return authError;

  const { id } = await params;
  const { tenantId, userId } = session;

  try {
    await prisma.message.deleteMany({
      where: {
        id,
        tenantId,
        OR: [{ fromUserId: userId }, { toUserId: userId }],
      },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return apiError(error, {
      publicMessage: "Error al eliminar mensaje",
      code: "MESSAGE_DELETE_FAILED",
      logContext: { tenantId, userId },
    });
  }
}
