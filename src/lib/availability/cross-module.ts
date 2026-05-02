import { prisma } from "@/lib/db";

/**
 * Cross-module availability check. Given a tenant, a target date, and a list
 * of items spanning multiple modules, returns per-item availability (parallel
 * Postgres queries via Promise.all). Callers can use the result to either
 * block a Quote/Reservation creation or surface the next available slot.
 */

export interface AvailabilityClassItem {
  type: "class";
  productId: string;        // Product catalog id (used to derive serviceType + station)
  qty: number;              // Number of seats requested
  serviceType?: string;     // Override service slug if needed
  station?: string;
}

export interface AvailabilityRentalItem {
  type: "rental";
  inventoryId: string;      // RentalInventory id
  qty: number;
  station?: string;
}

export interface AvailabilityHotelItem {
  type: "hotel";
  roomTypeId: string;
  nights: number;
  units?: number;           // Number of rooms requested (default 1)
}

export interface AvailabilityInstructorItem {
  type: "instructor";
  level?: string;
  qty: number;
  station?: string;
  startTime?: string;       // "10:00" — for slot conflict check
  endTime?: string;
}

export type AvailabilityItem =
  | AvailabilityClassItem
  | AvailabilityRentalItem
  | AvailabilityHotelItem
  | AvailabilityInstructorItem;

export interface AvailabilitySlot {
  ok: boolean;
  reason?: string;          // Human-readable Spanish reason when ok=false
  available: number;        // What we can offer right now
  requested: number;
  nextAvailableDate?: string; // ISO yyyy-mm-dd of next free date (rental + hotel + class)
}

export interface AvailabilityResult {
  ok: boolean;
  date: string;             // ISO yyyy-mm-dd
  items: Array<AvailabilitySlot & { input: AvailabilityItem }>;
}

const DAY_MS = 86_400_000;

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function startOfDay(d: Date | string): Date {
  const dt = new Date(d);
  dt.setHours(0, 0, 0, 0);
  return dt;
}

// ==================== CLASS ====================

async function checkClass(
  tenantId: string,
  date: Date,
  item: AvailabilityClassItem
): Promise<AvailabilitySlot> {
  const product = await prisma.product.findFirst({
    where: { id: item.productId, OR: [{ tenantId }, { tenantId: null }] },
    select: { category: true, station: true, name: true },
  });
  if (!product) {
    return {
      ok: false,
      reason: "Producto no encontrado",
      available: 0,
      requested: item.qty,
    };
  }

  const station = item.station ?? product.station ?? "all";
  // serviceType slug aligns with StationCapacity convention
  const serviceType =
    item.serviceType ??
    (product.category === "clase_particular"
      ? "clase_particular"
      : product.category === "escuela"
        ? "cursillo_adulto"
        : "general");

  const cap = await prisma.stationCapacity.findFirst({
    where: { tenantId, station, date: startOfDay(date), serviceType },
    select: { maxCapacity: true, booked: true },
  });

  // No capacity row → assumed unrestricted (we'd flag this in setup)
  if (!cap) {
    return { ok: true, available: item.qty, requested: item.qty };
  }

  const remaining = Math.max(0, cap.maxCapacity - cap.booked);
  if (remaining >= item.qty) {
    return { ok: true, available: remaining, requested: item.qty };
  }

  // Probe next 14 days for the first slot with enough room
  let nextAvailable: string | undefined;
  for (let i = 1; i <= 14; i++) {
    const probe = new Date(date.getTime() + i * DAY_MS);
    const next = await prisma.stationCapacity.findFirst({
      where: { tenantId, station, date: startOfDay(probe), serviceType },
      select: { maxCapacity: true, booked: true },
    });
    if (!next || next.maxCapacity - next.booked >= item.qty) {
      nextAvailable = isoDate(probe);
      break;
    }
  }

  return {
    ok: false,
    reason: `Sin plazas para ${product.name} en ${station} (${remaining}/${cap.maxCapacity})`,
    available: remaining,
    requested: item.qty,
    nextAvailableDate: nextAvailable,
  };
}

// ==================== RENTAL ====================

async function checkRental(
  tenantId: string,
  date: Date,
  item: AvailabilityRentalItem
): Promise<AvailabilitySlot> {
  const inv = await prisma.rentalInventory.findFirst({
    where: { id: item.inventoryId, tenantId },
    select: {
      availableQuantity: true,
      totalQuantity: true,
      condition: true,
      equipmentType: true,
      size: true,
      qualityTier: true,
      stationSlug: true,
    },
  });
  if (!inv) {
    return {
      ok: false,
      reason: "Inventario de alquiler no encontrado",
      available: 0,
      requested: item.qty,
    };
  }
  if (inv.condition === "baja" || inv.condition === "mantenimiento") {
    return {
      ok: false,
      reason: `Equipo en estado "${inv.condition}"`,
      available: 0,
      requested: item.qty,
    };
  }

  // Effective availability = stock - active rental orders that overlap `date`
  const overlapping = await prisma.rentalOrder.findMany({
    where: {
      tenantId,
      stationSlug: inv.stationSlug,
      status: { in: ["RESERVED", "PREPARED", "PICKED_UP"] },
      pickupDate: { lte: date },
      returnDate: { gte: date },
    },
    select: {
      items: {
        where: {
          equipmentType: inv.equipmentType,
          qualityTier: inv.qualityTier,
          ...(inv.size ? { OR: [{ size: inv.size }, { size: null }] } : {}),
        },
        select: { id: true },
      },
    },
  });
  const blocked = overlapping.reduce((sum, o) => sum + o.items.length, 0);
  const available = Math.max(0, inv.availableQuantity - blocked);

  if (available >= item.qty) {
    return { ok: true, available, requested: item.qty };
  }

  return {
    ok: false,
    reason: `Solo ${available} unidades disponibles de ${inv.equipmentType} ${inv.size ?? ""} ${inv.qualityTier}`,
    available,
    requested: item.qty,
  };
}

