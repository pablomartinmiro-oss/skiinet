export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireTenant } from "@/lib/auth/guard";
import { prisma } from "@/lib/db";
import { apiError, badRequest } from "@/lib/api-response";
import { validateBody } from "@/lib/validation";
import { logCrmActivityAsync } from "@/lib/crm/activity-log";

const rejectSchema = z.object({
  reason: z.string().min(1, "Motivo obligatorio").max(1000),
});

/**
 * POST /api/cancellations/[id]/reject
 *
 * Reject a pending cancellation request. Sets resolution=rejected,
 * status=resuelta, financialStatus=null, and writes a CancellationLog.
 * Idempotent — re-rejection updates reason and timestamp.
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
    const validated = validateBody(body, rejectSchema);
    if (!validated.ok) return badRequest(validated.error);

    const request_ = await prisma.cancellationRequest.findFirst({
      where: { id, tenantId },
      select: { id: true, status: true },
    });
    if (!request_) {
      return NextResponse.json({ error: "Solicitud no encontrada" }, { status: 404 });
    }

    const updated = await prisma.$transaction(async (tx) => {
      const r = await tx.cancellationRequest.update({
        where: { id },
        data: {
          status: "resuelta",
          resolution: "rejected",
          resolvedAt: new Date(),
        },
      });
      await tx.cancellationLog.create({
        data: {
          tenantId,
          requestId: id,
          previousStatus: request_.status,
          newStatus: "resuelta",
          actorId: userId,
          notes: `Rechazada: ${validated.data.reason}`,
        },
      });
      return r;
    });

    logCrmActivityAsync({
      tenantId,
      entityType: "reservation",
      entityId: id, // tracking on cancellation entity
      action: "status_changed",
      actorId: userId,
      actorName: email ?? null,
      details: {
        kind: "cancellation_rejected",
        oldStatus: request_.status,
        newStatus: "resuelta",
        reason: validated.data.reason,
      },
    });

    return NextResponse.json({ request: updated });
  } catch (error) {
    return apiError(error, {
      publicMessage: "No se pudo rechazar la solicitud",
      code: "CANCELLATION_REJECT_ERROR",
      logContext: { tenantId, requestId: id },
    });
  }
}
