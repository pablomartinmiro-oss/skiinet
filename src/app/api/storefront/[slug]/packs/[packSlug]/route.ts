export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { apiError } from "@/lib/api-response";
import { lookupTenant } from "@/lib/storefront/tenant-lookup";

type RouteCtx = { params: Promise<{ slug: string; packSlug: string }> };

/**
 * GET /api/storefront/[slug]/packs/[packSlug]
 * PUBLIC — fetch a single Lego pack by slug, with its lines + product info.
 * Returns 404 if inactive.
 */
export async function GET(_request: NextRequest, ctx: RouteCtx) {
  const { slug, packSlug } = await ctx.params;

  const tenant = await lookupTenant(slug);
  if (!tenant) {
    return NextResponse.json({ error: "Tienda no encontrada" }, { status: 404 });
  }

  try {
    const pack = await prisma.legoPack.findFirst({
      where: {
        slug: packSlug,
        tenantId: tenant.id,
        isActive: true,
      },
      include: {
        lines: {
          orderBy: { sortOrder: "asc" },
        },
      },
    });
    if (!pack) {
      return NextResponse.json({ error: "Pack no encontrado" }, { status: 404 });
    }

    // Hydrate product names for client-visible lines that aren't overridden.
    const productIds = pack.lines
      .filter((l) => l.productId)
      .map((l) => l.productId as string);
    const products = productIds.length
      ? await prisma.product.findMany({
          where: { id: { in: productIds } },
          select: { id: true, name: true, description: true, price: true, category: true },
        })
      : [];
    const productMap = new Map(products.map((p) => [p.id, p]));

    const enrichedLines = pack.lines.map((l) => {
      const product = l.productId ? productMap.get(l.productId) : null;
      return {
        id: l.id,
        productId: l.productId,
        productName: product?.name ?? null,
        productCategory: product?.category ?? null,
        productDescription: product?.description ?? null,
        quantity: l.quantity,
        isRequired: l.isRequired,
        isOptional: l.isOptional,
        isClientEditable: l.isClientEditable,
        unitPrice: l.overridePrice ?? product?.price ?? 0,
        sortOrder: l.sortOrder,
      };
    });

    return NextResponse.json({
      pack: {
        id: pack.id,
        title: pack.title,
        slug: pack.slug,
        description: pack.description,
        price: pack.price,
        images: pack.images,
        lines: enrichedLines,
      },
    });
  } catch (error) {
    return apiError(error, {
      publicMessage: "Error al cargar el pack",
      code: "STOREFRONT_PACK_BY_SLUG_ERROR",
    });
  }
}
