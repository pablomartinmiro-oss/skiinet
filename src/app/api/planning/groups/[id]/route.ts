export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { requireTenant } from "@/lib/auth/guard";
import { requireModule } from "@/lib/modules/guard";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { apiError } from "@/lib/api-response";
import { validateBody, updateGroupCellSchema } from "@/lib/validation";
import { createNotification } from "@/lib/notifications/create";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, context: Ctx) {
  const [session, authError] = await requireTenant();
  if (authError) return authError;
  const { tenantId } = session;
  const modError = await requireModule(tenantId, "instructors");
  if (modError) return modError;
  const { id } = await context.params;

  try {
    const group = await prisma.groupCell.findFirst({
      where: { id, tenantId },
      include: {
        instructor: { select: { id: true, tdLevel: true, user: { select: { name: true, email: true } } } },
        meetingPoint: true,
        units: { include: { participant: true, reservation: { select: { clientName: true, clientPhone: true } } } },
        checkIns: true,
        incidents: { orderBy: { createdAt: "desc" } },
      },
    });
    if (!group) {
      return NextResponse.json({ error: "Grupo no encontrado" }, { status: 404 });
    }
    return NextResponse.json({ group });
  } catch (error) {
    return apiError(error, { publicMessage: "Error", code: "GROUP_GET_ERROR", logContext: { tenantId } });
  }
}

export async function PATCH(request: NextRequest, context: Ctx) {
  const [session, authError] = await requireTenant();
  if (authError) return authError;
  const { tenantId } = session;
  const modError = await requireModule(tenantId, "instructors");
  if (modError) return modError;
  const { id } = await context.params;
  const log = logger.child({ tenantId, path: `/api/planning/groups/${id}` });

  try {
    const existing = await prisma.groupCell.findFirst({ where: { id, tenantId } });
    if (!existing) {
      return NextResponse.json({ error: "Grupo no encontrado" }, { status: 404 });
    }
    const body = await request.json();
    const validated = validateBody(body, updateGroupCellSchema);
    if (!validated.ok) {
      return NextResponse.json({ error: validated.error }, { status: 400 });
    }
    const group = await prisma.groupCell.update({
      where: { id },
      data: validated.data,
      include: {
        instructor: { select: { id: true, tdLevel: true, user: { select: { id: true, name: true } } } },
        _count: { select: { units: true } },
      },
    });
    log.info({ groupId: id }, "GroupCell updated");

    // Notify newly-assigned instructor (only when instructorId changed to a non-null value)
    const newInstructorId = validated.data.instructorId;
    if (
      newInstructorId &&
      newInstructorId !== existing.instructorId &&
      group.instructor?.user?.id
    ) {
      const dateStr = new Date(group.activityDate).toLocaleDateString("es-ES", {
        day: "numeric", month: "long",
      });
      createNotification({
        tenantId,
        userId: group.instructor.user.id,
        type: "clase_asignada",
        title: "Clase asignada",
        body: `Tienes una nueva clase el ${dateStr} de ${group.timeSlotStart} a ${group.timeSlotEnd} en ${group.station} (${group.discipline} ${group.level}).`,
        data: { groupCellId: group.id, activityDate: group.activityDate, station: group.station },
      });
    }

    return NextResponse.json({ group });
  } catch (error) {
    return apiError(error, { publicMessage: "Error al actualizar grupo", code: "GROUP_UPDATE_ERROR", logContext: { tenantId } });
  }
}

export async function DELETE(_request: NextRequest, context: Ctx) {
  const [session, authError] = await requireTenant();
  if (authError) return authError;
  const { tenantId } = session;
  const modError = await requireModule(tenantId, "instructors");
  if (modError) return modError;
  const { id } = await context.params;
  const log = logger.child({ tenantId, path: `/api/planning/groups/${id}` });

  try {
    const existing = await prisma.groupCell.findFirst({ where: { id, tenantId } });
    if (!existing) {
      return NextResponse.json({ error: "Grupo no encontrado" }, { status: 404 });
    }
    // Release OUs back to pending
    await prisma.operationalUnit.updateMany({
      where: { groupCellId: id },
      data: { groupCellId: null, status: "pending" },
    });
    await prisma.groupCell.delete({ where: { id } });
    log.info({ groupId: id }, "GroupCell dissolved");
    return NextResponse.json({ success: true });
  } catch (error) {
    return apiError(error, { publicMessage: "Error al eliminar grupo", code: "GROUP_DELETE_ERROR", logContext: { tenantId } });
  }
}
