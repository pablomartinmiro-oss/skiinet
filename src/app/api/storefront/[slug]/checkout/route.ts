export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { apiError } from "@/lib/api-response";
import { lookupTenant } from "@/lib/storefront/tenant-lookup";
import { validateBody, checkoutSchema } from "@/lib/validation";
import { getCart, deleteCart } from "@/lib/storefront/cart";
import { generateRedsysForm, generateOrderId } from "@/lib/redsys/client";
import { generateDocumentNumber } from "@/lib/documents/numbering";
import type { Prisma } from "@/generated/prisma/client";

type RouteCtx = { params: Promise<{ slug: string }> };

const BASE_URL = process.env.AUTH_URL ?? "https://crm-dash-prod.up.railway.app";

/**
 * POST — convert cart to a Quote with QuoteItems + generate Redsys payment.
 * Body: { cartId, clientName, clientEmail, clientPhone? }
 */
export async function POST(request: NextRequest, ctx: RouteCtx) {
  const { slug } = await ctx.params;
  const tenant = await lookupTenant(slug);
  if (!tenant) {
    return NextResponse.json(
      { error: "Tienda no encontrada" },
      { status: 404 }
    );
  }

  const log = logger.child({
    tenantId: tenant.id,
    path: `/api/storefront/${slug}/checkout`,
  });

  try {
    const body = await request.json();
    const validated = validateBody(body, checkoutSchema);
    if (!validated.ok) {
      return NextResponse.json(
        { error: validated.error },
        { status: 400 }
      );
    }
    const data = validated.data;

    const cart = await getCart(data.cartId);
    if (!cart || cart.tenantId !== tenant.id) {
      return NextResponse.json(
        { error: "Carrito no encontrado" },
        { status: 404 }
      );
    }

    if (cart.items.length === 0) {
      return NextResponse.json(
        { error: "El carrito esta vacio" },
        { status: 400 }
      );
    }

    // Build QuoteItems from cart
    const quoteItems: Prisma.QuoteItemCreateWithoutQuoteInput[] =
      cart.items.map((item) => ({
        productId: item.productId || null,
        name: item.productName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
        category: item.variant ?? null,
        startDate: item.date ? new Date(item.date) : null,
      }));

    // Determine dates from items (earliest/latest)
    const itemDates = cart.items
      .map((i) => i.date)
      .filter(Boolean)
      .map((d) => new Date(d!))
      .sort((a, b) => a.getTime() - b.getTime());
    const checkIn = itemDates[0] ?? new Date();
    const checkOut = itemDates[itemDates.length - 1] ?? new Date();

    // Generate Redsys payment if configured
    const orderId = generateOrderId();
    let redsysResult: {
      url: string;
      params: {
        Ds_SignatureVersion: string;
        Ds_MerchantParameters: string;
        Ds_Signature: string;
      };
    } | null = null;

    try {
      const quoteRef = orderId.slice(0, 8).toUpperCase();
      redsysResult = generateRedsysForm({
        orderId,
        amount: cart.total,
        description: `Pedido ${quoteRef} — ${tenant.name}`,
        merchantUrl: `${BASE_URL}/api/crm/webhooks/redsys`,
        urlOk: `${BASE_URL}/s/${slug}/checkout?status=ok&order=${orderId}`,
        urlKo: `${BASE_URL}/s/${slug}/checkout?status=error&order=${orderId}`,
      });
    } catch (redsysError) {
      log.info(
        { error: redsysError },
        "Redsys not configured — proceeding with manual payment"
      );
    }

    const number = await generateDocumentNumber(tenant.id, "quote", {
      context: "storefront_checkout",
    });

    const quote = await prisma.quote.create({
      data: {
        tenantId: tenant.id,
        number,
        clientName: data.clientName,
        clientEmail: data.clientEmail,
        clientPhone: data.clientPhone ?? null,
        destination: "online",
        checkIn,
        checkOut,
        adults: 1,
        children: 0,
        status: redsysResult ? "pendiente_pago" : "nuevo",
        totalAmount: cart.total,
        source: "storefront",
        redsysOrderId: redsysResult ? orderId : null,
        redsysPaymentUrl: redsysResult ? redsysResult.url : null,
        paymentStatus: "pending",
        internalNotes: cart.discountCode
          ? `Codigo descuento: ${cart.discountCode} (-${cart.discountAmount?.toFixed(2)} EUR)`
          : null,
        items: { create: quoteItems },
      },
      include: { items: true },
    });

    // If discount code was used, increment usedCount + record use
    if (cart.discountCode) {
      const dc = await prisma.discountCode.findUnique({
        where: {
          tenantId_code: {
            tenantId: tenant.id,
            code: cart.discountCode,
          },
        },
        select: { id: true },
      });

      if (dc) {
        await prisma.$transaction([
          prisma.discountCode.updateMany({
            where: { tenantId: tenant.id, code: cart.discountCode },
            data: { usedCount: { increment: 1 } },
          }),
          prisma.discountCodeUse.create({
            data: {
              tenantId: tenant.id,
              codeId: dc.id,
              originalAmount: cart.subtotal,
              finalAmount: cart.total,
              discountAmount: cart.discountAmount ?? 0,
              channel: "online",
            },
          }),
        ]);
      }
    }

    // Clear the cart
    await deleteCart(cart.id);

    log.info(
      {
        quoteId: quote.id,
        total: quote.totalAmount,
        redsys: !!redsysResult,
      },
      "Checkout completed — quote created from cart"
    );

    // Build response with Redsys form data if available
    const quoteNumber = quote.id.slice(-8).toUpperCase();

    return NextResponse.json(
      {
        quoteId: quote.id,
        quoteNumber,
        total: quote.totalAmount,
        status: quote.status,
        paymentMode: redsysResult ? "redsys" : "manual",
        redsys: redsysResult
          ? {
              url: redsysResult.url,
              Ds_SignatureVersion: redsysResult.params.Ds_SignatureVersion,
              Ds_MerchantParameters: redsysResult.params.Ds_MerchantParameters,
              Ds_Signature: redsysResult.params.Ds_Signature,
            }
          : null,
      },
      { status: 201 }
    );
  } catch (error) {
    return apiError(error, {
      publicMessage: "Error al procesar el pedido",
      code: "STOREFRONT_CHECKOUT_ERROR",
      logContext: { tenantId: tenant.id },
    });
  }
}
