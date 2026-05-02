export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { requireTenant } from "@/lib/auth/guard";
import { requireModule } from "@/lib/modules/guard";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { apiError } from "@/lib/api-response";
import { validateBody, clockOutSchema } from "@/lib/validation";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, context: Ctx) {
  const [session, authError] = await requireTenant();
  if (authError) return authError;

  const { tenantId } = session;
  const modError = await requireModule(tenantId, "instructors");
  if (modError) return modError;

  const { id } = await context.params;
  const log = logger.child({ tenantId, path: `/api/instructors/time-entries/${id}` });

  try {
    const entry = await prisma.instructorTimeEntry.findFirst({
      where: { id, tenantId },
    });
    if (!entry) {
      return NextResponse.json({ error: "Fichaje no encontrado" }, { status: 404 });
    }

    // Cannot edit locked entries
    if (entry.lockedAt) {
      return NextResponse.json(
        { error: "Este fichaje esta bloqueado. Use la funcion de correccion." },
        { status: 409 }
      );
    }

    // Already clocked out
    if (entry.clockOut) {
      return NextResponse.json(
        { error: "Este fichaje ya tiene salida registrada" },
        { status: 409 }
      );
    }

    const body = await request.json();
    const validated = validateBody(body, clockOutSchema);
    if (!validated.ok) {
      return NextResponse.json({ error: validated.error }, { status: 400 });
    }
    const data = validated.data;

    const now = new Date();
    const totalMinutes = Math.round((now.getTime() - entry.clockIn.getTime()) / 60000);
    const breakMinutes = data.breakMinutes ?? 0;
    const netMinutes = Math.max(0, totalMinutes - breakMinutes);

    const updated = await prisma.instructorTimeEntry.update({
      where: { id },
      data: {
        clockOut: now,
        totalMinutes,
        breakMinutes,
        netMinutes,
        notes: data.notes ?? null,
        clockOutLat: data.clockOutLat ?? null,
        clockOutLon: data.clockOutLon ?? null,
      },
      include: {
        instructor: {
          select: { id: true, user: { select: { id: true, name: true, email: true } } },
        },
      },
    });

    log.info({ entryId: id, netMinutes }, "Clock out recorded");
    return NextResponse.json({ entry: updated });
  } catch (error) {
    return apiError(error, {
      publicMessage: "Error al fichar salida",
      code: "CLOCK_OUT_ERROR",
      logContext: { tenantId },
    });
  }
}
