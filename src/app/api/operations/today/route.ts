export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { requireTenant } from "@/lib/auth/guard";
import { prisma } from "@/lib/db";
import { apiError } from "@/lib/api-response";

/**
 * GET /api/operations/today — aggregated snapshot of today's operations.
 * Designed for an auto-refreshing dashboard (60s).
 *
 * Returns:
 *  - classesNow: GroupCells happening today (by status / time)
 *  - rentalsActive: RentalOrders currently picked up but not returned
 *  - reservationsToday: today's reservations (pending check-in)
 *  - invoicesUnpaid: invoices "sent" status, total amount + count
 *  - leadsNew: leads in "nuevo" status not yet contacted
 */
export async function GET() {
  const [session, authError] = await requireTenant();
  if (authError) return authError;
  const { tenantId } = session;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today.getTime() + 86_400_000);

  try {
    const [classesNow, rentalsActive, reservationsToday, invoicesUnpaid, leadsNew] = await Promise.all([
      prisma.groupCell.findMany({
        where: {
          tenantId,
          activityDate: { gte: today, lt: tomorrow },
          status: { in: ["draft", "confirmed", "in_progress"] },
        },
        include: {
          instructor: { select: { id: true, tdLevel: true, user: { select: { name: true } } } },
          meetingPoint: { select: { id: true, name: true } },
          _count: { select: { units: true, checkIns: true } },
        },
        orderBy: { timeSlotStart: "asc" },
        take: 50,
      }),

      prisma.rentalOrder.findMany({
        where: {
          tenantId,
          status: { in: ["RESERVED", "PREPARED", "PICKED_UP"] },
          pickupDate: { lte: tomorrow },
          returnDate: { gte: today },
        },
        select: {
          id: true,
          clientName: true,
          stationSlug: true,
          status: true,
          pickupDate: true,
          returnDate: true,
          totalPrice: true,
          _count: { select: { items: true } },
        },
        orderBy: { pickupDate: "asc" },
        take: 50,
      }),

      prisma.reservation.findMany({
        where: {
          tenantId,
          activityDate: { gte: today, lt: tomorrow },
          status: { in: ["pendiente", "confirmada"] },
        },
        select: {
          id: true,
          clientName: true,
          clientPhone: true,
          station: true,
          schedule: true,
          status: true,
          totalPrice: true,
        },
        orderBy: { createdAt: "asc" },
        take: 80,
      }),

      prisma.invoice.findMany({
        where: { tenantId, status: { in: ["sent", "draft"] } },
        select: {
          id: true,
          number: true,
          total: true,
          issuedAt: true,
          createdAt: true,
          reminderCount: true,
          client: { select: { name: true } },
        },
        orderBy: { issuedAt: "asc" },
        take: 30,
      }),

      prisma.lead.findMany({
        where: { tenantId, status: "nuevo" },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          source: true,
          score: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        take: 30,
      }),
    ]);

    const totals = {
      classesNow: classesNow.length,
      rentalsActive: rentalsActive.length,
      reservationsToday: reservationsToday.length,
      invoicesUnpaid: invoicesUnpaid.length,
      invoicesUnpaidAmount: invoicesUnpaid.reduce((s, i) => s + i.total, 0),
      leadsNew: leadsNew.length,
    };

    return NextResponse.json({
      date: today.toISOString().slice(0, 10),
      totals,
      classesNow,
      rentalsActive,
      reservationsToday,
      invoicesUnpaid,
      leadsNew,
    });
  } catch (error) {
    return apiError(error, {
      publicMessage: "Error al cargar el panel operacional",
      code: "OPERATIONS_TODAY_ERROR",
      logContext: { tenantId },
    });
  }
}
