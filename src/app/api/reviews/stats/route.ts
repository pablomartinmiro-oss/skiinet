export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { requireTenant } from "@/lib/auth/guard";
import { prisma } from "@/lib/db";
import { apiError } from "@/lib/api-response";

/**
 * GET /api/reviews/stats
 * Aggregate review statistics for the admin dashboard.
 *
 * Returns:
 *   - total reviews
 *   - global avg rating (across approved reviews only)
 *   - counts by status (pending/approved/rejected)
 *   - counts by entityType
 *   - verified booking count
 *
 * All filters scoped by tenantId.
 */
export async function GET(_request: NextRequest) {
  const [session, authError] = await requireTenant();
  if (authError) return authError;
  const { tenantId } = session;

  try {
    const [total, byStatus, byEntityType, avgAgg, verifiedCount] = await Promise.all([
      prisma.review.count({ where: { tenantId } }),
      prisma.review.groupBy({
        by: ["status"],
        where: { tenantId },
        _count: { _all: true },
      }),
      prisma.review.groupBy({
        by: ["entityType"],
        where: { tenantId, status: "approved" },
        _count: { _all: true },
        _avg: { rating: true },
      }),
      prisma.review.aggregate({
        where: { tenantId, status: "approved" },
        _avg: { rating: true },
        _count: { _all: true },
      }),
      prisma.review.count({ where: { tenantId, verifiedBooking: true } }),
    ]);

    const statusCounts: Record<string, number> = {};
    for (const row of byStatus) {
      statusCounts[row.status] = row._count._all;
    }

    const entityTypeStats = byEntityType.map((row) => ({
      entityType: row.entityType,
      count: row._count._all,
      avgRating: row._avg.rating ?? 0,
    }));

    return NextResponse.json({
      total,
      approvedCount: avgAgg._count._all,
      avgRating: avgAgg._avg.rating ?? 0,
      verifiedBookingCount: verifiedCount,
      byStatus: statusCounts,
      byEntityType: entityTypeStats,
    });
  } catch (error) {
    return apiError(error, {
      publicMessage: "No se pudieron cargar las estadisticas de reseñas",
      code: "REVIEWS_STATS_ERROR",
      logContext: { tenantId },
    });
  }
}
