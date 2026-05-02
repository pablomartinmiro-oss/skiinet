export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { requireTenant } from "@/lib/auth/guard";
import { prisma } from "@/lib/db";
import { apiError } from "@/lib/api-response";

/**
 * GET /api/operations/today — operations dashboard snapshot for today.
 * Returns: stats, today's rental orders (with items), today's classes (with instructor),
 * and instructors with assignments today.
 */
export async function GET() {
  const [session, authError] = await requireTenant();
  if (authError) return authError;
  const { tenantId } = session;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today.getTime() + 86_400_000);
  const nowHHmm = new Date().toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Europe/Madrid",
  });

  try {
    const [classesToday, rentalsToday, reservationsToday, invoicesUnpaid, leadsNew] = await Promise.all([
      prisma.groupCell.findMany({
        where: {
          tenantId,
          activityDate: { gte: today, lt: tomorrow },
          status: { in: ["draft", "confirmed", "in_progress"] },
        },
        include: {
          instructor: { select: { id: true, tdLevel: true, station: true, user: { select: { name: true } } } },
          meetingPoint: { select: { id: true, name: true } },
          _count: { select: { units: true, checkIns: true } },
        },
        orderBy: { timeSlotStart: "asc" },
        take: 100,
      }),

      prisma.rentalOrder.findMany({
        where: {
          tenantId,
          status: { in: ["RESERVED", "PREPARED", "PICKED_UP"] },
          pickupDate: { lt: tomorrow },
          returnDate: { gte: today },
        },
        include: {
          items: {
            select: {
              id: true,
              participantName: true,
              equipmentType: true,
              size: true,
              qualityTier: true,
              itemStatus: true,
            },
          },
        },
        orderBy: { pickupDate: "asc" },
        take: 100,
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

    // Derive instructors on shift from today's classes (grouped by instructorId)
    const instructorMap = new Map<
      string,
      {
        id: string;
        name: string;
        tdLevel: string;
        station: string;
        classesCount: number;
        currentStatus: "en_clase" | "libre";
        nextClassTime: string | null;
      }
    >();

    for (const c of classesToday) {
      if (!c.instructor) continue;
      const id = c.instructor.id;
      const name = c.instructor.user?.name ?? "Sin nombre";
      const tdLevel = c.instructor.tdLevel;
      const station = c.instructor.station;
      const existing = instructorMap.get(id) ?? {
        id,
        name,
        tdLevel,
        station,
        classesCount: 0,
        currentStatus: "libre" as const,
        nextClassTime: null as string | null,
      };
      existing.classesCount += 1;
      const inClass = c.timeSlotStart <= nowHHmm && nowHHmm < c.timeSlotEnd;
      if (inClass) existing.currentStatus = "en_clase";
      if (c.timeSlotStart >= nowHHmm && (!existing.nextClassTime || c.timeSlotStart < existing.nextClassTime)) {
        existing.nextClassTime = c.timeSlotStart;
      }
      instructorMap.set(id, existing);
    }

    const instructorsToday = Array.from(instructorMap.values()).sort((a, b) => a.name.localeCompare(b.name));

    // Material pendiente devolución: rental orders whose returnDate is today (or earlier)
    // and that are still not RETURNED
    const materialPending = rentalsToday.filter(
      (r) => r.returnDate <= tomorrow && r.status !== "RETURNED"
    );

    const totals = {
      classesToday: classesToday.length,
      rentalsActive: rentalsToday.filter((r) => r.status === "PICKED_UP" || r.status === "PREPARED").length,
      instructorsOnShift: instructorsToday.length,
      materialPendingReturn: materialPending.length,
      reservationsToday: reservationsToday.length,
      invoicesUnpaid: invoicesUnpaid.length,
      invoicesUnpaidAmount: invoicesUnpaid.reduce((s, i) => s + i.total, 0),
      leadsNew: leadsNew.length,
    };

    return NextResponse.json({
      date: today.toISOString().slice(0, 10),
      now: nowHHmm,
      totals,
      classesToday,
      rentalsToday,
      instructorsToday,
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
