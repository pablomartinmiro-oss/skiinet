import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import type { Prisma } from "@/generated/prisma/client";

const log = logger.child({ module: "leads/intake" });

/**
 * Public-facing lead source values. Kept loose (string in schema) but
 * enumerated here so callers stay consistent.
 */
export type LeadSource =
  | "contact_form" // /api/contact (marketing site)
  | "storefront_budget" // /api/storefront/public/[slug]/budget-request
  | "ghl_survey" // GHL form/survey webhook -> auto-quote
  | "ghl_webhook" // GHL ContactCreate webhook (no survey data)
  | "manual" // admin POST /api/leads
  | "import" // CSV bulk import
  | "storefront" // legacy storefront cart checkout
  | "web"
  | "referral";

export type LeadIntakeInput = {
  tenantId: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  company?: string | null;
  source: LeadSource;
  notes?: string | null;
  tags?: string[];
  customFields?: Prisma.InputJsonValue;
  /** GHL Contact ID — used as idempotency key when present. */
  ghlContactId?: string | null;
  /** Optional Quote ID, set when this lead was generated alongside a quote. */
  quoteId?: string | null;
};

/**
 * Create or upsert a Lead. When `ghlContactId` is present we upsert by
 * (tenantId, ghlContactId) to make webhook re-deliveries idempotent
 * (atomic at the DB level — survives concurrent calls).
 */
export async function intakeLead(
  input: LeadIntakeInput,
): Promise<{ lead: { id: string } }> {
  const baseData = {
    tenantId: input.tenantId,
    name: input.name.trim(),
    email: input.email?.trim().toLowerCase() || null,
    phone: input.phone?.trim() || null,
    company: input.company?.trim() || null,
    source: input.source,
    notes: input.notes ?? null,
    tags: input.tags ?? [],
    quoteId: input.quoteId ?? null,
    ghlContactId: input.ghlContactId ?? null,
  };

  const createData = input.customFields
    ? { ...baseData, customFields: input.customFields }
    : baseData;

  if (input.ghlContactId) {
    // Atomic upsert by composite unique (tenantId, ghlContactId).
    // On re-delivery, refresh contact fields and lastContactedAt but never
    // downgrade status/score (admin may have qualified/rejected the lead).
    const lead = await prisma.lead.upsert({
      where: {
        tenantId_ghlContactId: {
          tenantId: input.tenantId,
          ghlContactId: input.ghlContactId,
        },
      },
      create: createData,
      update: {
        name: baseData.name,
        ...(baseData.email !== null ? { email: baseData.email } : {}),
        ...(baseData.phone !== null ? { phone: baseData.phone } : {}),
        ...(baseData.company !== null ? { company: baseData.company } : {}),
        ...(baseData.notes !== null ? { notes: baseData.notes } : {}),
        ...(baseData.quoteId !== null ? { quoteId: baseData.quoteId } : {}),
        lastContactedAt: new Date(),
      },
      select: { id: true },
    });
    log.info(
      { leadId: lead.id, tenantId: input.tenantId, source: input.source },
      "Lead upserted",
    );
    return { lead };
  }

  const lead = await prisma.lead.create({
    data: createData,
    select: { id: true },
  });
  log.info(
    { leadId: lead.id, tenantId: input.tenantId, source: input.source },
    "Lead created",
  );
  return { lead };
}

/**
 * Link a previously-created Lead to a Quote (after the Quote row exists).
 */
export async function linkLeadToQuote(leadId: string, quoteId: string): Promise<void> {
  await prisma.lead.update({
    where: { id: leadId },
    data: { quoteId, status: "calificado", convertedAt: new Date() },
  });
}
