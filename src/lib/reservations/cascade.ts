import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { categoryToModule } from "@/lib/quotes/category-to-module";
import type { Prisma, RentalOrder, ActivityBooking, LodgeStay } from "@/generated/prisma/client";

const log = logger.child({ module: "reservations/cascade" });

interface CascadeResult {
  rentalOrders: RentalOrder[];
  lodgeStays: LodgeStay[];
  activityBookings: ActivityBooking[];
  skipped: number;
}

interface ServiceLike {
  type?: string | null;
  category?: string | null;
  moduleType?: string | null;
  productId?: string | null;
  description?: string | null;
  modalidad?: string | null;
  level?: string | null;
  nivel?: string | null;
  quantity?: number | null;
  unitPrice?: number | null;
  totalPrice?: number | null;
  numDays?: number | null;
  numPersons?: number | null;
  startDate?: string | Date | null;
  endDate?: string | Date | null;
  station?: string | null;
  gama?: string | null;
  tipoActividad?: string | null;
  alojamientoNombre?: string | null;
  regimen?: string | null;
  horario?: string | null;
}

/**
 * On reservation confirmation, fan out to per-module sub-records:
 *  - rental items → RentalOrder (status RESERVED) + items, decrement RentalInventory.availableQuantity
 *  - hotel items  → LodgeStay (status reservada)
 *  - instructor items → ActivityBooking (status scheduled) — instructor is picked later in planning
 *
 * Idempotent: skips items whose sub-record was already created (looked up by reservationId).
 */
export async function cascadeOnConfirm(
  tenantId: string,
  reservationId: string
): Promise<CascadeResult> {
  const reservation = await prisma.reservation.findFirst({
    where: { id: reservationId, tenantId },
    select: {
      id: true,
      tenantId: true,
      clientName: true,
      clientEmail: true,
      clientPhone: true,
      activityDate: true,
      station: true,
      schedule: true,
      services: true,
      quoteId: true,
    },
  });
  if (!reservation) throw new Error(`Reservation ${reservationId} not found`);

  const services = Array.isArray(reservation.services)
    ? (reservation.services as ServiceLike[])
    : [];

  // Already created sub-records (idempotency guard)
  const [existingRental, existingStays, existingBookings] = await Promise.all([
    prisma.rentalOrder.findFirst({ where: { tenantId, reservationId }, select: { id: true } }),
    prisma.lodgeStay.findFirst({
      where: { tenantId, guestEmail: reservation.clientEmail || undefined, checkIn: reservation.activityDate },
      select: { id: true },
    }),
    prisma.activityBooking.findFirst({ where: { tenantId, reservationId }, select: { id: true } }),
  ]);

  const result: CascadeResult = {
    rentalOrders: [],
    lodgeStays: [],
    activityBookings: [],
    skipped: 0,
  };

  // Group services by resolved module
  const buckets: Record<string, ServiceLike[]> = {
    catalog: [],
    rental: [],
    hotel: [],
    spa: [],
    instructor: [],
  };
  for (const svc of services) {
    const mt = svc.moduleType ?? categoryToModule(svc);
    (buckets[mt] ??= []).push(svc);
  }

  // ---------- RENTAL ----------
  if (buckets.rental.length > 0 && !existingRental) {
    const rentalItems = buckets.rental;
    const pickup = reservation.activityDate;
    // Use the longest numDays across rental items (default 1)
    const longestDays = Math.max(
      1,
      ...rentalItems.map((r) => Number(r.numDays ?? 1))
    );
    const returnDate = new Date(pickup.getTime() + longestDays * 86_400_000);
    const totalPrice = rentalItems.reduce((s, r) => s + Number(r.totalPrice ?? 0), 0);

    const order = await prisma.$transaction(async (tx) => {
      const created = await tx.rentalOrder.create({
        data: {
          tenantId,
          reservationId,
          clientName: reservation.clientName,
          clientEmail: reservation.clientEmail,
          clientPhone: reservation.clientPhone,
          stationSlug: reservation.station,
          pickupDate: pickup,
          returnDate,
          status: "RESERVED",
          totalPrice,
          notes: `Auto-creada al confirmar reserva ${reservationId}`,
          items: {
            createMany: {
              data: rentalItems.flatMap((r) => {
                const qty = Math.max(1, Number(r.quantity ?? 1));
                const equipmentType = (r.tipoActividad ?? "esquí").toLowerCase().startsWith("snow")
                  ? "SNOWBOARD"
                  : "SKI";
                const qualityTier = (r.gama ?? "media").toLowerCase().includes("alta")
                  ? "alta"
                  : "media";
                return Array.from({ length: qty }).map(() => ({
                  participantName: r.description ?? reservation.clientName,
                  equipmentType,
                  qualityTier,
                  itemStatus: "RESERVED" as const,
                }));
              }),
            },
          },
        },
      });

      // Decrement RentalInventory.availableQuantity for each (equipmentType, qualityTier, station) tuple
      await reserveInventoryForOrder(tx, tenantId, reservation.station, rentalItems);
      return created;
    });
    result.rentalOrders.push(order);
    log.info({ tenantId, reservationId, rentalOrderId: order.id }, "Auto-created RentalOrder");
  } else if (buckets.rental.length > 0 && existingRental) {
    result.skipped++;
  }

  // ---------- HOTEL ----------
  if (buckets.hotel.length > 0 && !existingStays) {
    for (const h of buckets.hotel) {
      const nights = Math.max(1, Number(h.numDays ?? 1));
      const checkIn = h.startDate ? new Date(h.startDate) : reservation.activityDate;
      const checkOut = h.endDate
        ? new Date(h.endDate)
        : new Date(checkIn.getTime() + nights * 86_400_000);
      const guests = Math.max(1, Number(h.numPersons ?? 1));

      const stay = await prisma.lodgeStay.create({
        data: {
          tenantId,
          guestName: reservation.clientName,
          guestEmail: reservation.clientEmail || null,
          guestPhone: reservation.clientPhone || null,
          checkIn,
          checkOut,
          adults: guests,
          totalAmount: Number(h.totalPrice ?? 0),
          status: "reservada",
          notes: `Auto-creada al confirmar reserva ${reservationId}${h.alojamientoNombre ? ` · ${h.alojamientoNombre}` : ""}`,
        },
      });
      result.lodgeStays.push(stay);
      log.info({ tenantId, reservationId, lodgeStayId: stay.id }, "Auto-created LodgeStay");
    }
  } else if (buckets.hotel.length > 0 && existingStays) {
    result.skipped++;
  }

  // ---------- INSTRUCTOR (class) ----------
  if (buckets.instructor.length > 0 && !existingBookings) {
    const booking = await prisma.activityBooking.create({
      data: {
        tenantId,
        reservationId,
        activityDate: reservation.activityDate,
        status: "scheduled",
        operationalNotes: `Auto-creada · ${buckets.instructor.length} clase(s) pendiente(s) de asignación de monitor`,
      },
    });
    result.activityBookings.push(booking);
    log.info({ tenantId, reservationId, bookingId: booking.id }, "Auto-created ActivityBooking");
  } else if (buckets.instructor.length > 0 && existingBookings) {
    result.skipped++;
  }

  return result;
}

