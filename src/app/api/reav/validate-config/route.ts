export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireTenant } from "@/lib/auth/guard";
import { apiError, badRequest } from "@/lib/api-response";
import { validateBody } from "@/lib/validation";
import { validarConfiguracionREAV } from "@/lib/fiscal/reav-calculator";

const configSchema = z.object({
  vatRate: z.number(),
  pricesIncludeVat: z.boolean(),
});

/**
 * POST /api/reav/validate-config
 * Run the REAV configuration validator and return any issues found.
 * Stateless — does not touch the DB.
 */
export async function POST(request: NextRequest) {
  const [, authError] = await requireTenant();
  if (authError) return authError;

  try {
    const body = await request.json();
    const validated = validateBody(body, configSchema);
    if (!validated.ok) return badRequest(validated.error);

    const result = validarConfiguracionREAV(validated.data);
    return NextResponse.json(result);
  } catch (error) {
    return apiError(error, {
      publicMessage: "Error al validar la configuracion REAV",
      code: "REAV_VALIDATE_ERROR",
    });
  }
}
