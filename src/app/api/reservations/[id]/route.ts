export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { requireTenant } from "@/lib/auth/guard";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { apiError } from "@/lib/api-response";
import { validateBody, updateReservationSchema } from "@/lib/validation";
import { autoInvoiceFromReservation } from "@/lib/invoices/auto-invoice-from-reservation";
import { sendEmail } from "@/lib/email/client";
import { buildReservationConfirmationHTML } from "@/lib/email/templates/reservation-confirmation";
import { buildReservationCancellationHTML } from "@/lib/email/templates/reservation-cancellation";

const log = logger.child({ module: "reservations/[id]" });

async function adjustCapacity(tenantId: string, station: string, activityDate: Date, delta: number) {
  const date = new Date(activityDate);
  date.setHours(0, 0, 0, 0);
  await prisma.stationCapacity.updateMany({
    where: { tenantId, station, date },
    data: { booked: { increment: delta } },
  });
}

function formatDateES(d: Date | string): string {
  return new Date(d).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" });
}

function extractServiceLabels(services: unknown): string[] {
  if (!Array.isArray(services)) return [];
  return services
    .map((s) => {
      const svc = s as { type?: string; modality?: string; level?: string; quantity?: number; days?: number };
      const parts = [svc.type, svc.modality, svc.level].filter(Boolean);
      const label = parts.join(" · ") || "Servicio";
      return svc.quantity && svc.quantity > 1 ? `${label} ×${svc.quantity}` : label;
    })
    .filter(Boolean);
}

interface ReservationLite {
  id: string;
  clientName: string;
  clientEmail: string;
  station: string;
  activityDate: Date;
  schedule: string;
  totalPrice: number;
  services: unknown;
}

function fireConfirmationEmail(reservation: ReservationLite): void {
  if (!reservation.clientEmail) return;
  const html = buildReservationConfirmationHTML({
    reservationId: reservation.id,
    clientName: reservation.clientName,
    station: reservation.station,
    activityDate: formatDateES(reservation.activityDate),
    schedule: reservation.schedule,
    services: extractServiceLabels(reservation.services),
    totalPrice: reservation.totalPrice,
  });
  sendEmail({
    tenantId: "", // not used by Resend client
    contactId: null,
    to: reservation.clientEmail,
    subject: "Reserva confirmada — Skicenter",
    html,
  }).catch((err) => log.warn({ err, reservationId: reservation.id }, "Confirmation email failed"));
}

