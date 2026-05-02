import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { generateDocumentNumber } from "@/lib/documents/numbering";
import { sendInvoiceEmail } from "@/lib/finance/invoice-email";

const log = logger.child({ module: "auto-invoice" });

interface ReservationInvoiceInput {
  id: string;
  clientName: string;
  clientEmail?: string;
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
  description?: string;
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
      const description = s.description ?? (labelParts.length ? labelParts.join(" · ") : "Servicio");
      return { description, quantity: qty, unitPrice, lineTotal };
    });
    const linesTotal = lines.reduce((sum, l) => sum + l.lineTotal, 0);
    if (linesTotal > 0) return lines;
  }

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
  const existing = await prisma.invoice.findFirst({
    where: { tenantId, reservationId: reservation.id },
    select: { id: true, number: true },
  });
  if (existing) {
    log.info({ tenantId, reservationId: reservation.id, invoiceId: existing.id }, "Invoice already exists, skipping");
    return existing;
  }

  // If reservation came from a paid quote, the quote→invoice path owns billing
  const reservationRow = await prisma.reservation.findUnique({
    where: { id: reservation.id },
    select: { quoteId: true, clientEmail: true },
  });
  if (reservationRow?.quoteId) {
    const quote = await prisma.quote.findUnique({
      where: { id: reservationRow.quoteId },
      select: { paymentStatus: true, status: true },
    });
    if (quote && (quote.paymentStatus === "paid" || quote.status === "pagado")) {
      log.info({ tenantId, reservationId: reservation.id }, "Reservation has paid quote — quote→invoice owns billing, skipping");
      return null;
    }
  }

  // Lines stored as gross totals; subtotal is net (gross / 1.21)
  const linesGross = buildLines(reservation);
  const grossSum = linesGross.reduce((s, l) => s + l.lineTotal, 0);
  const subtotal = Math.round((grossSum / (1 + TAX_RATE / 100)) * 100) / 100;
  const taxAmount = Math.round((grossSum - subtotal) * 100) / 100;
  const total = grossSum;

  const lines = linesGross.map((l) => {
    const ratio = grossSum > 0 ? l.lineTotal / grossSum : 0;
    const lineNet = Math.round(subtotal * ratio * 100) / 100;
    return {
      tenantId,
      description: l.description,
      quantity: l.quantity,
      unitPrice: l.quantity > 0 ? Math.round((lineNet / l.quantity) * 100) / 100 : 0,
      lineTotal: lineNet,
      taxRate: TAX_RATE,
      fiscalRegime: "general" as const,
    };
  });

  const invoice = await prisma.$transaction(async (tx) => {
    const number = await generateDocumentNumber(tenantId, "invoice", {
      tx,
      context: "auto:reservation",
    });
    const inv = await tx.invoice.create({
      data: {
        tenantId,
        number,
        reservationId: reservation.id,
        status: "sent",
        notes: `Generada automáticamente desde reserva ${reservation.id} (${reservation.clientName}) al confirmarse.`,
        subtotal,
        taxAmount,
        total,
        issuedAt: new Date(),
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

  log.info({ tenantId, reservationId: reservation.id, invoiceId: invoice.id, number: invoice.number }, "Auto-invoice created from reservation");

  const clientEmail = reservation.clientEmail ?? reservationRow?.clientEmail ?? null;
  if (clientEmail) {
    sendInvoiceEmail({
      tenantId,
      invoiceId: invoice.id,
      to: clientEmail,
      clientName: reservation.clientName,
    }).catch((err) =>
      log.error({ err, invoiceId: invoice.id }, "Invoice email failed (non-blocking)")
    );
  }

  return { id: invoice.id, number: invoice.number };
}
