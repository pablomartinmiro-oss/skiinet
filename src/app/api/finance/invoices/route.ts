export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { requireTenant } from "@/lib/auth/guard";
import { requireModule } from "@/lib/modules/guard";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { apiError } from "@/lib/api-response";
import { validateBody, createInvoiceSchema } from "@/lib/validation";
import { generateDocumentNumber } from "@/lib/documents/numbering";

export async function GET(request: NextRequest) {
  const [session, authError] = await requireTenant();
  if (authError) return authError;
  const { tenantId } = session;
  const modErr = await requireModule(tenantId, "finance");
  if (modErr) return modErr;

  const log = logger.child({ tenantId, path: "/api/finance/invoices" });
  const { searchParams } = request.nextUrl;
  const status = searchParams.get("status");
  const clientId = searchParams.get("clientId");

  try {
    const where: Record<string, unknown> = { tenantId };
    if (status) where.status = status;
    if (clientId) where.clientId = clientId;

    const invoices = await prisma.invoice.findMany({
      where,
      include: {
        client: { select: { id: true, name: true } },
        _count: { select: { lines: true, transactions: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    log.info({ count: invoices.length }, "Invoices fetched");
    return NextResponse.json({ invoices });
  } catch (error) {
    return apiError(error, { publicMessage: "Error al obtener facturas", code: "INVOICES_ERROR", logContext: { tenantId } });
  }
}

export async function POST(request: NextRequest) {
  const [session, authError] = await requireTenant();
  if (authError) return authError;
  const { tenantId } = session;
  const modErr = await requireModule(tenantId, "finance");
  if (modErr) return modErr;

  const log = logger.child({ tenantId, path: "/api/finance/invoices" });

  try {
    const body = await request.json();
    const validated = validateBody(body, createInvoiceSchema);
    if (!validated.ok) return NextResponse.json({ error: validated.error }, { status: 400 });
    const data = validated.data;

    // Calculate totals
    let subtotal = 0;
    let taxAmount = 0;
    const lineData = data.lines.map((line) => {
      const qty = line.quantity ?? 1;
      const tax = line.taxRate ?? 21;
      const lineTotal = qty * line.unitPrice;
      const lineTax = lineTotal * (tax / 100);
      subtotal += lineTotal;
      taxAmount += lineTax;
      return { ...line, lineTotal, tenantId };
    });
    const total = subtotal + taxAmount;

    const invoice = await prisma.$transaction(async (tx) => {
      const number = await generateDocumentNumber(tenantId, "invoice", {
        tx,
        context: "manual:create",
        generatedBy: session.userId,
      });
      const inv = await tx.invoice.create({
        data: {
          tenantId,
          number,
          clientId: data.clientId ?? null,
          reservationId: data.reservationId ?? null,
          status: data.status,
          notes: data.notes ?? null,
          subtotal,
          taxAmount,
          total,
          issuedAt: data.status === "sent" ? new Date() : null,
        },
      });

      await tx.invoiceLine.createMany({
        data: lineData.map((line) => ({
          tenantId,
          invoiceId: inv.id,
          description: line.description,
          quantity: line.quantity ?? 1,
          unitPrice: line.unitPrice,
          lineTotal: line.lineTotal,
          taxRate: line.taxRate ?? 21,
          fiscalRegime: line.fiscalRegime ?? "general",
        })),
      });

      return inv;
    });

    log.info({ invoiceId: invoice.id, number: invoice.number }, "Invoice created");
    return NextResponse.json({ invoice }, { status: 201 });
  } catch (error) {
    return apiError(error, { publicMessage: "Error al crear factura", code: "INVOICE_CREATE_ERROR", logContext: { tenantId } });
  }
}
