export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { requireTenant } from "@/lib/auth/guard";
import { requireModule } from "@/lib/modules/guard";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { apiError } from "@/lib/api-response";
import { z } from "zod";
import type { Lead } from "@/generated/prisma/client";

const scoreBodySchema = z.object({
  leadId: z.string().min(1),
});

/**
 * Rule-based scoring (0-100):
 *  - Has email: +20
 *  - Has phone: +15
 *  - Has company: +10
 *  - Has notes (>20 chars): +10
 *  - Source weighting: storefront +20, web +15, referral +25, manual +10, import +5
 *  - Status weighting: contactado +5, calificado +15, convertido +30, perdido -20
 *  - Has tags: +5
 *  - Recently contacted (< 7d): +5
 */
function calculateScore(lead: Lead): number {
  let score = 0;
  if (lead.email) score += 20;
  if (lead.phone) score += 15;
  if (lead.company) score += 10;
  if (lead.notes && lead.notes.trim().length > 20) score += 10;

  const sourceWeights: Record<string, number> = {
    storefront: 20,
    web: 15,
    referral: 25,
    manual: 10,
    import: 5,
  };
  score += sourceWeights[lead.source] ?? 0;

  const statusWeights: Record<string, number> = {
    nuevo: 0,
    contactado: 5,
    calificado: 15,
    convertido: 30,
    perdido: -20,
  };
  score += statusWeights[lead.status] ?? 0;

  if (lead.tags && lead.tags.length > 0) score += 5;
  if (lead.lastContactedAt) {
    const daysSince = (Date.now() - lead.lastContactedAt.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSince < 7) score += 5;
  }

  return Math.max(0, Math.min(100, score));
}

export async function POST(request: NextRequest) {
  const [session, authError] = await requireTenant();
  if (authError) return authError;
  const modError = await requireModule(session.tenantId, "leads");
  if (modError) return modError;

  const { tenantId } = session;
  const log = logger.child({ tenantId, path: "/api/leads/score" });

  try {
    const body = await request.json();
    const parsed = scoreBodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid body" }, { status: 400 });
    }

    const lead = await prisma.lead.findFirst({
      where: { id: parsed.data.leadId, tenantId },
    });
    if (!lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    const score = calculateScore(lead);
    const updated = await prisma.lead.update({
      where: { id: lead.id },
      data: { score },
    });

    log.info({ leadId: lead.id, score }, "Lead score recalculated");
    return NextResponse.json({ lead: updated, score });
  } catch (error) {
    return apiError(error, {
      publicMessage: "Failed to score lead",
      code: "LEAD_SCORE_ERROR",
      logContext: { tenantId },
    });
  }
}
