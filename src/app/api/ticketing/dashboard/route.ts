export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { requireTenant } from "@/lib/auth/guard";
import { prisma } from "@/lib/db";
import { apiError } from "@/lib/api-response";

/**
 * GET /api/ticketing/dashboard
 *
 * KPI dashboard for the coupon ticketing module:
 *   - total redemptions
 *   - byStatus
 *   - byFinancialStatus
 *   - byPlatform (top 10)
 *   - recent (last 20 redemptions, newest first)
 */
export async function GET(_request: NextRequest) {
  const [session, authError] = await requireTenant();
  if (authError) return authError;
  const { tenantId } = session;

  try {
    const [total, byStatus, byFinancialStatus, byPlatform, recent] = await Promise.all([
      prisma.couponRedemption.count({ where: { tenantId } }),
      prisma.couponRedemption.groupBy({
        by: ["status"],
        where: { tenantId },
        _count: { _all: true },
      }),
      prisma.couponRedemption.groupBy({
        by: ["financialStatus"],
        where: { tenantId },
        _count: { _all: true },
      }),
      prisma.couponRedemption.groupBy({
        by: ["platformId"],
        where: { tenantId, platformId: { not: null } },
        _count: { _all: true },
        orderBy: { _count: { id: "desc" } },
        take: 10,
      }),
      prisma.couponRedemption.findMany({
        where: { tenantId },
        orderBy: { createdAt: "desc" },
        take: 20,
        select: {
          id: true,
          code: true,
          status: true,
          financialStatus: true,
          customerName: true,
          email: true,
          createdAt: true,
        },
      }),
    ]);

    // Hydrate platform names for byPlatform
    const platformIds = byPlatform
      .map((row) => row.platformId)
      .filter((x): x is string => !!x);
    const platforms = platformIds.length
      ? await prisma.externalPlatform.findMany({
          where: { id: { in: platformIds }, tenantId },
          select: { id: true, name: true },
        })
      : [];
    const platformMap = new Map(platforms.map((p) => [p.id, p.name]));

    const byPlatformOut = byPlatform.map((row) => ({
      platformId: row.platformId,
      name: row.platformId ? (platformMap.get(row.platformId) ?? "Desconocida") : "Sin asignar",
      count: row._count._all,
    }));

    const statusMap: Record<string, number> = {};
    for (const r of byStatus) statusMap[r.status] = r._count._all;
    const financialMap: Record<string, number> = {};
    for (const r of byFinancialStatus) financialMap[r.financialStatus] = r._count._all;

    return NextResponse.json({
      total,
      byStatus: statusMap,
      byFinancialStatus: financialMap,
      byPlatform: byPlatformOut,
      recent,
    });
  } catch (error) {
    return apiError(error, {
      publicMessage: "No se pudo cargar el dashboard de ticketing",
      code: "TICKETING_DASHBOARD_ERROR",
      logContext: { tenantId },
    });
  }
}
