export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { requireTenant } from "@/lib/auth/guard";
import { prisma } from "@/lib/db";
import { apiError } from "@/lib/api-response";

/**
 * GET /api/storefront/discount-codes/[id]/uses
 * Returns the usage history for a discount code (newest first).
 * Optional query: ?limit=50 (max 200)
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
    const code = await prisma.discountCode.findFirst({
      where: { id, tenantId },
      select: { id: true, code: true, usedCount: true },
    });
    if (!code) {
      return NextResponse.json({ error: "Codigo no encontrado" }, { status: 404 });
    }

    const url = request.nextUrl;
    const limitRaw = url.searchParams.get("limit");
    const limit = limitRaw ? Math.min(200, Math.max(1, parseInt(limitRaw, 10) || 50)) : 50;

    const uses = await prisma.discountCodeUse.findMany({
      where: { tenantId, codeId: id },
      orderBy: { appliedAt: "desc" },
      take: limit,
    });

    return NextResponse.json({
      code: code.code,
      totalUses: code.usedCount,
      uses,
    });
  } catch (error) {
    return apiError(error, {
      publicMessage: "No se pudo cargar el historial",
      code: "DISCOUNT_USES_ERROR",
      logContext: { tenantId, codeId: id },
    });
  }
}
