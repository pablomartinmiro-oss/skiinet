export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { requireTenant } from "@/lib/auth/guard";
import { requireModule } from "@/lib/modules/guard";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { apiError } from "@/lib/api-response";
import {
  validateBody,
  createRestaurantBookingSchema,
} from "@/lib/validation";
import { Prisma } from "@/generated/prisma/client";

export async function GET(request: NextRequest) {
  const [session, authError] = await requireTenant();
  if (authError) return authError;

  const { tenantId } = session;
  const moduleError = await requireModule(tenantId, "restaurant");
  if (moduleError) return moduleError;

  const log = logger.child({
    tenantId,
    path: "/api/restaurant/bookings",
  });
  const { searchParams } = request.nextUrl;
  const restaurantId = searchParams.get("restaurantId");
  const date = searchParams.get("date");
  const status = searchParams.get("status");

  try {
    const where: Prisma.RestaurantBookingWhereInput = { tenantId };
    if (restaurantId) where.restaurantId = restaurantId;
    if (date) {
      const d = new Date(date);
      const nextDay = new Date(d);
      nextDay.setDate(nextDay.getDate() + 1);
      where.date = { gte: d, lt: nextDay };
    }
    if (status) where.status = status;

    const bookings = await prisma.restaurantBooking.findMany({
      where,
      include: {
        restaurant: { select: { id: true, title: true, depositPerGuest: true } },
        client: { select: { id: true, name: true, email: true, phone: true } },
      },
      orderBy: [{ date: "asc" }, { time: "asc" }],
    });

    log.info({ count: bookings.length }, "Bookings fetched");
    return NextResponse.json({ bookings });
  } catch (error) {
    return apiError(error, {
      publicMessage: "Failed to fetch bookings",
      code: "RESTAURANT_BOOKING_ERROR",
      logContext: { tenantId },
    });
  }
}

export async function POST(request: NextRequest) {
  const [session, authError] = await requireTenant();
  if (authError) return authError;

  const { tenantId } = session;
  const moduleError = await requireModule(tenantId, "restaurant");
  if (moduleError) return moduleError;

  const log = logger.child({
    tenantId,
    path: "/api/restaurant/bookings",
  });

  try {
    const body = await request.json();
    const validated = validateBody(
      body,
      createRestaurantBookingSchema
    );
    if (!validated.ok) {
      return NextResponse.json(
        { error: validated.error },
        { status: 400 }
      );
    }
    const data = validated.data;

    // Verify restaurant belongs to tenant
    const restaurant = await prisma.restaurant.findFirst({
      where: { id: data.restaurantId, tenantId },
    });
    if (!restaurant) {
      return NextResponse.json(
        { error: "Restaurant not found" },
        { status: 404 }
      );
    }

    // Upsert client when caller passed inline contact info instead of a clientId
    let clientId = data.clientId ?? null;
    if (!clientId && data.clientName) {
      const existing = data.clientEmail
        ? await prisma.client.findFirst({
            where: { tenantId, email: data.clientEmail },
            select: { id: true },
          })
        : data.clientPhone
          ? await prisma.client.findFirst({
              where: { tenantId, phone: data.clientPhone },
              select: { id: true },
            })
          : null;
      if (existing) {
        clientId = existing.id;
      } else {
        const created = await prisma.client.create({
          data: {
            tenantId,
            name: data.clientName,
            email: data.clientEmail ?? null,
            phone: data.clientPhone ?? null,
          },
          select: { id: true },
        });
        clientId = created.id;
      }
    }

    const booking = await prisma.restaurantBooking.create({
      data: {
        tenantId,
        restaurantId: data.restaurantId,
        clientId,
        date: data.date,
        time: data.time,
        guestCount: data.guestCount,
        specialRequests: data.specialRequests ?? null,
        status: data.status,
        depositStatus: data.depositStatus,
        operationalNotes: data.operationalNotes ?? null,
      },
      include: {
        restaurant: { select: { id: true, title: true, depositPerGuest: true } },
        client: { select: { id: true, name: true, email: true, phone: true } },
      },
    });

    log.info({ bookingId: booking.id }, "Booking created");
    return NextResponse.json({ booking }, { status: 201 });
  } catch (error) {
    return apiError(error, {
      publicMessage: "Failed to create booking",
      code: "RESTAURANT_BOOKING_ERROR",
      logContext: { tenantId },
    });
  }
}