// ==================== HOTEL ====================

async function checkHotel(
  tenantId: string,
  date: Date,
  item: AvailabilityHotelItem
): Promise<AvailabilitySlot> {
  const roomType = await prisma.roomType.findFirst({
    where: { id: item.roomTypeId, tenantId },
    select: { id: true, title: true, capacity: true, active: true },
  });
  if (!roomType || !roomType.active) {
    return {
      ok: false,
      reason: "Tipo de habitación no disponible",
      available: 0,
      requested: item.units ?? 1,
    };
  }

  const nights = Math.max(1, item.nights);
  const unitsRequested = item.units ?? 1;
  const checkIn = startOfDay(date);
  const checkOut = new Date(checkIn.getTime() + nights * DAY_MS);

  // Total rooms of this type — use roomType.capacity as a proxy when no
  // explicit "total units" tracker exists. (capacity often holds room count.)
  const totalUnits = Math.max(1, roomType.capacity);

  // Active stays overlapping any night between [checkIn, checkOut)
  const stays = await prisma.lodgeStay.count({
    where: {
      tenantId,
      roomTypeId: roomType.id,
      status: { in: ["reservada", "checkin"] },
      checkIn: { lt: checkOut },
      checkOut: { gt: checkIn },
    },
  });

  const blocks = await prisma.roomBlock.aggregate({
    where: {
      tenantId,
      roomTypeId: roomType.id,
      date: { gte: checkIn, lt: checkOut },
    },
    _sum: { unitCount: true },
  });
  const blockedUnits = blocks._sum.unitCount ?? 0;

  // Worst-night availability across the stay window
  const available = Math.max(0, totalUnits - stays - blockedUnits);
  if (available >= unitsRequested) {
    return { ok: true, available, requested: unitsRequested };
  }

  return {
    ok: false,
    reason: `Solo ${available} habitaciones de ${roomType.title} para esas fechas`,
    available,
    requested: unitsRequested,
  };
}

// ==================== INSTRUCTOR ====================

async function checkInstructor(
  tenantId: string,
  date: Date,
  item: AvailabilityInstructorItem
): Promise<AvailabilitySlot> {
  const where: Record<string, unknown> = { tenantId, isActive: true };
  if (item.station) where.station = item.station;
  // tdLevel maps to "TD1"/"TD2"/"TD3" — caller passes that pattern
  if (item.level) where.tdLevel = item.level;

  const eligible = await prisma.instructor.count({ where });

  // Subtract instructors with overlapping assignments on that date
  const dayStart = startOfDay(date);
  const dayEnd = new Date(dayStart.getTime() + DAY_MS);
  const busy = await prisma.instructor.count({
    where: {
      ...where,
      groupCells: {
        some: {
          activityDate: { gte: dayStart, lt: dayEnd },
          status: { in: ["draft", "confirmed", "in_progress"] },
          ...(item.startTime && item.endTime
            ? {
                timeSlotStart: { lte: item.endTime },
                timeSlotEnd: { gte: item.startTime },
              }
            : {}),
        },
      },
    },
  });

  const available = Math.max(0, eligible - busy);
  if (available >= item.qty) {
    return { ok: true, available, requested: item.qty };
  }
  return {
    ok: false,
    reason: `Solo ${available} profesor(es) disponibles${item.level ? ` con nivel ${item.level}` : ""}`,
    available,
    requested: item.qty,
  };
}

// ==================== ENTRYPOINT ====================

export async function checkCrossModuleAvailability(
  tenantId: string,
  date: Date | string,
  items: AvailabilityItem[]
): Promise<AvailabilityResult> {
  const targetDate = startOfDay(date);

  const checks = await Promise.all(
    items.map((item) => {
      switch (item.type) {
        case "class":
          return checkClass(tenantId, targetDate, item);
        case "rental":
          return checkRental(tenantId, targetDate, item);
        case "hotel":
          return checkHotel(tenantId, targetDate, item);
        case "instructor":
          return checkInstructor(tenantId, targetDate, item);
      }
    })
  );

  const slots = checks.map((slot, i) => ({ ...slot, input: items[i] }));
  return {
    ok: slots.every((s) => s.ok),
    date: isoDate(targetDate),
    items: slots,
  };
}
