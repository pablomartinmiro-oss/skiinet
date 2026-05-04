export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { requireTenant } from "@/lib/auth/guard";
import { prisma } from "@/lib/db";
import { apiError } from "@/lib/api-response";
import { getEntityTimeline } from "@/lib/crm/activity-log";

/**
 * GET /api/crm/leads/[id]/activity-log
 * Returns the activity timeline for a single Lead, newest first.
 * Optional query params:
 *   - limit: number of rows (default 50, max 200)
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
    // Verify lead belongs to tenant before exposing its timeline
    const lead = await prisma.lead.findFirst({
      where: { id, tenantId },
      select: { id: true },
    });
    if (!lead) {
      return NextResponse.json({ error: "Lead no encontrado" }, { status: 404 });
    }

    const url = request.nextUrl;
    const limitRaw = url.searchParams.get("limit");
    const limit = limitRaw ? Math.min(200, Math.max(1, parseInt(limitRaw, 10) || 50)) : 50;

    const timeline = await getEntityTimeline(tenantId, "lead", id, limit);
    return NextResponse.json({ entries: timeline });
  } catch (error) {
    return apiError(error, {
      publicMessage: "No se pudo cargar el historial",
      code: "ACTIVITY_LOG_FETCH_ERROR",
      logContext: { tenantId, leadId: id },
    });
  }
}
