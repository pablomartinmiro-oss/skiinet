export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { requireTenant } from "@/lib/auth/guard";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { apiError } from "@/lib/api-response";
import { generateDocumentNumber } from "@/lib/documents/numbering";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const [session, authError] = await requireTenant();
  if (authError) return authError;

  const { id } = await params;
  const { tenantId } = session;
  const log = logger.child({ tenantId, path: `/api/reservations/duplicate/${id}` });

  try {
    const source = await prisma.reservation.findFirst({
      where: { id, tenantId },
    });

    if (!source) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Copy all fields except id, timestamps, notification tracking.
    // Always allocate a fresh document number — duplicates are independent fiscal records.
    const number = await generateDocumentNumber(tenantId, "reservation", {
      generatedBy: session.userId,
      context: "duplicate",
    });

    const duplicate = await prisma.reservation.create({
      data: {
        tenantId,
        number,
        clientName: source.clientName,
        clientPhone: source.clientPhone,
        clientEmail: source.clientEmail,
        couponCode: source.couponCode,
        source: source.source,
        station: source.station,
        activityDate: source.activityDate,
        schedule: source.schedule,
        language: source.language,
        participants: source.participants as object | undefined,
        services: source.services as object | undefined,
        totalPrice: source.totalPrice,
        discount: source.discount,
        paymentMethod: source.paymentMethod,
        paymentRef: source.paymentRef,
        status: "pendiente",
        notes: source.notes,
        internalNotes: source.internalNotes,
        quoteId: source.quoteId,
        createdBy: session.userId,
      },
    });

    log.info({ sourceId: id, duplicateId: duplicate.id }, "Reservation duplicated");
    return NextResponse.json({ reservation: duplicate }, { status: 201 });
  } catch (error) {
    return apiError(error, {
      publicMessage: "Failed to duplicate reservation",
      code: "RESERVATION_DUPLICATE_ERROR",
      logContext: { tenantId, sourceId: id },
    });
  }
}
