export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { requireTenant } from "@/lib/auth/guard";
import { requireModule } from "@/lib/modules/guard";
import { prisma } from "@/lib/db";
import { apiError } from "@/lib/api-response";
import { LEAD_STATUS } from "@/lib/validation/leads";

export async function GET() {
  const [session, authError] = await requireTenant();
  if (authError) return authError;
  const modError = await requireModule(session.tenantId, "leads");
  if (modError) return modError;

  const { tenantId } = session;

  try {
    const [total, byStatus, scoreAgg] = await Promise.all([
      prisma.lead.count({ where: { tenantId } }),
      prisma.lead.groupBy({
        by: ["status"],
        where: { tenantId },
        _count: { _all: true },
      }),
      prisma.lead.aggregate({
        where: { tenantId },
        _avg: { score: true },
      }),
    ]);

    const counts: Record<string, number> = {};
    for (const s of LEAD_STATUS) counts[s] = 0;
    for (const row of byStatus) counts[row.status] = row._count._all;

    const converted = counts["convertido"] ?? 0;
    const conversionRate = total > 0 ? (converted / total) * 100 : 0;

    return NextResponse.json({
      total,
      byStatus: counts,
      avgScore: Math.round(scoreAgg._avg.score ?? 0),
      conversionRate: Math.round(conversionRate * 10) / 10,
    });
  } catch (error) {
    return apiError(error, {
      publicMessage: "Failed to fetch lead stats",
      code: "LEAD_STATS_ERROR",
      logContext: { tenantId },
    });
  }
}
