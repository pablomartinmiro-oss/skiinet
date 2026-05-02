export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { requireTenant } from "@/lib/auth/guard";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { apiError } from "@/lib/api-response";
import { validateBody, quoteItemSchema, bulkReplaceQuoteItemsSchema } from "@/lib/validation";
import type { Prisma } from "@/generated/prisma/client";
import { categoryToModule } from "@/lib/quotes/category-to-module";
import {
  checkCrossModuleAvailability,
  type AvailabilityItem,
} from "@/lib/availability/cross-module";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const [session, authError] = await requireTenant();
  if (authError) return authError;

  const { tenantId } = session;
  const { id: quoteId } = await params;
  const log = logger.child({ tenantId, path: `/api/quotes/${quoteId}/items` });

  try {
    const quote = await prisma.quote.findFirst({
      where: { id: quoteId, tenantId },
    });
    if (!quote) {
      return NextResponse.json({ error: "Quote not found" }, { status: 404 });
    }

    const body = await request.json();
    const validated = validateBody(body, quoteItemSchema);
    if (!validated.ok) {
      return NextResponse.json({ error: validated.error }, { status: 400 });
    }
    const data = validated.data;

    const unitPrice = data.unitPrice;
    const quantity = data.quantity;
    const discount = parseFloat(body.discount) || 0;
    const totalPrice = unitPrice * quantity * (1 - discount / 100);

    const item = await prisma.quoteItem.create({
      data: {
        quoteId,
        productId: data.productId || null,
        name: body.name,
        description: data.description || null,
        category: body.category || null,
        moduleType: categoryToModule({
          category: body.category,
          alojamientoNombre: body.alojamientoNombre,
          regimen: body.regimen,
        }),
        quantity,
        unitPrice,
        discount,
        totalPrice,
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: body.endDate ? new Date(body.endDate) : null,
        numDays: data.numDays ?? null,
        numPersons: data.numPersons ?? null,
        modalidad: body.modalidad || null,
        nivel: body.nivel || null,
        sector: body.sector || null,
        idioma: body.idioma || null,
        horario: body.horario || null,
        tipoCliente: body.tipoCliente || null,
        gama: body.gama || null,
        casco: body.casco ?? null,
        tipoActividad: body.tipoActividad || null,
        seguroIncluido: body.seguroIncluido ?? null,
        notes: body.notes || null,
      },
    });

    // Recalculate quote total
    const items = await prisma.quoteItem.findMany({ where: { quoteId } });
    const totalAmount = items.reduce((sum, i) => sum + i.totalPrice, 0);
    await prisma.quote.update({
      where: { id: quoteId },
      data: { totalAmount },
    });

    log.info({ quoteId, itemId: item.id }, "Quote item added");
    return NextResponse.json({ item, totalAmount }, { status: 201 });
  } catch (error) {
    return apiError(error, {
      publicMessage: "Failed to add item",
      code: "QUOTE_ITEM_ADD_ERROR",
      logContext: { tenantId, quoteId },
    });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const [session, authError] = await requireTenant();
  if (authError) return authError;

  const { tenantId } = session;
  const { id: quoteId } = await params;
  const log = logger.child({ tenantId, path: `/api/quotes/${quoteId}/items` });

  try {
    const quote = await prisma.quote.findFirst({
      where: { id: quoteId, tenantId },
    });
    if (!quote) {
      return NextResponse.json({ error: "Quote not found" }, { status: 404 });
    }

    const body = await request.json();
    const validated = validateBody(body, bulkReplaceQuoteItemsSchema);
    if (!validated.ok) {
      return NextResponse.json({ error: validated.error }, { status: 400 });
    }

    // Bulk replace all items
    await prisma.quoteItem.deleteMany({ where: { quoteId } });

    const items = [];
    let totalAmount = 0;
    for (const itemData of validated.data.items) {
      const unitPrice = itemData.unitPrice;
      const quantity = itemData.quantity ?? 1;
      const discount = itemData.discount ?? 0;
      const totalPrice = unitPrice * quantity * (1 - discount / 100);
      totalAmount += totalPrice;

      const item = await prisma.quoteItem.create({
        data: {
          quoteId,
          productId: itemData.productId ?? null,
          name: itemData.name,
          description: itemData.description ?? null,
          category: itemData.category ?? null,
          moduleType: categoryToModule({
            category: itemData.category,
            alojamientoNombre: itemData.alojamientoNombre,
            regimen: itemData.regimen,
          }),
          quantity,
          unitPrice,
          discount,
          totalPrice,
          // Per-product variables
          startDate: itemData.startDate ?? null,
          endDate: itemData.endDate ?? null,
          numDays: itemData.numDays ?? null,
          numPersons: itemData.numPersons ?? null,
          ageDetails: itemData.ageDetails != null
            ? JSON.parse(JSON.stringify(itemData.ageDetails)) as Prisma.InputJsonValue
            : undefined,
          modalidad: itemData.modalidad ?? null,
          nivel: itemData.nivel ?? null,
          sector: itemData.sector ?? null,
          idioma: itemData.idioma ?? null,
          horario: itemData.horario ?? null,
          puntoEncuentro: itemData.puntoEncuentro ?? null,
          tipoCliente: itemData.tipoCliente ?? null,
          gama: itemData.gama ?? null,
          casco: itemData.casco ?? null,
          tipoActividad: itemData.tipoActividad ?? null,
          regimen: itemData.regimen ?? null,
          alojamientoNombre: itemData.alojamientoNombre ?? null,
          seguroIncluido: itemData.seguroIncluido ?? null,
          notes: itemData.notes ?? null,
        },
      });
      items.push(item);
    }

    await prisma.quote.update({
      where: { id: quoteId },
      data: { totalAmount },
    });

    log.info({ quoteId, itemCount: items.length }, "Quote items replaced");

    // Advisory cross-module availability snapshot for UI banners (non-blocking)
    let availability: Awaited<ReturnType<typeof checkCrossModuleAvailability>> | null = null;
    try {
      const checkItems = items
        .filter((it) => it.productId && it.startDate)
        .map<AvailabilityItem | null>((it) => {
          if (it.moduleType === "rental" && it.productId) {
            return null; // Need RentalInventory id, not Product id — skip until UI passes it
          }
          if (it.moduleType === "instructor" && it.productId) {
            return { type: "class", productId: it.productId, qty: it.numPersons ?? it.quantity };
          }
          return null;
        })
        .filter((x): x is AvailabilityItem => x !== null);
      if (checkItems.length > 0) {
        availability = await checkCrossModuleAvailability(
          tenantId,
          quote.checkIn,
          checkItems
        );
      }
    } catch (err) {
      log.warn({ err }, "Availability snapshot failed (non-blocking)");
    }

    return NextResponse.json({ items, totalAmount, availability });
  } catch (error) {
    return apiError(error, {
      publicMessage: "Failed to update items",
      code: "QUOTE_ITEMS_UPDATE_ERROR",
      logContext: { tenantId, quoteId },
    });
  }
}
