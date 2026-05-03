import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import type { Prisma } from "@/generated/prisma/client";
import { logCrmActivityAsync } from "@/lib/crm/activity-log";

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
    // Detect existing lead before upsert so the activity-log entry can
    // distinguish first contact from a re-delivery. The narrow window
    // between the findUnique and the upsert is fine — upsert itself is
    // atomic at the DB level, so worst case the audit row says "created"
    // for a row that was actually updated under high concurrency.
    const existing = await prisma.lead.findUnique({
      where: {
        tenantId_ghlContactId: {
          tenantId: input.tenantId,
          ghlContactId: input.ghlContactId,
        },
      },
      select: { id: true },
    });

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
      { leadId: lead.id, tenantId: input.tenantId, source: input.source, existed: !!existing },
      "Lead upserted",
    );
    logCrmActivityAsync({
      tenantId: input.tenantId,
      entityType: "lead",
      entityId: lead.id,
      action: existing ? "updated" : "created",
      details: { source: input.source, ghlContactId: input.ghlContactId },
    });
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
  logCrmActivityAsync({
    tenantId: input.tenantId,
    entityType: "lead",
    entityId: lead.id,
    action: "created",
    details: { source: input.source },
  });
  return { lead };
}

/**
 * Link a previously-created Lead to a Quote (after the Quote row exists).
 * Updates Lead.quoteId (denormalised pointer) and Quote.leadId (FK relation).
 * Logs both a status_changed activity on the lead and a linked activity on
 * the quote so timelines on either entity reflect the conversion.
 */
export async function linkLeadToQuote(leadId: string, quoteId: string): Promise<void> {
  const lead = await prisma.lead.update({
    where: { id: leadId },
    data: { quoteId, status: "calificado", convertedAt: new Date() },
    select: { id: true, tenantId: true },
  });

  // Set Quote.leadId so the inverse relation is queryable too.
  await prisma.quote
    .update({
      where: { id: quoteId },
      data: { leadId },
    })
    .catch((err) => log.warn({ err, leadId, quoteId }, "Quote.leadId backfill failed"));

  logCrmActivityAsync({
    tenantId: lead.tenantId,
    entityType: "lead",
    entityId: lead.id,
    action: "converted",
    details: { quoteId },
  });
  logCrmActivityAsync({
    tenantId: lead.tenantId,
    entityType: "quote",
    entityId: quoteId,
    action: "linked",
    details: { leadId },
  });
}