function fireCancellationEmail(reservation: ReservationLite, reason: "cancelada" | "sin_disponibilidad"): void {
  if (!reservation.clientEmail) return;
  const html = buildReservationCancellationHTML({
    reservationId: reservation.id,
    clientName: reservation.clientName,
    station: reservation.station,
    activityDate: formatDateES(reservation.activityDate),
    reason,
  });
  const subject = reason === "sin_disponibilidad"
    ? "Sin disponibilidad para tu reserva — Skicenter"
    : "Reserva cancelada — Skicenter";
  sendEmail({ tenantId: "", contactId: null, to: reservation.clientEmail, subject, html }).catch((err) =>
    log.warn({ err, reservationId: reservation.id }, "Cancellation email failed")
  );
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const [session, authError] = await requireTenant();
  if (authError) return authError;

  const { id } = await params;
  const { tenantId } = session;

  try {
    const reservation = await prisma.reservation.findFirst({
      where: { id, tenantId },
      include: { quote: { select: { id: true, clientName: true } } },
    });

    if (!reservation) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ reservation });
  } catch (error) {
    return apiError(error, {
      publicMessage: "Failed to fetch reservation",
      code: "RESERVATION_GET_ERROR",
      logContext: { tenantId, reservationId: id },
    });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const [session, authError] = await requireTenant();
  if (authError) return authError;

  const { id } = await params;
  const { tenantId } = session;
  const rlog = logger.child({ tenantId, reservationId: id });

  try {
    const existing = await prisma.reservation.findFirst({
      where: { id, tenantId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const raw = await request.json();
    const validation = validateBody(raw, updateReservationSchema);
    if (!validation.ok) {
      return NextResponse.json({ error: "Datos de entrada inválidos", details: validation.error }, { status: 400 });
    }

    const {
      participants, services,
      status,
      ...scalarFields
    } = validation.data;

    const updateData: Record<string, unknown> = { ...scalarFields };
    if (participants !== undefined) {
      updateData.participants = participants ? JSON.parse(JSON.stringify(participants)) : null;
    }
    if (services !== undefined) {
      updateData.services = services ? JSON.parse(JSON.stringify(services)) : null;
    }

    if (status !== undefined) updateData.status = status;

    const statusChanged = status !== undefined && status !== existing.status;
    const sendsEmail =
      statusChanged && (status === "confirmada" || status === "sin_disponibilidad" || status === "cancelada");
    if (sendsEmail) {
      updateData.emailSentAt = new Date();
      if (updateData.notificationType) {
        updateData.whatsappSentAt = new Date();
      }
    }

    const willTransitionFromConfirmed =
      existing.status === "confirmada" &&
      (status === "cancelada" || status === "sin_disponibilidad" || status === "eliminada");

    const reservation = await prisma.reservation.update({
      where: { id },
      data: updateData,
    });

    // Capacity bookkeeping (mirror POST handler)
    if (willTransitionFromConfirmed) {
      await adjustCapacity(tenantId, existing.station, existing.activityDate, -1);
    }

    // Planning engine: generate operational units when confirmed
    if (status === "confirmada") {
      try {
        const { onReservationConfirmed } = await import("@/lib/planning/operational-units");
        await onReservationConfirmed(tenantId, id);
      } catch (e) {
        rlog.warn(e, "Failed to generate OUs (non-blocking)");
      }
    }

    // Auto-invoice on confirmada or completada (non-paid-quote path) — fire-and-forget
    if (status === "confirmada" || status === "completada") {
      autoInvoiceFromReservation(
        {
          id: reservation.id,
          clientName: reservation.clientName,
          clientEmail: reservation.clientEmail,
          totalPrice: reservation.totalPrice,
          discount: reservation.discount,
          station: reservation.station,
          activityDate: reservation.activityDate,
          services: reservation.services,
          participants: reservation.participants,
        },
        tenantId
      ).catch((err) => rlog.warn({ err }, "Auto-invoice failed (non-blocking)"));
    }

    // Email notifications on status change (fire-and-forget)
    if (sendsEmail) {
      const lite: ReservationLite = {
        id: reservation.id,
        clientName: reservation.clientName,
        clientEmail: reservation.clientEmail,
        station: reservation.station,
        activityDate: reservation.activityDate,
        schedule: reservation.schedule,
        totalPrice: reservation.totalPrice,
        services: reservation.services,
      };
      if (status === "confirmada") fireConfirmationEmail(lite);
      else if (status === "sin_disponibilidad") fireCancellationEmail(lite, "sin_disponibilidad");
      else if (status === "cancelada") fireCancellationEmail(lite, "cancelada");
    }

    rlog.info({ status, prevStatus: existing.status }, "Reservation updated");
    return NextResponse.json({ reservation });
  } catch (error) {
    return apiError(error, {
      publicMessage: "Failed to update reservation",
      code: "RESERVATION_UPDATE_ERROR",
      logContext: { tenantId, reservationId: id },
    });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const [session, authError] = await requireTenant();
  if (authError) return authError;

  const { id } = await params;
  const { tenantId } = session;
  const rlog = logger.child({ tenantId, reservationId: id });

  try {
    const existing = await prisma.reservation.findFirst({
      where: { id, tenantId },
    });
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const wasConfirmed = existing.status === "confirmada";

    const tag = `[ELIMINADA ${new Date().toISOString()}] eliminada por el usuario`;
    const internalNotes = existing.internalNotes ? `${existing.internalNotes}\n${tag}` : tag;

    const reservation = await prisma.reservation.update({
      where: { id },
      data: { status: "eliminada", internalNotes },
    });

    if (wasConfirmed) {
      await adjustCapacity(tenantId, existing.station, existing.activityDate, -1);
    }

    rlog.info({ wasConfirmed }, "Reservation soft-deleted");
    return NextResponse.json({ reservation });
  } catch (error) {
    return apiError(error, {
      publicMessage: "Failed to delete reservation",
      code: "RESERVATION_DELETE_ERROR",
      logContext: { tenantId, reservationId: id },
    });
  }
}
