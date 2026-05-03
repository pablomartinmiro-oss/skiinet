export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireTenant } from "@/lib/auth/guard";
import { prisma } from "@/lib/db";
import { apiError, badRequest } from "@/lib/api-response";
import { validateBody } from "@/lib/validation";
import { previewSettlement } from "@/lib/suppliers/settlement-calculator";
import { generateDocumentNumber } from "@/lib/documents/numbering";
import { logCrmActivityAsync } from "@/lib/crm/activity-log";

const generateSchema = z.object({
  from: z.string(),  // YYYY-MM-DD
  to: z.string(),
  /** If true, create the settlement even when lines are empty (zero-value). */
  allowEmpty: z.boolean().optional().default(false),
});

/**
 * POST /api/suppliers/[id]/generate-settlements
 *
 * Builds a SupplierSettlement + SettlementLines for the supplier in the
 * given window. Uses generateDocumentNumber("settlement") for the
 * sequential LIQ-2026-XXXX number. Returns the new settlement id.
 *
 * Idempotency-light: refuses to create if a settlement with the same
 * (supplierId, startDate, endDate) already exists. Caller can delete
 * + re-generate if they want a recalculation.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const [session, authError] = await requireTenant();
  if (authError) return authError;
  const { tenantId, userId, email } = session;
  const { id: supplierId } = await params;

  try {
    const body = await request.json();
    const validated = validateBody(body, generateSchema);
    if (!validated.ok) return badRequest(validated.error);

    const startDate = new Date(validated.data.from);
    const endDate = new Date(validated.data.to);
    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      return badRequest("Formato de fecha inválido");
    }

    // Refuse if an identical-window settlement exists already.
    const existing = await prisma.supplierSettlement.findFirst({
      where: { tenantId, supplierId, startDate, endDate },
      select: { id: true, number: true },
    });
    if (existing) {
      return NextResponse.json(
        {
          error: "Ya existe una liquidación para este rango",
          existing,
        },
        { status: 409 },
      );
    }

    const preview = await previewSettlement(tenantId, supplierId, startDate, endDate);
    if (preview.lines.length === 0 && !validated.data.allowEmpty) {
      return NextResponse.json(
        {
          error: "No hay líneas para liquidar en ese rango",
          hint: "Pasa allowEmpty:true para crear una liquidación vacía",
        },
        { status: 400 },
      );
    }

    const number = await generateDocumentNumber(tenantId, "settlement", {
      generatedBy: userId,
      context: "auto_generate",
    });

    const settlement = await prisma.$transaction(async (tx) => {
      const created = await tx.supplierSettlement.create({
        data: {
          tenantId,
          supplierId,
          number,
          startDate,
          endDate,
          status: "draft",
          grossAmount: preview.grossAmount,
          commissionAmount: preview.commissionAmount,
          netAmount: preview.netAmount,
        },
      });

      if (preview.lines.length > 0) {
        await tx.settlementLine.createMany({
          data: preview.lines.map((l) => ({
            tenantId,
            settlementId: created.id,
            serviceType: l.serviceType,
            productId: l.productId,
            serviceDate: l.serviceDate,
            paxCount: l.paxCount,
            saleAmount: l.saleAmount,
            commissionPercentage: l.commissionPercentage,
            commissionAmount: l.commissionAmount,
            reservationId: l.reservationId,
          })),
        });
      }

      await tx.settlementStatusLog.create({
        data: {
          tenantId,
          settlementId: created.id,
          previousStatus: "",
          newStatus: "draft",
          actorId: userId,
          reason: "auto_generated",
        },
      });

      return created;
    });

    logCrmActivityAsync({
      tenantId,
      entityType: "invoice", // closest existing entity for settlements
      entityId: settlement.id,
      action: "created",
      actorId: userId,
      actorName: email ?? null,
      details: {
        kind: "supplier_settlement",
        supplierId,
        number,
        lineCount: preview.lines.length,
        netAmount: preview.netAmount,
      },
    });

    return NextResponse.json(
      { settlement, lineCount: preview.lines.length },
      { status: 201 },
    );
  } catch (error) {
    return apiError(error, {
      publicMessage: "No se pudo generar la liquidación",
      code: "SETTLEMENT_GENERATE_ERROR",
      logContext: { tenantId, supplierId },
    });
  }
}
