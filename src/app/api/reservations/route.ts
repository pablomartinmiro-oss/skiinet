export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { requireTenant } from "@/lib/auth/guard";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { apiError } from "@/lib/api-response";
import { createNotification } from "@/lib/notifications";
import { validateBody, createReservationSchema } from "@/lib/validation";

export async function GET(request: NextRequest) {
  const [session, authError] = await requireTenant();
  if (authError) return authError;

  const { tenantId } = session;
  const log = logger.child({ tenantId, path: "/api/reservations" });
  const { searchParams } = request.nextUrl;

  const status = searchParams.get("status");
  const station = searchParams.get("station");
  const dateFrom = searchParams.get("dateFrom");
  const dateTo = searchParams.get("dateTo");
  const search = searchParams.get("search");
  const includeDeleted = searchParams.get("includeDeleted") === "true";
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);
  const pageSize = Math.min(200, Math.max(1, parseInt(searchParams.get("pageSize") ?? "50", 10) || 50));

  try {
    const where: Record<string, unknown> = { tenantId };
    if (status) {
      where.status = status;
    } else if (!includeDeleted) {
      where.status = { not: "eliminada" };
    }
    if (station) where.station = station;
    if (dateFrom || dateTo) {
      where.activityDate = {
        ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
        ...(dateTo ? { lte: new Date(dateTo + "T23:59:59.999Z") } : {}),
      };
    }
    if (search) {
      where.OR = [
        { clientName: { contains: search, mode: "insensitive" } },
        { clientEmail: { contains: search, mode: "insensitive" } },
        { clientPhone: { contains: search, mode: "insensitive" } },
        { couponCode: { contains: search, mode: "insensitive" } },
      ];
    }

    const [reservations, total] = await Promise.all([
      prisma.reservation.findMany({
        where,
        include: { quote: { select: { id: true, clientName: true } } },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.reservation.count({ where }),
    ]);

    log.info({ count: reservations.length, total, page, pageSize }, "Reservations fetched");
    return NextResponse.json({ reservations, total, page, pageSize });
  } catch (error) {
    return apiError(error, {
      publicMessage: "Failed to fetch reservations",
      code: "RESERVATION_LIST_ERROR",
      logContext: { tenantId },
    });
  }
}

export async function POST(request: NextRequest) {
  const [session, authError] = await requireTenant();
  if (authError) return authError;

  const { tenantId } = session;
  const log = logger.child({ tenantId, path: "/api/reservations" });

  try {
    const raw = await request.json();
    const validation = validateBody(raw, createReservationSchema);
    if (!validation.ok) {
      return NextResponse.json({ error: "Datos de entrada inválidos", details: validation.error }, { status: 400 });
    }
    const {
      clientName, clientPhone, clientEmail, couponCode,
      source, station, activityDate, schedule, language,
      participants, services,
      totalPrice, discount, paymentMethod, paymentRef,
      status: reservationStatus,
      notes, internalNotes,
      notificationType, quoteId,
      voucherSecurityCode, voucherCouponCode, voucherProduct,
      voucherPricePaid, voucherExpiry, voucherRedeemed, voucherRedeemedAt,
    } = validation.data;

    const reservation = await prisma.reservation.create({
      data: {
        tenantId,
        clientName,
        clientPhone: clientPhone ?? "",
        clientEmail: clientEmail ?? "",
        couponCode: couponCode ?? undefined,
        source,
        station,
        activityDate,
        schedule: schedule ?? "",
        language: language ?? "es",
        participants: participants ? JSON.parse(JSON.stringify(participants)) : undefined,
        services: services ? JSON.parse(JSON.stringify(services)) : undefined,
        totalPrice: totalPrice ?? 0,
        discount: discount ?? 0,
        paymentMethod: paymentMethod ?? undefined,
        paymentRef: paymentRef ?? undefined,
        status: reservationStatus ?? "pendiente",
        notes: notes ?? undefined,
        internalNotes: internalNotes ?? undefined,
        notificationType: notificationType ?? undefined,
        quoteId: quoteId ?? undefined,
        createdBy: session.userId,
        emailSentAt: undefined,
        whatsappSentAt: undefined,
        voucherSecurityCode: voucherSecurityCode ?? undefined,
        voucherCouponCode: voucherCouponCode ?? undefined,
        voucherProduct: voucherProduct ?? undefined,
        voucherPricePaid: voucherPricePaid ?? undefined,
        voucherExpiry: voucherExpiry ?? undefined,
        voucherRedeemed: voucherRedeemed ?? false,
        voucherRedeemedAt: voucherRedeemedAt ?? undefined,
      },
    });

    // Update capacity if confirmed
    if (reservationStatus === "confirmada") {
      await updateCapacity(tenantId, station, activityDate.toISOString(), 1);
    }

    log.info({ reservationId: reservation.id, status: reservationStatus }, "Reservation created");

    // Notify owners/managers of new reservation (non-blocking)
    createNotification(
      tenantId,
      "reservation_created",
      `Nueva reserva — ${clientName}`,
      `${station} · ${activityDate.toLocaleDateString("es-ES", { day: "numeric", month: "short" })}`,
      { reservationId: reservation.id }
    ).catch(() => null);

    return NextResponse.json({ reservation }, { status: 201 });
  } catch (error) {
    return apiError(error, {
      publicMessage: "Failed to create reservation",
      code: "RESERVATION_CREATE_ERROR",
      logContext: { tenantId },
    });
  }
}

async function updateCapacity(tenantId: string, station: string, dateStr: string, delta: number) {
  const date = new Date(dateStr);
  date.setHours(0, 0, 0, 0);

  // Update all service type capacities for this station+date
  await prisma.stationCapacity.updateMany({
    where: { tenantId, station, date },
    data: { booked: { increment: delta } },
  });
}
