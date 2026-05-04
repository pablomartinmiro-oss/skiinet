export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { requireTenant } from "@/lib/auth/guard";
import { apiError, badRequest } from "@/lib/api-response";
import { previewSettlement } from "@/lib/suppliers/settlement-calculator";

/**
 * GET /api/suppliers/settlements/preview?supplierId=X&from=YYYY-MM-DD&to=YYYY-MM-DD
 *
 * Calculates what a settlement would contain without writing anything.
 * Used by the admin UI to show admins the pending lines before they
 * commit to creating the settlement document.
 */
export async function GET(request: NextRequest) {
  const [session, authError] = await requireTenant();
  if (authError) return authError;
  const { tenantId } = session;

  const url = request.nextUrl;
  const supplierId = url.searchParams.get("supplierId");
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");

  if (!supplierId) return badRequest("supplierId obligatorio");
  if (!from || !to) return badRequest("from y to son obligatorios (YYYY-MM-DD)");

  const startDate = new Date(from);
  const endDate = new Date(to);
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    return badRequest("Formato de fecha inválido");
  }
  if (startDate.getTime() > endDate.getTime()) {
    return badRequest("from debe ser anterior o igual a to");
  }

  try {
    const preview = await previewSettlement(tenantId, supplierId, startDate, endDate);
    return NextResponse.json({ preview });
  } catch (error) {
    return apiError(error, {
      publicMessage: "No se pudo calcular el preview",
      code: "SETTLEMENT_PREVIEW_ERROR",
      logContext: { tenantId, supplierId },
    });
  }
}
