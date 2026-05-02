export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireTenant } from "@/lib/auth/guard";
import { apiError } from "@/lib/api-response";
import { validateBody } from "@/lib/validation";
import {
  checkCrossModuleAvailability,
  type AvailabilityItem,
} from "@/lib/availability/cross-module";

const itemSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("class"),
    productId: z.string().min(1),
    qty: z.coerce.number().int().min(1),
    serviceType: z.string().optional(),
    station: z.string().optional(),
  }),
  z.object({
    type: z.literal("rental"),
    inventoryId: z.string().min(1),
    qty: z.coerce.number().int().min(1),
    station: z.string().optional(),
  }),
  z.object({
    type: z.literal("hotel"),
    roomTypeId: z.string().min(1),
    nights: z.coerce.number().int().min(1),
    units: z.coerce.number().int().min(1).optional(),
  }),
  z.object({
    type: z.literal("instructor"),
    level: z.string().optional(),
    qty: z.coerce.number().int().min(1),
    station: z.string().optional(),
    startTime: z.string().optional(),
    endTime: z.string().optional(),
  }),
]);

const requestSchema = z.object({
  date: z.string().min(1),
  items: z.array(itemSchema).min(1).max(40),
});

export async function POST(request: NextRequest) {
  const [session, authError] = await requireTenant();
  if (authError) return authError;
  const { tenantId } = session;

  try {
    const raw = await request.json();
    const parsed = validateBody(raw, requestSchema);
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const result = await checkCrossModuleAvailability(
      tenantId,
      parsed.data.date,
      parsed.data.items as AvailabilityItem[]
    );
    return NextResponse.json(result);
  } catch (error) {
    return apiError(error, {
      publicMessage: "Error al consultar disponibilidad cross-module",
      code: "CROSS_MODULE_AVAILABILITY_ERROR",
      logContext: { tenantId },
    });
  }
}
