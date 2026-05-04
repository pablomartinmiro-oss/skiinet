export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { requireTenant } from "@/lib/auth/guard";
import { prisma } from "@/lib/db";
import { apiError } from "@/lib/api-response";

/**
 * GET /api/cancellations/counters
 *
 * KPI badges for the cancellations admin sidebar:
 *   - total
 *   - byStatus (recibida, en_revision, pendiente_documentacion, ...)
 *   - stale (recibida >48h sin atender)
 */
export async function GET(_request: NextRequest) {
  const [session, authError] = await requireTenant();
  if (authError) return authError;
  const { tenantId } = session;

  try {
    const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);

    const [total, byStatus, stale] = await Promise.all([
      prisma.cancellationRequest.count({ where: { tenantId } }),
      prisma.cancellationRequest.groupBy({
        by: ["status"],
        where: { tenantId },
        _count: { _all: true },
      }),
      prisma.cancellationRequest.count({
        where: {
          tenantId,
          status: "recibida",
          submissionDate: { lt: fortyEightHoursAgo },
        },
      }),
    ]);

    const statusCounts: Record<string, number> = {};
    for (const row of byStatus) {
      statusCounts[row.status] = row._count._all;
    }

    return NextResponse.json({
      total,
      stale,
      byStatus: statusCounts,
    });
  } catch (error) {
    return apiError(error, {
      publicMessage: "No se pudieron cargar los contadores",
      code: "CANCELLATION_COUNTERS_ERROR",
      logContext: { tenantId },
    });
  }
}
