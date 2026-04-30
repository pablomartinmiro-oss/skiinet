import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";

const log = logger.child({ module: "auto-invoice" });

interface ReservationInvoiceInput {
  id: string;
  clientName: string;
  totalPrice: number;
  discount: number;
  station: string;
  activityDate: Date | string;
  services: unknown;
  participants: unknown;
}

interface ServiceLike {
  type?: string;
  modality?: string;
  level?: string;
  quantity?: number;
  days?: number;
  unitPrice?: number;
  totalPrice?: number;
}

const TAX_RATE = 21;

function buildLines(reservation: ReservationInvoiceInput): {
  description: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}[] {
  const services = Array.isArray(reservation.services) ? (reservation.services as ServiceLike[]) : [];

  if (services.length > 0) {
    const lines = services.map((s) => {
      const qty = Math.max(1, Number(s.quantity ?? 1));
      const explicitTotal = typeof s.totalPrice === "number" ? s.totalPrice : null;
      const unitPrice = typeof s.unitPrice === "number"
        ? s.unitPrice
        : explicitTotal !== null
          ? explicitTotal / qty
          : 0;
      const lineTotal = explicitTotal ?? unitPrice * qty;
      const labelParts = [s.type, s.modality, s.level, s.days ? `${s.days}d` : null].filter(Boolean);
      const description = labelParts.length ? labelParts.join(" · ") : "Servicio";
      return { description, quantity: qty, unitPrice, lineTotal };
    });
    const linesTotal = lines.reduce((sum, l) => sum + l.lineTotal, 0);
    if (linesTotal > 0) return lines;
  }

  // Fallback: single line for full reservation amount
  const gross = reservation.totalPrice * (1 - (reservation.discount || 0) / 100);
  return [
    {
      description: `Reserva ${reservation.station} — ${new Date(reservation.activityDate).toLocaleDateString("es-ES")}`,
      quantity: 1,
      unitPrice: gross,
      lineTotal: gross,
    },
  ];
}

export async function autoInvoiceFromReservation(
  reservation: ReservationInvoiceInput,
  tenantId: string
): Promise<{ id: string; number: string } | null> {
  // Skip if an invoice already exists for this reservation
  const existing = await prisma.invoice.findFirst({
    where: { tenantId, reservationId: reservation.id },
    select: { id: true, number: true },
  });
  if (existing) {
    log.info({ tenantId, reservationId: reservation.id, invoiceId: existing.id }, "Invoice already exists, skipping auto-create");
    return existing;
  }

  // Skip if a quote-linked invoice exists for the same client/reservation chain
  const reservationRow = await prisma.reservation.findUnique({
    where: { id: reservation.id },
    select: { quoteId: true },
  });
  if (reservationRow?.quoteId) {
    log.info({ tenantId, reservationId: reservation.id }, "Reservation has quoteId — quote→invoice path owns billing, skipping");
    return null;
  }

  const lines = buildLines(reservation);
  const subtotal = lines.reduce((sum, l) => sum + l.lineTotal, 0);
  // Lines stored as gross totals; invoice subtotal/tax stored separately
  const taxAmount = subtotal * (TAX_RATE / 100);
  const total = subtotal + taxAmount;

  const year = new Date().getFullYear();
  const last = await prisma.invoice.findFirst({
    where: { tenantId, number: { startsWith: `FAC-${year}-` } },
    orderBy: { number: "desc" },
    select: { number: true },
  });
  const seq = last ? parseInt(last.number.split("-")[2]) + 1 : 1;
  const number = `FAC-${year}-${String(seq).padStart(4, "0")}`;

  const invoice = await prisma.$transaction(async (tx) => {
    const inv = await tx.invoice.create({
      data: {
        tenantId,
        number,
        reservationId: reservation.id,
        status: "draft",
        notes: `Generada automáticamente desde reserva ${reservation.id} (${reservation.clientName}) al marcarla como completada.`,
        subtotal,
        taxAmount,
        total,
      },
    });
    await tx.invoiceLine.createMany({
      data: lines.map((l) => ({
        tenantId,
        invoiceId: inv.id,
        description: l.description,
        quantity: l.quantity,
        unitPrice: l.unitPrice,
        lineTotal: l.lineTotal,
        taxRate: TAX_RATE,
        fiscalRegime: "general",
      })),
    });
    return inv;
  });

  log.info({ tenantId, reservationId: reservation.id, invoiceId: invoice.id, number }, "Auto-invoice created from reservation");
  return { id: invoice.id, number: invoice.number };
}
