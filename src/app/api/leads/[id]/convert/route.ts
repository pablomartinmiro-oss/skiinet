export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { requireTenant } from "@/lib/auth/guard";
import { requireModule } from "@/lib/modules/guard";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { apiError } from "@/lib/api-response";
import { validateBody, convertLeadSchema } from "@/lib/validation";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const [session, authError] = await requireTenant();
  if (authError) return authError;
  const modError = await requireModule(session.tenantId, "leads");
  if (modError) return modError;

  const { tenantId } = session;
  const { id } = await params;
  const log = logger.child({ tenantId, path: `/api/leads/${id}/convert` });

  try {
    const lead = await prisma.lead.findFirst({ where: { id, tenantId } });
    if (!lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }
    if (lead.status === "convertido" && lead.quoteId) {
      return NextResponse.json({ error: "Lead ya convertido" }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));
    const validated = validateBody(body, convertLeadSchema);
    if (!validated.ok) {
      return NextResponse.json({ error: validated.error }, { status: 400 });
    }
    const data = validated.data;

    const checkIn = data.checkIn ?? new Date();
    const checkOut = data.checkOut ?? new Date(checkIn.getTime() + 24 * 60 * 60 * 1000);

    const result = await prisma.$transaction(async (tx) => {
      const quote = await tx.quote.create({
        data: {
          tenantId,
          clientName: lead.name,
          clientEmail: lead.email,
          clientPhone: lead.phone,
          clientNotes: data.notes ?? lead.notes,
          destination: data.destination ?? "Pendiente",
          checkIn,
          checkOut,
          adults: data.adults,
          children: data.children,
          status: "borrador",
          source: `lead:${lead.id}`,
          totalAmount: 0,
        },
      });

      const updated = await tx.lead.update({
        where: { id: lead.id },
        data: {
          status: "convertido",
          pipelineStage: "convertido",
          convertedAt: new Date(),
          quoteId: quote.id,
        },
      });

      return { quote, lead: updated };
    });

    log.info({ leadId: id, quoteId: result.quote.id }, "Lead converted to quote");
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return apiError(error, {
      publicMessage: "Failed to convert lead",
      code: "LEAD_CONVERT_ERROR",
      logContext: { tenantId, leadId: id },
    });
  }
}
