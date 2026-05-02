import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { sendEmail } from "@/lib/email/resend";
import { buildInvoiceEmailHTML } from "@/lib/email/module-templates";
import { getTenantFiscalData } from "@/lib/tenant/fiscal";

const log = logger.child({ module: "invoice-email" });

interface SendInvoiceEmailOpts {
  tenantId: string;
  invoiceId: string;
  to: string;
  clientName: string;
  isReminder?: boolean;
  reminderNumber?: number;
}

const BASE_URL =
  process.env.AUTH_URL ?? "https://crm-dash-prod.up.railway.app";

export async function sendInvoiceEmail(opts: SendInvoiceEmailOpts): Promise<void> {
  const invoice = await prisma.invoice.findFirst({
    where: { id: opts.invoiceId, tenantId: opts.tenantId },
    select: { number: true, total: true, issuedAt: true, status: true },
  });
  if (!invoice) throw new Error(`Invoice ${opts.invoiceId} not found`);

  const fiscal = await getTenantFiscalData(opts.tenantId, "invoice");

  const issuedAt = invoice.issuedAt
    ? new Date(invoice.issuedAt).toLocaleDateString("es-ES", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "—";

  const html = buildInvoiceEmailHTML({
    tenant: {
      name: fiscal.companyName,
      email: fiscal.companyEmail ?? undefined,
      phone: fiscal.companyPhone ?? undefined,
    },
    clientName: opts.clientName,
    invoiceNumber: invoice.number,
    total: invoice.total,
    issuedAt,
    paymentUrl: `${BASE_URL}/api/finance/invoices/${opts.invoiceId}/pdf`,
  });

  const subjectPrefix = opts.isReminder
    ? `Recordatorio${opts.reminderNumber ? ` ${opts.reminderNumber}` : ""}: `
    : "";

  await sendEmail({
    to: opts.to,
    subject: `${subjectPrefix}Factura ${invoice.number} — ${fiscal.companyName}`,
    html,
  });

  if (opts.isReminder) {
    await prisma.invoice.update({
      where: { id: opts.invoiceId },
      data: {
        reminderCount: { increment: 1 },
        lastReminderAt: new Date(),
      },
    });
  } else {
    await prisma.invoice.update({
      where: { id: opts.invoiceId },
      data: { emailSentAt: new Date(), emailSentTo: opts.to },
    });
  }

  log.info({ invoiceId: opts.invoiceId, to: opts.to, isReminder: opts.isReminder }, "Invoice email sent");
}
