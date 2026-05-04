export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { requireTenant } from "@/lib/auth/guard";
import { apiError } from "@/lib/api-response";
import { generateQuoteFromLead } from "@/lib/crm/auto-quote";

/**
 * POST /api/crm/leads/[id]/auto-quote
 * Generate a draft Quote skeleton from the Lead's stored survey data.
 * Idempotent — re-calling for a lead that already has an auto-quote
 * returns the existing one.
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const [session, authError] = await requireTenant();
  if (authError) return authError;
  const { tenantId, userId, email } = session;
  const { id } = await params;

  try {
    const result = await generateQuoteFromLead({
      leadId: id,
      tenantId,
      agentId: userId,
      agentName: email ?? null,
    });

    return NextResponse.json({ ok: true, ...result }, { status: 201 });
  } catch (error) {
    return apiError(error, {
      publicMessage: "No se pudo generar el presupuesto automatico",
      code: "LEAD_AUTO_QUOTE_ERROR",
      logContext: { tenantId, leadId: id },
    });
  }
}