async function reserveInventoryForOrder(
  tx: Prisma.TransactionClient,
  tenantId: string,
  stationSlug: string,
  items: ServiceLike[]
): Promise<void> {
  for (const r of items) {
    const equipmentType = (r.tipoActividad ?? "esquí").toLowerCase().startsWith("snow")
      ? "SNOWBOARD"
      : "SKI";
    const qualityTier = (r.gama ?? "media").toLowerCase().includes("alta") ? "alta" : "media";
    const qty = Math.max(1, Number(r.quantity ?? 1));

    const inv = await tx.rentalInventory.findFirst({
      where: {
        tenantId,
        stationSlug,
        equipmentType,
        qualityTier,
        availableQuantity: { gte: qty },
      },
      orderBy: { availableQuantity: "desc" },
    });
    if (inv) {
      await tx.rentalInventory.update({
        where: { id: inv.id },
        data: { availableQuantity: { decrement: qty } },
      });
    } else {
      log.warn(
        { tenantId, stationSlug, equipmentType, qualityTier, qty },
        "No matching inventory pool to decrement — order created without reservation"
      );
    }
  }
}

/**
 * On reservation cancellation, release rental inventory + cancel sub-records.
 * Hotel + class records are soft-cancelled.
 */
export async function cascadeOnCancel(
  tenantId: string,
  reservationId: string
): Promise<{ released: number; cancelled: number }> {
  let released = 0;
  let cancelled = 0;

  const orders = await prisma.rentalOrder.findMany({
    where: {
      tenantId,
      reservationId,
      status: { in: ["RESERVED", "PREPARED"] },
    },
    include: { items: true },
  });

  for (const order of orders) {
    await prisma.$transaction(async (tx) => {
      await tx.rentalOrder.update({
        where: { id: order.id },
        data: { status: "CANCELLED", cancelledAt: new Date() },
      });
      await tx.rentalOrderItem.updateMany({
        where: { rentalOrderId: order.id },
        data: { itemStatus: "RESERVED" },
      });

      // Re-increment inventory pools
      const byKey = new Map<string, number>();
      for (const it of order.items) {
        const key = `${it.equipmentType}::${it.qualityTier}`;
        byKey.set(key, (byKey.get(key) ?? 0) + 1);
      }
      for (const [key, qty] of byKey.entries()) {
        const [equipmentType, qualityTier] = key.split("::");
        const inv = await tx.rentalInventory.findFirst({
          where: { tenantId, stationSlug: order.stationSlug, equipmentType, qualityTier },
        });
        if (inv) {
          await tx.rentalInventory.update({
            where: { id: inv.id },
            data: {
              availableQuantity: Math.min(inv.totalQuantity, inv.availableQuantity + qty),
            },
          });
          released += qty;
        }
      }
      cancelled++;
    });
  }

  await prisma.activityBooking.updateMany({
    where: { tenantId, reservationId, status: { in: ["scheduled", "pending", "confirmed"] } },
    data: { status: "cancelled" },
  });

  await prisma.lodgeStay.updateMany({
    where: {
      tenantId,
      guestEmail: { not: null },
      status: { in: ["reservada", "checkin"] },
      notes: { contains: reservationId },
    },
    data: { status: "cancelada" },
  });

  log.info({ tenantId, reservationId, released, cancelled }, "Cascade cancel completed");
  return { released, cancelled };
}
