export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { requireOwner } from "@/lib/auth/guard";
import { apiError } from "@/lib/api-response";
import { seedTemplatesForTenant } from "@/lib/seed/templates/seed-templates";

/**
 * POST /api/admin/seed-templates
 *
 * Owner-only. Seeds the 8 email + 3 PDF templates for the current
 * tenant using the Skicenter brand kit. Idempotent — won't overwrite
 * rows marked `isCustom: true`.
 *
 * Returns counts.
 */
export async function POST() {
  const [session, authError] = await requireOwner();
  if (authError) return authError;
  const { tenantId } = session;

  try {
    const result = await seedTemplatesForTenant(tenantId);
    return NextResponse.json({ ok: true, tenantId, ...result });
  } catch (error) {
    return apiError(error, {
      publicMessage: "No se pudieron sembrar los templates",
      code: "SEED_TEMPLATES_ERROR",
      logContext: { tenantId },
    });
  }
}
