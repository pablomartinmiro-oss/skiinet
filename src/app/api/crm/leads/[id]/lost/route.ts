export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireTenant } from "@/lib/auth/guard";
import { prisma } from "@/lib/db";
import { apiError, badRequest } from "@/lib/api-response";
import { validateBody } from "@/lib/validation";
import { logCrmActivityAsync } from "@/lib/crm/activity-log";

const markLostSchema = z.object({
  reason: z.string().min(1, "Motivo obligatorio").max(500),
});

/**
 * POST /api/crm/leads/[id]/lost
 * Mark a Lead as lost with a stored reason. Idempotent — re-marking a
 * lost lead overwrites the reason and logs a fresh "lost" activity.
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
    const validated = validateBody(body, markLostSchema);
    if (!validated.ok) return badRequest(validated.error);

    const lead = await prisma.lead.findFirst({
      where: { id, tenantId },
      select: { id: true, status: true, lostReason: true },
    });
    if (!lead) {
      return NextResponse.json({ error: "Lead no encontrado" }, { status: 404 });
    }

    const updated = await prisma.lead.update({
      where: { id },
      data: {
        status: "perdido",
        pipelineStage: "perdido",
        lostReason: validated.data.reason,
      },
      select: { id: true, status: true, lostReason: true },
    });

    logCrmActivityAsync({
      tenantId,
      entityType: "lead",
      entityId: id,
      action: "lost",
      actorId: userId,
      actorName: email ?? null,
      details: {
        oldStatus: lead.status,
        newStatus: "perdido",
        reason: validated.data.reason,
      },
    });

    return NextResponse.json({ lead: updated });
  } catch (error) {
    return apiError(error, {
      publicMessage: "No se pudo marcar como perdido",
      code: "LEAD_LOST_ERROR",
      logContext: { tenantId, leadId: id },
    });
  }
}
