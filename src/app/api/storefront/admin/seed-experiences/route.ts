export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import {
  CATEGORIES,
  SKICENTER_EXPERIENCES,
} from "@/lib/seed/skicenter-storefront-experiences";

/**
 * POST /api/storefront/admin/seed-experiences?slug=skicenter
 *
 * One-shot seed: populates the storefront with ~43 ski experiences.
 * Auth: Bearer token matching AUTH_SECRET (avoids exposing tenant data and
 * allows running it from prod via curl).
 *
 * Idempotent: products are upserted by (tenantId, slug); categories by
 * (tenantId, slug). Re-running updates rather than duplicates.
 */
export async function POST(req: NextRequest) {
  const log = logger.child({ route: "storefront/admin/seed-experiences" });

  const auth = req.headers.get("authorization") ?? "";
  const token = auth.replace(/^Bearer\s+/i, "").trim();
  const expected = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET ?? "";
  if (!expected || token !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const slug = req.nextUrl.searchParams.get("slug") ?? "skicenter";

  try {
    const tenant = await prisma.tenant.findUnique({
      where: { slug },
      select: { id: true, name: true },
    });
    if (!tenant) {
      return NextResponse.json(
        { error: `Tenant '${slug}' not found` },
        { status: 404 }
      );
    }

    let categoriesUpserted = 0;
    for (const cat of CATEGORIES) {
      await prisma.category.upsert({
        where: { tenantId_slug: { tenantId: tenant.id, slug: cat.slug } },
        create: {
          tenantId: tenant.id,
          slug: cat.slug,
          name: cat.name,
          sortOrder: cat.sortOrder,
        },
        update: {
          name: cat.name,
          sortOrder: cat.sortOrder,
        },
      });
      categoriesUpserted++;
    }

    let productsUpserted = 0;
    for (const p of SKICENTER_EXPERIENCES) {
      await prisma.product.upsert({
        where: { tenantId_slug: { tenantId: tenant.id, slug: p.slug } },
        create: {
          tenantId: tenant.id,
          slug: p.slug,
          category: p.category,
          name: p.name,
          station: p.station,
          description: p.description,
          personType: p.personType ?? null,
          tier: p.tier ?? null,
          priceType: p.priceType,
          price: p.price,
          coverImageUrl: p.coverImageUrl,
          isFeatured: p.isFeatured ?? false,
          isPublished: true,
          isActive: true,
          sortOrder: p.sortOrder,
        },
        update: {
          category: p.category,
          name: p.name,
          station: p.station,
          description: p.description,
          personType: p.personType ?? null,
          tier: p.tier ?? null,
          priceType: p.priceType,
          price: p.price,
          coverImageUrl: p.coverImageUrl,
          isFeatured: p.isFeatured ?? false,
          isPublished: true,
          isActive: true,
          sortOrder: p.sortOrder,
        },
      });
      productsUpserted++;
    }

    log.info(
      { tenantId: tenant.id, categoriesUpserted, productsUpserted },
      "Storefront experiences seeded"
    );

    return NextResponse.json({
      ok: true,
      tenant: { slug, name: tenant.name },
      categoriesUpserted,
      productsUpserted,
    });
  } catch (error) {
    log.error({ err: error }, "Failed to seed storefront experiences");
    return NextResponse.json(
      { error: "Seed failed" },
      { status: 500 }
    );
  }
}
