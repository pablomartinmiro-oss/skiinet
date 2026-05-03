export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { apiError } from "@/lib/api-response";
import { lookupTenant } from "@/lib/storefront/tenant-lookup";

type RouteCtx = { params: Promise<{ slug: string; productSlug: string }> };

/**
 * GET /api/storefront/[slug]/products/[productSlug]
 * PUBLIC — fetch a single published product by its url slug.
 * Returns 404 if the product is unpublished or inactive.
 */
export async function GET(_request: NextRequest, ctx: RouteCtx) {
  const { slug, productSlug } = await ctx.params;

  const tenant = await lookupTenant(slug);
  if (!tenant) {
    return NextResponse.json({ error: "Tienda no encontrada" }, { status: 404 });
  }

  try {
    const product = await prisma.product.findFirst({
      where: {
        slug: productSlug,
        isActive: true,
        isPublished: true,
        OR: [{ tenantId: tenant.id }, { tenantId: null }],
      },
      select: {
        id: true,
        slug: true,
        name: true,
        description: true,
        category: true,
        station: true,
        personType: true,
        tier: true,
        includesHelmet: true,
        priceType: true,
        pricingMatrix: true,
        productType: true,
        coverImageUrl: true,
        images: true,
        includes: true,
        excludes: true,
        difficulty: true,
        metaTitle: true,
        metaDescription: true,
        isFeatured: true,
        discountPercent: true,
        discountExpiresAt: true,
      },
    });

    if (!product) {
      return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });
    }

    return NextResponse.json({ product });
  } catch (error) {
    return apiError(error, {
      publicMessage: "Error al cargar el producto",
      code: "STOREFRONT_PRODUCT_BY_SLUG_ERROR",
    });
  }
}
