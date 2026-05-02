import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { sendInvoiceEmail } from "@/lib/finance/invoice-email";

const log = logger.child({ module: "invoice-reminders" });

const FIRST_REMINDER_DAYS = 7;
const REMINDER_INTERVAL_DAYS = 7;
const MAX_REMINDERS = 3;
const DAY_MS = 86_400_000;

interface ProcessResult {
  sent: number;
  errors: number;
  scanned: number;
}

/**
 * Send reminder emails for unpaid invoices.
 *
 * Rules:
 *  - Invoice must be status "sent" (or "draft" with issuedAt set)
 *  - First reminder: 7 days after issuedAt
 *  - Follow-ups: every 7 days, up to 3 total reminders
 *  - Skip if invoice is paid or cancelled
 */
export async function processInvoiceReminders(): Promise<ProcessResult> {
  const now = Date.now();
  const cutoff = new Date(now - FIRST_REMINDER_DAYS * DAY_MS);

  const candidates = await prisma.invoice.findMany({
    where: {
      status: { in: ["sent", "draft"] },
      issuedAt: { not: null, lte: cutoff },
      reminderCount: { lt: MAX_REMINDERS },
    },
    include: {
      client: { select: { name: true, email: true } },
      lines: { take: 1 },
    },
    take: 200,
  });

  let sent = 0;
  let errors = 0;

  for (const invoice of candidates) {
    try {
      // Need a destination email
      let toEmail: string | null = invoice.emailSentTo ?? invoice.client?.email ?? null;
      let clientName: string = invoice.client?.name ?? "Cliente";

      // Fallback: try reservation client info
      if (!toEmail && invoice.reservationId) {
        const r = await prisma.reservation.findUnique({
          where: { id: invoice.reservationId },
          select: { clientEmail: true, clientName: true },
        });
        if (r?.clientEmail) toEmail = r.clientEmail;
        if (r?.clientName) clientName = r.clientName;
      }

      if (!toEmail) {
        log.warn({ invoiceId: invoice.id }, "No client email — skipping reminder");
        continue;
      }

      // Throttle: respect REMINDER_INTERVAL_DAYS since last reminder (or issuedAt)
      const lastSent = invoice.lastReminderAt ?? invoice.issuedAt ?? invoice.createdAt;
      const daysSinceLast = (now - lastSent.getTime()) / DAY_MS;
      const required = invoice.reminderCount === 0 ? FIRST_REMINDER_DAYS : REMINDER_INTERVAL_DAYS;
      if (daysSinceLast < required) continue;

      await sendInvoiceEmail({
        tenantId: invoice.tenantId,
        invoiceId: invoice.id,
        to: toEmail,
        clientName,
        isReminder: true,
        reminderNumber: invoice.reminderCount + 1,
      });
      sent++;
    } catch (err) {
      errors++;
      log.error({ err, invoiceId: invoice.id }, "Failed to send invoice reminder");
    }
  }

  return { sent, errors, scanned: candidates.length };
}
