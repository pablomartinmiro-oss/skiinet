import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { logger } from "@/lib/logger";

const log = logger.child({ module: "leads/resolve-tenant" });

export type ResolveTenantInput = {
  /** From URL path param (e.g. /s/[slug]/...) */
  slug?: string | null;
  /** From request body (forms can pass it explicitly) */
  tenantSlug?: string | null;
};

export type ResolveTenantResult =
  | { ok: true; tenantId: string; via: "slug" | "body" | "default" }
  | { ok: false; reason: "tenant_not_found" | "no_default" };

/**
 * Resolve the tenantId for a public-facing request that needs to write
 * lead/quote data. Strategy:
 *   1. URL slug param (e.g. /s/[slug]/budget-request)
 *   2. tenantSlug in request body (forms outside the storefront tree)
 *   3. env.DEFAULT_TENANT_ID fallback (single-tenant marketing site)
 *
 * Never returns a "first tenant in DB" — that bug is exactly what we are
 * removing from /api/contact.
 */
export async function resolveTenantForPublicRequest(
  input: ResolveTenantInput,
): Promise<ResolveTenantResult> {
  // 1. URL slug
  if (input.slug) {
    const t = await prisma.tenant.findUnique({
      where: { slug: input.slug },
      select: { id: true },
    });
    if (t) return { ok: true, tenantId: t.id, via: "slug" };
    log.warn({ slug: input.slug }, "Tenant slug from URL not found");
    return { ok: false, reason: "tenant_not_found" };
  }

  // 2. Body slug
  if (input.tenantSlug) {
    const t = await prisma.tenant.findUnique({
      where: { slug: input.tenantSlug },
      select: { id: true },
    });
    if (t) return { ok: true, tenantId: t.id, via: "body" };
    log.warn({ tenantSlug: input.tenantSlug }, "Tenant slug from body not found");
    return { ok: false, reason: "tenant_not_found" };
  }

  // 3. Default
  if (env.DEFAULT_TENANT_ID) {
    return { ok: true, tenantId: env.DEFAULT_TENANT_ID, via: "default" };
  }

  return { ok: false, reason: "no_default" };
}
