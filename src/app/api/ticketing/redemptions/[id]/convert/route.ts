export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireTenant } from "@/lib/auth/guard";
import { prisma } from "@/lib/db";
import { apiError, badRequest } from "@/lib/api-response";
import { validateBody } from "@/lib/validation";
import { generateDocumentNumber } from "@/lib/documents/numbering";
import { logCrmActivityAsync } from "@/lib/crm/activity-log";

const convertSchema = z.object({
  station: z.string().min(1).max(100),
  activityDate: z.string(),  // ISO
  schedule: z.string().min(1).max(100),
  totalPrice: z.number().min(0).default(0),
  notes: z.string().max(2000).optional(),
});

/**
 * POST /api/ticketing/redemptions/[id]/convert
 *
 * Convert a validated coupon redemption into a Reservation.
 * Idempotent — if redemption.reservationId already set, returns existing
 * reservation.
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
    const validated = validateBody(body, convertSchema);
    if (!validated.ok) return badRequest(validated.error);
    const data = validated.data;

    const redemption = await prisma.couponRedemption.findFirst({
      where: { id, tenantId },
      select: {
        id: true,
        code: true,
        customerName: true,
        email: true,
        phone: true,
        reservationId: true,
        status: true,
      },
    });
    if (!redemption) {
      return NextResponse.json({ error: "Cupón no encontrado" }, { status: 404 });
    }

    if (redemption.reservationId) {
      const existing = await prisma.reservation.findUnique({
        where: { id: redemption.reservationId },
      });
      return NextResponse.json({ reservation: existing, idempotent: true });
    }

    if (!redemption.customerName) {
      return badRequest("El cupón no tiene nombre de cliente — añade uno antes de convertir");
    }

    const reservationNumber = await generateDocumentNumber(tenantId, "reservation", {
      generatedBy: userId,
      context: "coupon_convert",
    });

    const reservation = await prisma.$transaction(async (tx) => {
      const r = await tx.reservation.create({
        data: {
          tenantId,
          number: reservationNumber,
          clientName: redemption.customerName as string,
          clientPhone: redemption.phone ?? "",
          clientEmail: redemption.email ?? "",
          couponCode: redemption.code,
          source: "groupon",
          station: data.station,
          activityDate: new Date(data.activityDate),
          schedule: data.schedule,
          totalPrice: data.totalPrice,
          status: "confirmada",
          paymentMethod: "groupon",
          notes: data.notes ?? null,
          createdBy: userId,
        },
      });
      await tx.couponRedemption.update({
        where: { id },
        data: {
          status: "reservation_generated",
          reservationId: r.id,
          redeemedAt: new Date(),
        },
      });
      return r;
    });

    logCrmActivityAsync({
      tenantId,
      entityType: "reservation",
      entityId: reservation.id,
      action: "created",
      actorId: userId,
      actorName: email ?? null,
      details: {
        kind: "coupon_to_reservation",
        couponCode: redemption.code,
        redemptionId: id,
        reservationNumber,
      },
    });

    return NextResponse.json({ reservation }, { status: 201 });
  } catch (error) {
    return apiError(error, {
      publicMessage: "No se pudo convertir el cupón",
      code: "TICKETING_CONVERT_ERROR",
      logContext: { tenantId, redemptionId: id },
    });
  }
}
