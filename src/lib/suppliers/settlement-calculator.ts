import { prisma } from "@/lib/db";

/**
 * Settlement calculator — pure DB query, no writes.
 *
 * Aggregates reservations linked to a supplier's products in a date
 * window into the lines that will compose a SupplierSettlement.
 */

export type SettlementLineDraft = {
  serviceType: string;
  productId: string | null;
  serviceDate: Date;
  paxCount: number;
  saleAmount: number;
  commissionPercentage: number;
  commissionAmount: number;
  reservationId: string | null;
};

export type SettlementPreview = {
  supplierId: string;
  supplierName: string;
  startDate: Date;
  endDate: Date;
  lines: SettlementLineDraft[];
  grossAmount: number;
  commissionAmount: number;
  netAmount: number;
};

/**
 * Compute what a settlement for `supplierId` would look like in the
 * given window. Reservations qualify when:
 *   - status = "confirmada"
 *   - activityDate ∈ [startDate, endDate]
 *   - reservation has a quote whose items reference a product that
 *     belongs to the supplier
 *
 * Commission is taken from Supplier.commissionPercentage. Other commission
 * types (fixed, margin, hybrid) fall back to percentage in this MVP.
 */
export async function previewSettlement(
  tenantId: string,
  supplierId: string,
  startDate: Date,
  endDate: Date,
): Promise<SettlementPreview> {
  const supplier = await prisma.supplier.findFirst({
    where: { id: supplierId, tenantId },
    select: {
      id: true,
      fiscalName: true,
      commissionPercentage: true,
    },
  });
  if (!supplier) {
    throw new Error(`Supplier ${supplierId} not found in tenant ${tenantId}`);
  }

  // Get supplier's products (Supplier 1—N Product via supplierId on Product)
  const products = await prisma.product.findMany({
    where: { supplierId, OR: [{ tenantId }, { tenantId: null }] },
    select: { id: true, category: true, name: true },
  });
  const productIds = products.map((p) => p.id);
  const productMap = new Map(products.map((p) => [p.id, p]));

  if (productIds.length === 0) {
    return {
      supplierId,
      supplierName: supplier.fiscalName,
      startDate,
      endDate,
      lines: [],
      grossAmount: 0,
      commissionAmount: 0,
      netAmount: 0,
    };
  }

  // Reservations in window with at least one quote item referencing
  // a supplier product. Reservations without a Quote are ignored — pure
  // walk-ins don't get settled by this path (admin can register them
  // manually as expense lines).
  const reservations = await prisma.reservation.findMany({
    where: {
      tenantId,
      status: "confirmada",
      activityDate: { gte: startDate, lte: endDate },
      quote: {
        items: {
          some: { productId: { in: productIds } },
        },
      },
    },
    include: {
      quote: {
        include: {
          items: {
            where: { productId: { in: productIds } },
          },
        },
      },
    },
  });

  const lines: SettlementLineDraft[] = [];
  for (const r of reservations) {
    if (!r.quote) continue;
    for (const item of r.quote.items) {
      if (!item.productId) continue;
      const product = productMap.get(item.productId);
      if (!product) continue;
      const saleAmount = item.totalPrice;
      const commissionAmount = (saleAmount * supplier.commissionPercentage) / 100;
      lines.push({
        serviceType: product.category ?? "activity",
        productId: item.productId,
        serviceDate: r.activityDate,
        paxCount: item.quantity,
        saleAmount,
        commissionPercentage: supplier.commissionPercentage,
        commissionAmount,
        reservationId: r.id,
      });
    }
  }

  const grossAmount = lines.reduce((s, l) => s + l.saleAmount, 0);
  const commissionAmount = lines.reduce((s, l) => s + l.commissionAmount, 0);
  const netAmount = grossAmount - commissionAmount;

  return {
    supplierId,
    supplierName: supplier.fiscalName,
    startDate,
    endDate,
    lines,
    grossAmount: round2(grossAmount),
    commissionAmount: round2(commissionAmount),
    netAmount: round2(netAmount),
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
