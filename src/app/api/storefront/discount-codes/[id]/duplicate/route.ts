export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { requireTenant } from "@/lib/auth/guard";
import { prisma } from "@/lib/db";
import { apiError } from "@/lib/api-response";

/**
 * POST /api/storefront/discount-codes/[id]/duplicate
 * Clone a discount code with a fresh code suffix and zeroed usedCount.
 * Useful for batch-creating campaign codes from a template.
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const [session, authError] = await requireTenant();
  if (authError) return authError;
  const { tenantId, userId } = session;
  const { id } = await params;

  try {
    const source = await prisma.discountCode.findFirst({
      where: { id, tenantId },
    });
    if (!source) {
      return NextResponse.json(
        { error: "Codigo de descuento no encontrado" },
        { status: 404 },
      );
    }

    // Generate new unique code by appending a 6-char suffix.
    const suffix = Math.random().toString(36).slice(2, 8).toUpperCase();
    const newCode = `${source.code}-${suffix}`;

    const duplicate = await prisma.discountCode.create({
      data: {
        tenantId,
        code: newCode,
        name: source.name ? `${source.name} (copia)` : null,
        description: source.description,
        observations: source.observations,
        type: source.type,
        value: source.value,
        expirationDate: source.expirationDate,
        maxUses: source.maxUses,
        usedCount: 0,
        isActive: source.isActive,
        origin: source.origin,
        compensationVoucherId: null, // Duplicates are not voucher-bound
        clientEmail: null,
        clientName: null,
        createdById: userId,
      },
    });

    return NextResponse.json({ code: duplicate }, { status: 201 });
  } catch (error) {
    return apiError(error, {
      publicMessage: "No se pudo duplicar el codigo",
      code: "DISCOUNT_DUPLICATE_ERROR",
      logContext: { tenantId, sourceId: id },
    });
  }
}
