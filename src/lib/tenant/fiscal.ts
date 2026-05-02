import { prisma } from "@/lib/db";

export interface TenantFiscalData {
  companyName: string;
  companyNif: string | null;
  companyAddress: string | null;
  companyPhone: string | null;
  companyEmail: string | null;
  logoUrl: string | null;
  headerColor: string;
  accentColor: string;
  footerText: string | null;
  legalText: string | null;
}

const FALLBACK_PHONE = "639 576 627";
const FALLBACK_EMAIL = "reservas@skicenter.es";

export async function getTenantFiscalData(
  tenantId: string,
  templateKey: "quote" | "invoice"
): Promise<TenantFiscalData> {
  const [tenant, template] = await Promise.all([
    prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { name: true },
    }),
    prisma.pdfTemplate.findUnique({
      where: { tenantId_templateKey: { tenantId, templateKey } },
      select: {
        logoUrl: true,
        headerColor: true,
        accentColor: true,
        companyName: true,
        companyNif: true,
        companyAddress: true,
        companyPhone: true,
        companyEmail: true,
        footerText: true,
        legalText: true,
      },
    }),
  ]);

  return {
    companyName: template?.companyName ?? tenant?.name ?? "Skicenter",
    companyNif: template?.companyNif ?? null,
    companyAddress: template?.companyAddress ?? null,
    companyPhone: template?.companyPhone ?? FALLBACK_PHONE,
    companyEmail: template?.companyEmail ?? FALLBACK_EMAIL,
    logoUrl: template?.logoUrl ?? null,
    headerColor: template?.headerColor ?? "#1a4a4a",
    accentColor: template?.accentColor ?? "#E87B5A",
    footerText: template?.footerText ?? null,
    legalText: template?.legalText ?? null,
  };
}
