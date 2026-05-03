export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireTenant } from "@/lib/auth/guard";
import { prisma } from "@/lib/db";
import { apiError, badRequest } from "@/lib/api-response";
import { validateBody } from "@/lib/validation";
import { logCrmActivityAsync } from "@/lib/crm/activity-log";

const confirmTransferSchema = z.object({
  /** S3/R2 URL of the uploaded transfer proof PDF/image. */
  transferProofUrl: z.string().url().max(2048),
  /** Optional admin note recorded with the confirmation. */
  note: z.string().max(2000).optional().nullable(),
});

/**
 * POST /api/quotes/[id]/confirm-transfer
 * Admin marks a bank-transfer payment as confirmed for a Quote.
 * Stores the proof URL, sets paymentStatus → "paid", paymentMethod →
 * "transfer", paidAt = now, transferConfirmedAt/By, and logs a
 * "payment_received" activity. Idempotent: confirming an already-paid
 * quote returns 200 + flag without duplicate side effects.
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
    const validated = validateBody(body, confirmTransferSchema);
    if (!validated.ok) return badRequest(validated.error);

    const quote = await prisma.quote.findFirst({
      where: { id, tenantId },
      select: {
        id: true,
        paymentStatus: true,
        totalAmount: true,
      },
    });
    if (!quote) {
      return NextResponse.json({ error: "Presupuesto no encontrado" }, { status: 404 });
    }

    if (quote.paymentStatus === "paid") {
      return NextResponse.json({
        ok: true,
        idempotent: true,
        message: "El presupuesto ya estaba marcado como pagado",
      });
    }

    const now = new Date();
    const updated = await prisma.quote.update({
      where: { id },
      data: {
        status: "pagado",
        paymentStatus: "paid",
        paymentMethod: "transfer",
        paidAt: now,
        transferProofUrl: validated.data.transferProofUrl,
        transferConfirmedAt: now,
        transferConfirmedBy: userId,
      },
      select: {
        id: true,
        number: true,
        paymentStatus: true,
        paidAt: true,
        transferProofUrl: true,
      },
    });

    logCrmActivityAsync({
      tenantId,
      entityType: "quote",
      entityId: id,
      action: "payment_received",
      actorId: userId,
      actorName: email ?? null,
      details: {
        method: "transfer",
        amountCents: Math.round(quote.totalAmount * 100),
        transferProofUrl: validated.data.transferProofUrl,
        note: validated.data.note ?? null,
      },
    });

    return NextResponse.json({ quote: updated });
  } catch (error) {
    return apiError(error, {
      publicMessage: "No se pudo confirmar la transferencia",
      code: "QUOTE_CONFIRM_TRANSFER_ERROR",
      logContext: { tenantId, quoteId: id },
    });
  }
}
