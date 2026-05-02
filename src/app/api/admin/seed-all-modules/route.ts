export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { requireTenant } from "@/lib/auth/guard";
import { apiError } from "@/lib/api-response";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { seedExtraModules } from "@/lib/seed/seed-extra-modules";

const log = logger.child({ route: "seed-all-modules" });

/**
 * POST /api/admin/seed-all-modules
 *
 * Idempotent — seeds the "extra" demo modules (leads, internal messages, notifications,
 * lodge stays, invoices, expenses, suppliers + settlements, reviews, TPV session + sales,
 * extra room type + extra instructors with assignments) without wiping existing data.
 *
 * Useful for populating prod/staging tenants without losing data already there.
 * Intended for the demo tenant — refuses for non-demo tenants to prevent accidental writes.
 */
export async function POST() {
  const [session, authError] = await requireTenant();
  if (authError) return authError;

  const { tenantId } = session;

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { isDemo: true },
  });
  if (!tenant?.isDemo) {
    return NextResponse.json(
      { error: "Solo disponible para la cuenta demo" },
      { status: 403 },
    );
  }

  try {
    const result = await seedExtraModules(prisma, tenantId, { wipe: false });
    log.info({ result }, "Seed-all-modules complete (additive)");
    return NextResponse.json({ success: true, seeded: result });
  } catch (error) {
    return apiError(error, {
      publicMessage: "Failed to seed extra modules",
      code: "ADMIN_ERROR",
      logContext: { tenantId },
    });
  }
}
