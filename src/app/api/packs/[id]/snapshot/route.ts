export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireTenant } from "@/lib/auth/guard";
import { prisma } from "@/lib/db";
import { apiError, badRequest } from "@/lib/api-response";
import { validateBody } from "@/lib/validation";
import type { Prisma } from "@/generated/prisma/client";

const snapshotSchema = z.object({
  operationType: z.enum(["tpv_sale", "reservation", "quote"]),
  operationId: z.string().min(1),
  /** Optional override of activated line IDs. Defaults to all required lines. */
  activeLineIds: z.array(z.string()).optional(),
});

/**
 * POST /api/packs/[id]/snapshot
 * Freeze a pack's pricing/composition at sale time. Returns the snapshot.
 * Idempotent at (tenantId, operationType, operationId) — re-calling
 * returns the existing snapshot without creating a duplicate.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const [session, authError] = await requireTenant();
  if (authError) return authError;
  const { tenantId } = session;
  const { id } = await params;

  try {
    const body = await request.json();
    const validated = validateBody(body, snapshotSchema);
    if (!validated.ok) return badRequest(validated.error);
    const data = validated.data;

    // Idempotency
    const existing = await prisma.legoPackSnapshot.findFirst({
      where: {
        tenantId,
        operationType: data.operationType,
        operationId: data.operationId,
      },
    });
    if (existing) {
      return NextResponse.json({ snapshot: existing, idempotent: true });
    }

    const pack = await prisma.legoPack.findFirst({
      where: { id, tenantId },
      include: { lines: true },
    });
    if (!pack) {
      return NextResponse.json({ error: "Pack no encontrado" }, { status: 404 });
    }

    const activeIds = data.activeLineIds
      ? new Set(data.activeLineIds)
      : new Set(pack.lines.filter((l) => l.isRequired).map((l) => l.id));

    // Snapshot only active lines
    const activeLines = pack.lines.filter((l) => activeIds.has(l.id));

    const productIds = activeLines
      .filter((l) => !l.overridePrice && l.productId)
      .map((l) => l.productId as string);
    const products = productIds.length
      ? await prisma.product.findMany({
          where: { id: { in: productIds } },
          select: { id: true, name: true, price: true },
        })
      : [];
    const productMap = new Map(products.map((p) => [p.id, p]));

    let total = 0;
    const linesJson = activeLines.map((l) => {
      const product = l.productId ? productMap.get(l.productId) : null;
      const unitPrice = l.overridePrice ?? product?.price ?? 0;
      const lineTotal = unitPrice * l.quantity;
      total += lineTotal;
      return {
        lineId: l.id,
        productId: l.productId,
        label: product?.name ?? "Línea",
        quantity: l.quantity,
        unitPrice,
        totalPrice: lineTotal,
      };
    });

    // Use the pack's selling price if it's set explicitly (the agency may
    // discount the bundle vs sum of parts) — fall back to summed lines.
    const totalPrice = pack.price > 0 ? pack.price : total;

    const snapshot = await prisma.legoPackSnapshot.create({
      data: {
        tenantId,
        packId: pack.id,
        packTitle: pack.title,
        packSlug: pack.slug,
        operationType: data.operationType,
        operationId: data.operationId,
        totalPrice,
        linesJson: linesJson as unknown as Prisma.InputJsonValue,
      },
    });

    return NextResponse.json({ snapshot }, { status: 201 });
  } catch (error) {
    return apiError(error, {
      publicMessage: "No se pudo guardar el snapshot del pack",
      code: "PACK_SNAPSHOT_ERROR",
      logContext: { tenantId, packId: id },
    });
  }
}

/**
 * GET /api/packs/[id]/snapshot?operationType=X&operationId=Y
 * Lookup snapshot by operation. Returns 404 if missing.
 */
export async function GET(
  request: NextRequest,
  { params: _params }: { params: Promise<{ id: string }> },
) {
  const [session, authError] = await requireTenant();
  if (authError) return authError;
  const { tenantId } = session;

  const url = request.nextUrl;
  const operationType = url.searchParams.get("operationType");
  const operationId = url.searchParams.get("operationId");
  if (!operationType || !operationId) {
    return badRequest("operationType y operationId son obligatorios");
  }

  const snapshot = await prisma.legoPackSnapshot.findFirst({
    where: { tenantId, operationType, operationId },
  });
  if (!snapshot) {
    return NextResponse.json({ error: "Snapshot no encontrado" }, { status: 404 });
  }
  return NextResponse.json({ snapshot });
}
