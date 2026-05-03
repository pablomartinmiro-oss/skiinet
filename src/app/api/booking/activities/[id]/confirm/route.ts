export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireTenant } from "@/lib/auth/guard";
import { prisma } from "@/lib/db";
import { apiError, badRequest } from "@/lib/api-response";
import { validateBody } from "@/lib/validation";
import { logCrmActivityAsync } from "@/lib/crm/activity-log";

const confirmSchema = z.object({
  notes: z.string().max(2000).optional(),
});

/**
 * POST /api/booking/activities/[id]/confirm
 * Mark an ActivityBooking as the client has arrived. Sets:
 *   - arrivedClient = true
 *   - status = "confirmed" (if not already cancelled)
 * Idempotent.
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
    const body = await request.json().catch(() => ({}));
    const validated = validateBody(body, confirmSchema);
    if (!validated.ok) return badRequest(validated.error);

    const ab = await prisma.activityBooking.findFirst({
      where: { id, tenantId },
      select: { id: true, status: true, arrivedClient: true, operationalNotes: true },
    });
    if (!ab) {
      return NextResponse.json({ error: "Actividad no encontrada" }, { status: 404 });
    }

    if (ab.status === "cancelled") {
      return badRequest("Actividad cancelada — no se puede confirmar llegada");
    }

    const updated = await prisma.activityBooking.update({
      where: { id },
      data: {
        arrivedClient: true,
        status: ab.status === "scheduled" || ab.status === "pending" ? "confirmed" : ab.status,
        operationalNotes: validated.data.notes
          ? [ab.operationalNotes, validated.data.notes].filter(Boolean).join("\n")
          : ab.operationalNotes,
      },
    });

    logCrmActivityAsync({
      tenantId,
      entityType: "reservation",
      entityId: updated.reservationId,
      action: "status_changed",
      actorId: userId,
      actorName: email ?? null,
      details: {
        kind: "activity_arrival_confirmed",
        activityBookingId: id,
        notes: validated.data.notes ?? null,
      },
    });

    return NextResponse.json({ activity: updated });
  } catch (error) {
    return apiError(error, {
      publicMessage: "No se pudo confirmar la llegada",
      code: "ACTIVITY_CONFIRM_ERROR",
      logContext: { tenantId, activityId: id },
    });
  }
}
