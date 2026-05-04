import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { EMAIL_TEMPLATES } from "./email-templates";
import { PDF_TEMPLATES } from "./pdf-templates";

const log = logger.child({ module: "seed/templates" });

/**
 * Seed (or refresh) the EmailTemplate + PdfTemplate rows for one tenant.
 *
 * Idempotent — uses upsert keyed by (tenantId, templateKey). Won't
 * overwrite custom edits (`isCustom: true` rows are skipped on update).
 *
 * Returns a count of what was created vs skipped.
 */
export async function seedTemplatesForTenant(tenantId: string): Promise<{
  emailCreated: number;
  emailUpdated: number;
  emailSkipped: number;
  pdfCreated: number;
  pdfUpdated: number;
  pdfSkipped: number;
}> {
  let emailCreated = 0;
  let emailUpdated = 0;
  let emailSkipped = 0;
  let pdfCreated = 0;
  let pdfUpdated = 0;
  let pdfSkipped = 0;

  for (const t of EMAIL_TEMPLATES) {
    const existing = await prisma.emailTemplate.findUnique({
      where: { tenantId_templateKey: { tenantId, templateKey: t.templateKey } },
      select: { id: true, isCustom: true },
    });
    if (existing?.isCustom) {
      emailSkipped++;
      continue;
    }
    if (existing) {
      await prisma.emailTemplate.update({
        where: { id: existing.id },
        data: {
          name: t.name,
          description: t.description,
          category: t.category,
          recipient: t.recipient,
          subject: t.subject,
          bodyHtml: t.bodyHtml,
          variables: t.variables,
          isActive: true,
        },
      });
      emailUpdated++;
    } else {
      await prisma.emailTemplate.create({
        data: {
          tenantId,
          templateKey: t.templateKey,
          name: t.name,
          description: t.description,
          category: t.category,
          recipient: t.recipient,
          subject: t.subject,
          bodyHtml: t.bodyHtml,
          variables: t.variables,
          isCustom: false,
          isActive: true,
        },
      });
      emailCreated++;
    }
  }

  for (const t of PDF_TEMPLATES) {
    const existing = await prisma.pdfTemplate.findUnique({
      where: { tenantId_templateKey: { tenantId, templateKey: t.templateKey } },
      select: { id: true, isCustom: true },
    });
    if (existing?.isCustom) {
      pdfSkipped++;
      continue;
    }
    if (existing) {
      await prisma.pdfTemplate.update({
        where: { id: existing.id },
        data: {
          name: t.name,
          description: t.description,
          category: t.category,
          logoUrl: t.logoUrl,
          headerColor: t.headerColor,
          accentColor: t.accentColor,
          companyName: t.companyName,
          companyAddress: t.companyAddress,
          companyPhone: t.companyPhone,
          companyEmail: t.companyEmail,
          companyNif: t.companyNif,
          footerText: t.footerText,
          legalText: t.legalText,
          showLogo: t.showLogo,
          showWatermark: t.showWatermark,
          bodyHtml: t.bodyHtml,
          variables: t.variables,
          isActive: true,
        },
      });
      pdfUpdated++;
    } else {
      await prisma.pdfTemplate.create({
        data: {
          tenantId,
          templateKey: t.templateKey,
          name: t.name,
          description: t.description,
          category: t.category,
          logoUrl: t.logoUrl,
          headerColor: t.headerColor,
          accentColor: t.accentColor,
          companyName: t.companyName,
          companyAddress: t.companyAddress,
          companyPhone: t.companyPhone,
          companyEmail: t.companyEmail,
          companyNif: t.companyNif,
          footerText: t.footerText,
          legalText: t.legalText,
          showLogo: t.showLogo,
          showWatermark: t.showWatermark,
          bodyHtml: t.bodyHtml,
          variables: t.variables,
          isCustom: false,
          isActive: true,
        },
      });
      pdfCreated++;
    }
  }

  log.info(
    { tenantId, emailCreated, emailUpdated, emailSkipped, pdfCreated, pdfUpdated, pdfSkipped },
    "Templates seeded for tenant",
  );

  return { emailCreated, emailUpdated, emailSkipped, pdfCreated, pdfUpdated, pdfSkipped };
}
