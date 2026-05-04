import { EMAIL_TEMPLATES } from "@/lib/seed/templates/email-templates";
import { PDF_TEMPLATES } from "@/lib/seed/templates/pdf-templates";
import { buildFullCatalog, SEASON_CALENDAR } from "@/lib/constants/product-catalog";

const payload = {
  emailTemplates: EMAIL_TEMPLATES,
  pdfTemplates: PDF_TEMPLATES,
  products: buildFullCatalog(),
  seasonCalendar: SEASON_CALENDAR,
};

process.stdout.write(JSON.stringify(payload));
