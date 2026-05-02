export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { requireTenant } from "@/lib/auth/guard";
import { prisma } from "@/lib/db";
import { apiError } from "@/lib/api-response";

/**
 * GET /api/availability/rental?date=YYYY-MM-DD&productId=...&station=...
 *  - When `productId` is provided: returns the matching RentalInventory pools
 *    plus the count of in-flight RentalOrder items overlapping `date`.
 *  - When `station` is provided without `productId`: returns the full pool
 *    list for the station.
 */
export async function GET(request: NextRequest) {
  const [session, authError] = await requireTenant();
  if (authError) return authError;
  const { tenantId } = session;

  const { searchParams } = request.nextUrl;
  const date = searchParams.get("date");
  const productId = searchParams.get("productId");
  const station = searchParams.get("station");
  const equipmentType = searchParams.get("equipmentType");
  const qualityTier = searchParams.get("qualityTier");

  if (!date) {
    return NextResponse.json({ error: "date is required" }, { status: 400 });
  }
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);

  try {
    // Resolve filter from a Product → equipmentType + qualityTier hint
    let resolvedEquipment = equipmentType;
    let resolvedTier = qualityTier;
    let resolvedStation = station;

    if (productId) {
      const product = await prisma.product.findFirst({
        where: { id: productId, OR: [{ tenantId }, { tenantId: null }] },
        select: { tier: true, station: true, category: true, name: true },
      });
      if (!product) {
        return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });
      }
      resolvedTier =
        resolvedTier ?? (product.tier?.includes("alta") ? "alta" : "media");
      resolvedStation = resolvedStation ?? product.station ?? "all";
      // equipmentType inferred from product name when not provided
      if (!resolvedEquipment) {
        const n = product.name.toLowerCase();
        resolvedEquipment = n.includes("snow") ? "SNOWBOARD" : "SKI";
      }
    }

    const inventory = await prisma.rentalInventory.findMany({
      where: {
        tenantId,
        ...(resolvedStation && resolvedStation !== "all" ? { stationSlug: resolvedStation } : {}),
        ...(resolvedEquipment ? { equipmentType: resolvedEquipment } : {}),
        ...(resolvedTier ? { qualityTier: resolvedTier } : {}),
      },
      orderBy: [{ stationSlug: "asc" }, { equipmentType: "asc" }, { size: "asc" }],
    });

    // Get blocked counts per pool (overlapping orders on `date`)
    const blocking = await prisma.rentalOrder.findMany({
      where: {
        tenantId,
        ...(resolvedStation && resolvedStation !== "all" ? { stationSlug: resolvedStation } : {}),
        status: { in: ["RESERVED", "PREPARED", "PICKED_UP"] },
        pickupDate: { lte: target },
        returnDate: { gte: target },
      },
      select: {
        items: { select: { equipmentType: true, qualityTier: true, size: true } },
      },
    });

    const blockedKeyCounts = new Map<string, number>();
    for (const order of blocking) {
      for (const it of order.items) {
        const key = `${it.equipmentType}::${it.qualityTier}`;
        blockedKeyCounts.set(key, (blockedKeyCounts.get(key) ?? 0) + 1);
      }
    }

    const pools = inventory.map((inv) => {
      const blocked = blockedKeyCounts.get(`${inv.equipmentType}::${inv.qualityTier}`) ?? 0;
      const available = Math.max(0, inv.availableQuantity - blocked);
      return {
        id: inv.id,
        stationSlug: inv.stationSlug,
        equipmentType: inv.equipmentType,
        size: inv.size,
        qualityTier: inv.qualityTier,
        totalQuantity: inv.totalQuantity,
        availableQuantity: inv.availableQuantity,
        blockedByOrders: blocked,
        effectiveAvailable: available,
        condition: inv.condition,
      };
    });

    const totalEffective = pools.reduce((s, p) => s + p.effectiveAvailable, 0);

    return NextResponse.json({
      date: target.toISOString().slice(0, 10),
      filters: { productId, station: resolvedStation, equipmentType: resolvedEquipment, qualityTier: resolvedTier },
      totalEffective,
      pools,
    });
  } catch (error) {
    return apiError(error, {
      publicMessage: "Error al consultar disponibilidad",
      code: "RENTAL_AVAILABILITY_ERROR",
      logContext: { tenantId },
    });
  }
}
