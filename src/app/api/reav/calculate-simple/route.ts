export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireTenant } from "@/lib/auth/guard";
import { apiError, badRequest } from "@/lib/api-response";
import { validateBody } from "@/lib/validation";
import {
  calcularREAV,
  calcularREAVSimple,
  validarConfiguracionREAV,
} from "@/lib/fiscal/reav-calculator";

const lineSchema = z.object({
  saleAmount: z.number().min(0),
  providerCost: z.number().min(0),
});

const calculateSchema = z.union([
  // Single-shot mode
  z.object({
    mode: z.literal("simple"),
    saleAmount: z.number().min(0),
    costPercent: z.number().min(0).max(1),
    vatRate: z.number().min(0).max(1),
  }),
  // Lines mode
  z.object({
    mode: z.literal("lines"),
    config: z.object({
      vatRate: z.number().min(0).max(1),
      pricesIncludeVat: z.boolean(),
    }),
    lines: z.array(lineSchema).min(1).max(500),
  }),
]);

/**
 * POST /api/reav/calculate-simple
 * Stateless REAV calculation — no DB writes.
 * Body shape:
 *   { mode: "simple", saleAmount, costPercent, vatRate }
 *  or
 *   { mode: "lines", config: { vatRate, pricesIncludeVat }, lines: [...] }
 */
export async function POST(request: NextRequest) {
  const [, authError] = await requireTenant();
  if (authError) return authError;

  try {
    const body = await request.json();
    const validated = validateBody(body, calculateSchema);
    if (!validated.ok) return badRequest(validated.error);
    const data = validated.data;

    if (data.mode === "simple") {
      const result = calcularREAVSimple({
        saleAmount: data.saleAmount,
        costPercent: data.costPercent,
        vatRate: data.vatRate,
      });
      return NextResponse.json({ mode: "simple", result });
    }

    // Lines mode — validate config first to surface operator mistakes.
    const validation = validarConfiguracionREAV(data.config);
    if (!validation.valid) {
      return NextResponse.json(
        { error: "Configuracion REAV invalida", issues: validation.issues },
        { status: 400 },
      );
    }
    const result = calcularREAV({ config: data.config, lines: data.lines });
    return NextResponse.json({ mode: "lines", result });
  } catch (error) {
    return apiError(error, {
      publicMessage: "Error al calcular REAV",
      code: "REAV_CALC_ERROR",
    });
  }
}
