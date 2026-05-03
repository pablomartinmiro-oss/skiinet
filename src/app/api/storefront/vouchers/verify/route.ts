export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { apiError, badRequest } from "@/lib/api-response";
import { rateLimit, getClientIP } from "@/lib/rate-limit";

/**
 * GET /api/storefront/vouchers/verify?code=BON-2026-0001&tenantSlug=skicenter
 *
 * PUBLIC endpoint — no auth.
 * Lets a customer holding a compensation voucher (issued after a
 * cancellation) check whether the code is still valid before checkout.
 *
 * Returns:
 *   - 200 { valid, isUsed, value, type, expirationDate, expired } when found
 *   - 404 when the code does not exist for the tenant
 *
 * Rate-limited per IP — voucher codes are short, brute-force prevention.
 */
export async function GET(request: NextRequest) {
  const log = logger.child({ path: "/api/storefront/vouchers/verify" });
  const rl = await rateLimit(getClientIP(request), "public");
  if (rl) return rl;

  const url = request.nextUrl;
  const code = url.searchParams.get("code")?.trim();
  const tenantSlug = url.searchParams.get("tenantSlug")?.trim();

  if (!code) return badRequest("code es obligatorio");
  if (!tenantSlug) return badRequest("tenantSlug es obligatorio");

  try {
    const tenant = await prisma.tenant.findUnique({
      where: { slug: tenantSlug },
      select: { id: true },
    });
    if (!tenant) {
      return NextResponse.json({ error: "Tenant no encontrado" }, { status: 404 });
    }

    const voucher = await prisma.compensationVoucher.findUnique({
      where: {
        tenantId_code: { tenantId: tenant.id, code: code.toUpperCase() },
      },
      select: {
        id: true,
        type: true,
        value: true,
        expirationDate: true,
        isUsed: true,
      },
    });

    if (!voucher) {
      log.info({ tenantSlug, code }, "Voucher verification — not found");
      return NextResponse.json({ valid: false, error: "Codigo no valido" }, { status: 404 });
    }

    const now = new Date();
    const expired =
      !!voucher.expirationDate && voucher.expirationDate.getTime() < now.getTime();
    const valid = !voucher.isUsed && !expired;

    return NextResponse.json({
      valid,
      isUsed: voucher.isUsed,
      expired,
      type: voucher.type,
      value: voucher.value,
      expirationDate: voucher.expirationDate,
    });
  } catch (error) {
    return apiError(error, {
      publicMessage: "Error al verificar el bono",
      code: "VOUCHER_VERIFY_ERROR",
    });
  }
}
