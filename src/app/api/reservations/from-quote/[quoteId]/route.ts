export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { requireTenant } from "@/lib/auth/guard";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { apiError } from "@/lib/api-response";
import type { Prisma } from "@/generated/prisma/client";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ quoteId: string }> }
) {
  const [session, authError] = await requireTenant();
  if (authError) return authError;

  const { quoteId } = await params;
  const { tenantId } = session;
  const log = logger.child({ tenantId, path: `/api/reservations/from-quote/${quoteId}` });

  try {
    const quote = await prisma.quote.findFirst({
      where: { id: quoteId, tenantId },
      include: { items: true },
    });

    if (!quote) {
      return NextResponse.json({ error: "Quote not found" }, { status: 404 });
    }

    // Idempotency: return the existing reservation if this quote was already converted
    const existing = await prisma.reservation.findFirst({
      where: { tenantId, quoteId: quote.id },
      orderBy: { createdAt: "asc" },
    });
    if (existing) {
      log.info({ quoteId, reservationId: existing.id }, "Reservation already exists for quote");
      return NextResponse.json({ reservation: existing, existing: true }, { status: 200 });
    }

    // Build services from quote items, preserving every per-item variable
    const services = quote.items.map((item) => ({
      type: item.name,
      productId: item.productId,
      category: item.category,
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      discount: item.discount,
      totalPrice: item.totalPrice,
      startDate: item.startDate,
      endDate: item.endDate,
      numDays: item.numDays,
      numPersons: item.numPersons,
      ageDetails: item.ageDetails ?? null,
      station: item.station,
      modalidad: item.modalidad,
      nivel: item.nivel,
      sector: item.sector,
      idioma: item.idioma,
      horario: item.horario,
      puntoEncuentro: item.puntoEncuentro,
      tipoCliente: item.tipoCliente,
      gama: item.gama,
      casco: item.casco,
      tipoActividad: item.tipoActividad,
      regimen: item.regimen,
      alojamientoNombre: item.alojamientoNombre,
      seguroIncluido: item.seguroIncluido,
      tallaBotas: item.tallaBotas,
      alturaPeso: item.alturaPeso,
      dni: item.dni,
      notes: item.notes,
    }));

    // Pick first non-empty horario across items, fall back to default
    const horarioFromItems = quote.items.find((i) => i.horario && i.horario.trim().length > 0)?.horario;
    const schedule = horarioFromItems && horarioFromItems.trim().length > 0 ? horarioFromItems : "10:00-13:00";

    const conversionNote = `Convertido a reserva el ${new Date().toISOString()}`;
    const internalNotes = quote.internalNotes
      ? `${quote.internalNotes}\n${conversionNote}`
      : conversionNote;

    const result = await prisma.$transaction(async (tx) => {
      const reservation = await tx.reservation.create({
        data: {
          tenantId,
          quoteId: quote.id,
          ghlContactId: quote.ghlContactId,
          clientName: quote.clientName,
          clientPhone: quote.clientPhone || "",
          clientEmail: quote.clientEmail || "",
          source: "presupuesto",
          station: quote.destination,
          activityDate: quote.checkIn,
          schedule,
          language: "es",
          services: JSON.parse(JSON.stringify(services)) as Prisma.InputJsonValue,
          totalPrice: quote.totalAmount,
          discount: 0,
          status: "pendiente",
          notes: quote.clientNotes,
          internalNotes,
          createdBy: session.userId,
        },
      });

      // Mark the quote as converted (status only changes if currently in a pre-conversion state)
      const nextStatus =
        quote.status === "nuevo" || quote.status === "borrador" || quote.status === "en_proceso"
          ? "en_proceso"
          : quote.status;

      await tx.quote.update({
        where: { id: quote.id },
        data: { status: nextStatus, internalNotes },
      });

      return reservation;
    });

    log.info({ quoteId, reservationId: result.id }, "Reservation created from quote");
    return NextResponse.json({ reservation: result, existing: false }, { status: 201 });
  } catch (error) {
    return apiError(error, {
      publicMessage: "Failed to create reservation from quote",
      code: "RESERVATION_FROM_QUOTE_ERROR",
      logContext: { tenantId, quoteId },
    });
  }
}
