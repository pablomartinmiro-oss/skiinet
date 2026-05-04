export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { requireTenant } from "@/lib/auth/guard";
import { prisma } from "@/lib/db";
import { apiError } from "@/lib/api-response";

/**
 * GET /api/packs/[id]/calculate-price?activeLineIds=a,b,c
 *
 * Returns the resolved pack price given a subset of active lines.
 * Logic:
 *   - Sum overridePrice (if set) or product price (looked up via productId)
 *     for every line included in activeLineIds (defaults to ALL lines).
 *   - Multiply by quantity per line.
 *   - Compare to LegoPack.price — return both totals so the UI can
 *     show savings vs sum-of-parts.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const [session, authError] = await requireTenant();
  if (authError) return authError;
  const { tenantId } = session;
  const { id } = await params;

  try {
    const pack = await prisma.legoPack.findFirst({
      where: { id, tenantId },
      include: { lines: true },
    });
    if (!pack) {
      return NextResponse.json({ error: "Pack no encontrado" }, { status: 404 });
    }

    const url = request.nextUrl;
    const activeRaw = url.searchParams.get("activeLineIds");
    const activeIds = activeRaw
      ? new Set(activeRaw.split(",").map((s) => s.trim()).filter(Boolean))
      : null;

    // Resolve product prices for lines that don't have an override.
    const productIds = pack.lines
      .filter((l) => !l.overridePrice && l.productId)
      .map((l) => l.productId as string);
    const products = productIds.length
      ? await prisma.product.findMany({
          where: { id: { in: productIds } },
          select: { id: true, name: true, price: true },
        })
      : [];
    const productPriceMap = new Map(
      products.map((p) => [p.id, { name: p.name, price: p.price }]),
    );

    let sumOfParts = 0;
    const linesOut = pack.lines
      .filter((l) => !activeIds || activeIds.has(l.id))
      .map((l) => {
        const productInfo = l.productId ? productPriceMap.get(l.productId) : null;
        const unitPrice = l.overridePrice ?? productInfo?.price ?? 0;
        const lineTotal = unitPrice * l.quantity;
        sumOfParts += lineTotal;
        return {
          lineId: l.id,
          productId: l.productId,
          label: productInfo?.name ?? "Línea sin producto",
          quantity: l.quantity,
          unitPrice,
          totalPrice: lineTotal,
        };
      });

    const packPrice = pack.price;
    const savings = Math.max(0, sumOfParts - packPrice);

    return NextResponse.json({
      packId: pack.id,
      packTitle: pack.title,
      packPrice,
      sumOfParts,
      savings,
      currency: "EUR",
      lines: linesOut,
    });
  } catch (error) {
    return apiError(error, {
      publicMessage: "Error al calcular el precio del pack",
      code: "PACK_CALC_PRICE_ERROR",
      logContext: { tenantId, packId: id },
    });
  }
}
