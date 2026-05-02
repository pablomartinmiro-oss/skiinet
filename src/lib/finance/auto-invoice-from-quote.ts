import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import type { Invoice } from "@/generated/prisma/client";
import { generateDocumentNumber } from "@/lib/documents/numbering";
import { sendInvoiceEmail } from "@/lib/finance/invoice-email";

const log = logger.child({ module: "auto-invoice-from-quote" });

const TAX_RATE = 21;

/**
 * Auto-generate an invoice from a paid Quote.
 * Creates Invoice + InvoiceLines from QuoteItems,
 * marks as "paid", creates a Transaction record, and emails the client.
 *
 * Should be called fire-and-forget after marking a quote as paid.
 */
export async function createInvoiceFromQuote(
  tenantId: string,
  quoteId: string
): Promise<Invoice> {
  const quote = await prisma.quote.findFirst({
    where: { id: quoteId, tenantId },
    include: {
      items: true,
      reservations: { take: 1, select: { id: true } },
    },
  });

  if (!quote) throw new Error(`Quote ${quoteId} no encontrada`);
  if (!quote.items.length) throw new Error(`Quote ${quoteId} no tiene items`);

  // Skip if invoice already exists for this quote (via reservation link)
  if (quote.reservations[0]?.id) {
    const existing = await prisma.invoice.findFirst({
      where: { tenantId, reservationId: quote.reservations[0].id },
      select: { id: true, number: true },
    });
    if (existing) {
      log.info({ quoteId, invoiceId: existing.id }, "Invoice already exists, skipping");
      return prisma.invoice.findUniqueOrThrow({ where: { id: existing.id } });
    }
  }

  // Quote totals are gross; we treat them as IVA-included for fiscal compliance
  const total = quote.totalAmount;
  const subtotal = Math.round((total / (1 + TAX_RATE / 100)) * 100) / 100;
  const taxAmount = Math.round((total - subtotal) * 100) / 100;

  // Lines: re-derive net from gross so totals reconcile
  const grossSum = quote.items.reduce((s, it) => s + it.totalPrice, 0) || total;
  const lines = quote.items.map((item) => {
    const lineGross = item.totalPrice;
    const ratio = grossSum > 0 ? lineGross / grossSum : 0;
    const lineNet = Math.round(subtotal * ratio * 100) / 100;
    return {
      tenantId,
      description: item.name + (item.description ? ` — ${item.description}` : ""),
      quantity: item.quantity,
      unitPrice: item.quantity > 0 ? Math.round((lineNet / item.quantity) * 100) / 100 : 0,
      lineTotal: lineNet,
      taxRate: TAX_RATE,
      fiscalRegime: "general" as const,
    };
  });

  const quoteNumber = quote.id.slice(-8).toUpperCase();
  const paymentMethod = quote.paymentMethod ?? "transfer";

  const invoice = await prisma.$transaction(async (tx) => {
    const invoiceNumber = await generateDocumentNumber(tenantId, "invoice", {
      tx,
      context: "auto:quote",
    });

    const inv = await tx.invoice.create({
      data: {
        tenantId,
        number: invoiceNumber,
        reservationId: quote.reservations?.[0]?.id ?? null,
        status: "paid",
        subtotal,
        taxAmount,
        total,
        issuedAt: new Date(),
        paidAt: quote.paidAt ?? new Date(),
        notes: `Auto-generada desde presupuesto ${quoteNumber} (${quote.clientName})`,
        lines: { createMany: { data: lines } },
      },
    });

    await tx.transaction.create({
      data: {
        tenantId,
        invoiceId: inv.id,
        date: quote.paidAt ?? new Date(),
        amount: total,
        method: paymentMethod,
        status: "completed",
        reference: `QUOTE-${quoteNumber}`,
      },
    });

    return inv;
  });

  log.info({ tenantId, quoteId, invoiceId: invoice.id, number: invoice.number }, "Invoice auto-created from paid quote");

  // Fire-and-forget email
  if (quote.clientEmail) {
    sendInvoiceEmail({
      tenantId,
      invoiceId: invoice.id,
      to: quote.clientEmail,
      clientName: quote.clientName,
    }).catch((err) =>
      log.error({ err, invoiceId: invoice.id }, "Invoice email failed (non-blocking)")
    );
  }

  return invoice;
}
