export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireTenant } from "@/lib/auth/guard";
import { apiError, badRequest } from "@/lib/api-response";
import { validateBody } from "@/lib/validation";

const splitSchema = z.object({
  totalAmount: z.number().min(0),
  payments: z.object({
    cash:     z.number().min(0).default(0),
    card:     z.number().min(0).default(0),
    bizum:    z.number().min(0).default(0),
    transfer: z.number().min(0).default(0),
  }),
});

/**
 * POST /api/tpv/sales/split-payment
 *
 * Stateless validator for split-payment payloads. Returns:
 *   - valid: true if sum of methods == totalAmount (within €0.01)
 *   - delta: rounding/missing change
 *   - share: percentage breakdown of each method
 *
 * Used by the TPV front-end to live-validate a split before confirming
 * the sale via POST /api/tpv/sales.
 */
export async function POST(request: NextRequest) {
  const [, authError] = await requireTenant();
  if (authError) return authError;

  try {
    const body = await request.json();
    const validated = validateBody(body, splitSchema);
    if (!validated.ok) return badRequest(validated.error);
    const { totalAmount } = validated.data;
    // Coalesce defaults locally — Zod's inferred type leaves these as
    // optional even with `.default(0)` due to strictNullChecks behaviour.
    const cash     = validated.data.payments.cash     ?? 0;
    const card     = validated.data.payments.card     ?? 0;
    const bizum    = validated.data.payments.bizum    ?? 0;
    const transfer = validated.data.payments.transfer ?? 0;

    const sumCents = Math.round((cash + card + bizum + transfer) * 100);
    const totalCents = Math.round(totalAmount * 100);
    const deltaCents = sumCents - totalCents;
    const valid = Math.abs(deltaCents) <= 1; // ±1 cent rounding tolerance

    const share =
      sumCents > 0
        ? {
            cash:     Math.round((cash * 100) / sumCents * 1000) / 10,
            card:     Math.round((card * 100) / sumCents * 1000) / 10,
            bizum:    Math.round((bizum * 100) / sumCents * 1000) / 10,
            transfer: Math.round((transfer * 100) / sumCents * 1000) / 10,
          }
        : { cash: 0, card: 0, bizum: 0, transfer: 0 };

    return NextResponse.json({
      valid,
      totalAmount,
      sum: sumCents / 100,
      delta: deltaCents / 100,
      share,
      payments: { cash, card, bizum, transfer },
    });
  } catch (error) {
    return apiError(error, {
      publicMessage: "Error al validar el pago dividido",
      code: "TPV_SPLIT_VALIDATE_ERROR",
    });
  }
}
