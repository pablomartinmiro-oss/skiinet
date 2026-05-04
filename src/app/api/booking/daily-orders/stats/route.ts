export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { requireTenant } from "@/lib/auth/guard";
import { prisma } from "@/lib/db";
import { apiError, badRequest } from "@/lib/api-response";

/**
 * GET /api/booking/daily-orders/stats?date=YYYY-MM-DD
 *
 * Operational dashboard for one day:
 *   - Reservations by status (pendiente/confirmada/sin_disponibilidad/cancelada)
 *   - Activity bookings by status (scheduled/pending/confirmed/cancelled)
 *   - Total clients arrived vs scheduled
 *   - Top stations
 */
export async function GET(request: NextRequest) {
  const [session, authError] = await requireTenant();
  if (authError) return authError;
  const { tenantId } = session;

  const url = request.nextUrl;
  const dateRaw = url.searchParams.get("date");
  if (!dateRaw) return badRequest("date es obligatorio (YYYY-MM-DD)");
  const date = new Date(dateRaw);
  if (Number.isNaN(date.getTime())) return badRequest("Fecha inválida");

  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  try {
    const [reservationsByStatus, activitiesByStatus, arrivedAgg, byStation] = await Promise.all([
      prisma.reservation.groupBy({
        by: ["status"],
        where: { tenantId, activityDate: { gte: startOfDay, lte: endOfDay } },
        _count: { _all: true },
      }),
      prisma.activityBooking.groupBy({
        by: ["status"],
        where: { tenantId, activityDate: { gte: startOfDay, lte: endOfDay } },
        _count: { _all: true },
      }),
      prisma.activityBooking.aggregate({
        where: {
          tenantId,
          activityDate: { gte: startOfDay, lte: endOfDay },
          arrivedClient: true,
        },
        _count: { _all: true },
      }),
      prisma.reservation.groupBy({
        by: ["station"],
        where: { tenantId, activityDate: { gte: startOfDay, lte: endOfDay } },
        _count: { _all: true },
        orderBy: { _count: { id: "desc" } },
        take: 10,
      }),
    ]);

    const reservationStatusMap: Record<string, number> = {};
    for (const r of reservationsByStatus) reservationStatusMap[r.status] = r._count._all;
    const activityStatusMap: Record<string, number> = {};
    for (const r of activitiesByStatus) activityStatusMap[r.status] = r._count._all;

    const totalActivities = activitiesByStatus.reduce((s, r) => s + r._count._all, 0);

    return NextResponse.json({
      date: dateRaw,
      reservations: {
        total: Object.values(reservationStatusMap).reduce((s, n) => s + n, 0),
        byStatus: reservationStatusMap,
      },
      activities: {
        total: totalActivities,
        byStatus: activityStatusMap,
        arrivedCount: arrivedAgg._count._all,
        arrivalRate: totalActivities > 0
          ? Math.round((arrivedAgg._count._all / totalActivities) * 1000) / 10
          : 0,
      },
      byStation: byStation.map((row) => ({
        station: row.station,
        count: row._count._all,
      })),
    });
  } catch (error) {
    return apiError(error, {
      publicMessage: "No se pudieron cargar las estadísticas",
      code: "DAILY_ORDER_STATS_ERROR",
      logContext: { tenantId, date: dateRaw },
    });
  }
}
