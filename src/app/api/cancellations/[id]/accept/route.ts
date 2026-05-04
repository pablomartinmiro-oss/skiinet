export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireTenant } from "@/lib/auth/guard";
import { prisma } from "@/lib/db";
import { apiError, badRequest } from "@/lib/api-response";
import { validateBody } from "@/lib/validation";
import { generateDocumentNumber } from "@/lib/documents/numbering";
import { logCrmActivityAsync } from "@/lib/crm/activity-log";

const acceptSchema = z.object({
  resolution: z.enum(["fully_accepted", "partially_accepted"]).default("fully_accepted"),
  /** Refund money — produces credit_note number + financialStatus = pendiente_devolucion. */
  refundAmount: z.number().min(0).optional().nullable(),
  /** Issue a compensation voucher of this monetary value (alternative to / additional to refund). */
  voucherAmount: z.number().min(0).optional().nullable(),
  /** Voucher expiry — defaults to +6 months from acceptance. */
  voucherExpiresInDays: z.number().int().min(1).max(3650).optional(),
  notes: z.string().max(2000).optional(),
});

/**
 * POST /api/cancellations/[id]/accept
 *
 * Accept a cancellation request. Depending on the body:
 *   - refundAmount > 0 → assigns a sequential creditNoteNumber (ANU-YYYY-NNNN)
 *     via generateDocumentNumber("cancellation"), sets financialStatus =
 *     "pendiente_devolucion".
 *   - voucherAmount > 0 → creates a CompensationVoucher
 *     (BON-YYYY-NNNN-suffix) linked to this request, sets
 *     financialStatus = "bono_emitido" if no refund.
 *
 * Idempotent — re-accepting updates fields and logs again, but never
 * issues a second credit-note number nor a second voucher (checked).
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
    const validated = validateBody(body, acceptSchema);
    if (!validated.ok) return badRequest(validated.error);
    const data = validated.data;

    const existing = await prisma.cancellationRequest.findFirst({
      where: { id, tenantId },
      select: {
        id: true,
        status: true,
        creditNoteNumber: true,
        vouchers: { select: { id: true } },
      },
    });
    if (!existing) {
      return NextResponse.json({ error: "Solicitud no encontrada" }, { status: 404 });
    }

    const refundRequested = (data.refundAmount ?? 0) > 0;
    const voucherRequested = (data.voucherAmount ?? 0) > 0;
    if (!refundRequested && !voucherRequested) {
      return badRequest("Debe especificar refundAmount o voucherAmount > 0");
    }

    // Allocate creditNoteNumber if refund requested AND not already issued.
    let creditNoteNumber = existing.creditNoteNumber;
    if (refundRequested && !creditNoteNumber) {
      creditNoteNumber = await generateDocumentNumber(tenantId, "cancellation", {
        generatedBy: userId,
        context: "cancellation_accept",
      });
    }

    // Allocate voucher if requested AND no voucher already issued for this request.
    let voucher: { id: string; code: string } | null = null;
    if (voucherRequested && existing.vouchers.length === 0) {
      const voucherCode = await generateDocumentNumber(tenantId, "credit_note", {
        generatedBy: userId,
        context: "cancellation_voucher",
      });
      const expiresAt = data.voucherExpiresInDays
        ? new Date(Date.now() + data.voucherExpiresInDays * 24 * 60 * 60 * 1000)
        : new Date(Date.now() + 180 * 24 * 60 * 60 * 1000);
      const created = await prisma.compensationVoucher.create({
        data: {
          tenantId,
          code: voucherCode,
          cancellationId: id,
          type: "monetary",
          value: data.voucherAmount ?? 0,
          expirationDate: expiresAt,
          isUsed: false,
        },
        select: { id: true, code: true },
      });
      voucher = created;
    }

    const financialStatus = refundRequested
      ? "pendiente_devolucion"
      : voucherRequested
        ? "bono_emitido"
        : null;

    const updated = await prisma.$transaction(async (tx) => {
      const r = await tx.cancellationRequest.update({
        where: { id },
        data: {
          status: "resuelta",
          resolution: data.resolution,
          financialStatus,
          refundAmount: data.refundAmount ?? null,
          creditNoteNumber: creditNoteNumber ?? null,
          resolvedAt: new Date(),
        },
      });
      await tx.cancellationLog.create({
        data: {
          tenantId,
          requestId: id,
          previousStatus: existing.status,
          newStatus: "resuelta",
          actorId: userId,
          notes: data.notes ?? null,
        },
      });
      return r;
    });

    logCrmActivityAsync({
      tenantId,
      entityType: "reservation",
      entityId: id,
      action: "status_changed",
      actorId: userId,
      actorName: email ?? null,
      details: {
        kind: "cancellation_accepted",
        resolution: data.resolution,
        refundAmount: data.refundAmount ?? 0,
        voucherAmount: data.voucherAmount ?? 0,
        creditNoteNumber,
        voucherCode: voucher?.code ?? null,
      },
    });

    return NextResponse.json({
      request: updated,
      creditNoteNumber: creditNoteNumber ?? null,
      voucher,
    });
  } catch (error) {
    return apiError(error, {
      publicMessage: "No se pudo aceptar la solicitud",
      code: "CANCELLATION_ACCEPT_ERROR",
      logContext: { tenantId, requestId: id },
    });
  }
}
