export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { requireTenant } from "@/lib/auth/guard";
import { requireModule } from "@/lib/modules/guard";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { apiError } from "@/lib/api-response";
import { getTenantFiscalData } from "@/lib/tenant/fiscal";

function formatEUR(n: number): string {
  return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(n);
}

function formatDate(d: Date | string | null | undefined): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function escapeHtml(value: string | null | undefined): string {
  if (!value) return "";
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const STATUS_LABELS: Record<string, string> = {
  draft: "Borrador",
  sent: "Enviada",
  paid: "Pagada",
  cancelled: "Anulada",
};

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const [session, authError] = await requireTenant();
  if (authError) return authError;
  const { id } = await params;
  const { tenantId } = session;
  const modErr = await requireModule(tenantId, "finance");
  if (modErr) return modErr;

  const log = logger.child({ tenantId, path: `/api/finance/invoices/${id}/pdf` });

  try {
    const invoice = await prisma.invoice.findFirst({
      where: { id, tenantId },
      include: {
        client: { select: { name: true, email: true, phone: true, address: true } },
        lines: { orderBy: { createdAt: "asc" } },
        transactions: { orderBy: { date: "asc" }, take: 1 },
      },
    });

    if (!invoice) {
      return NextResponse.json({ error: "Factura no encontrada" }, { status: 404 });
    }

    const fiscal = await getTenantFiscalData(tenantId, "invoice");

    // Group IVA breakdown by tax rate (Spanish fiscal requirement)
    const taxByRate: Record<number, { base: number; tax: number }> = {};
    for (const line of invoice.lines) {
      const rate = line.taxRate;
      const base = line.lineTotal;
      const tax = Math.round(base * (rate / 100) * 100) / 100;
      if (!taxByRate[rate]) taxByRate[rate] = { base: 0, tax: 0 };
      taxByRate[rate].base += base;
      taxByRate[rate].tax += tax;
    }

    const lineRows = invoice.lines
      .map(
        (line) => `
      <tr>
        <td>${escapeHtml(line.description)}</td>
        <td class="num">${line.quantity}</td>
        <td class="num">${formatEUR(line.unitPrice)}</td>
        <td class="num">${line.taxRate}%</td>
        <td class="num">${formatEUR(line.lineTotal)}</td>
      </tr>`
      )
      .join("");

    const taxBreakdown = Object.entries(taxByRate)
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(
        ([rate, { base, tax }]) => `
        <tr>
          <td>Base imponible al ${rate}%</td>
          <td class="num">${formatEUR(base)}</td>
        </tr>
        <tr>
          <td>IVA ${rate}%</td>
          <td class="num">${formatEUR(tax)}</td>
        </tr>`
      )
      .join("");

    const clientName = invoice.client?.name ?? "Cliente";
    const clientLines = [
      escapeHtml(clientName),
      invoice.client?.email ? escapeHtml(invoice.client.email) : "",
      invoice.client?.phone ? escapeHtml(invoice.client.phone) : "",
      invoice.client?.address ? escapeHtml(invoice.client.address) : "",
    ]
      .filter(Boolean)
      .join("<br/>");

    const statusLabel = STATUS_LABELS[invoice.status] ?? invoice.status;
    const accent = fiscal.accentColor;
    const header = fiscal.headerColor;
    const logoBlock = fiscal.logoUrl
      ? `<img src="${escapeHtml(fiscal.logoUrl)}" alt="${escapeHtml(fiscal.companyName)}" style="max-height:50px;display:block;" />`
      : `<div class="brand">${escapeHtml(fiscal.companyName.toUpperCase())}</div>`;

    const issuerLines = [
      escapeHtml(fiscal.companyName),
      fiscal.companyNif ? `NIF: ${escapeHtml(fiscal.companyNif)}` : "",
      fiscal.companyAddress ? escapeHtml(fiscal.companyAddress) : "",
      [fiscal.companyPhone, fiscal.companyEmail].filter(Boolean).join(" · "),
    ]
      .filter(Boolean)
      .join("<br/>");

    const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(invoice.number)} — ${escapeHtml(fiscal.companyName)}</title>
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; padding: 24px; background: #FAF9F7; color: #2D2A26; font-family: 'DM Sans', Arial, sans-serif; font-size: 13px; line-height: 1.6; }
    .doc { max-width: 820px; margin: 0 auto; background: #FFFFFF; padding: 40px 48px; box-shadow: 0 1px 4px rgba(0,0,0,0.05); }
    .header { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 16px; border-bottom: 2px solid ${header}; margin-bottom: 24px; }
    .brand { font-size: 22px; font-weight: 700; letter-spacing: 1px; color: ${header}; }
    .meta { text-align: right; font-size: 12px; color: #8A8580; }
    .meta .invoice-number { font-size: 18px; color: #2D2A26; font-weight: 700; letter-spacing: 1px; }
    .badge { display: inline-block; padding: 3px 10px; border-radius: 6px; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600; background: ${accent}1A; color: ${accent}; margin-top: 6px; }
    h2 { font-size: 14px; text-transform: uppercase; letter-spacing: 1px; color: ${header}; margin: 24px 0 8px; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px 24px; margin-bottom: 16px; }
    .info-block { background: #f5f5f0; padding: 12px 16px; border-radius: 6px; font-size: 12px; line-height: 1.6; }
    .info-block strong { display: block; font-size: 11px; text-transform: uppercase; color: #8A8580; letter-spacing: 0.5px; margin-bottom: 4px; }
    table { width: 100%; border-collapse: collapse; margin-top: 8px; }
    th { background: #f5f5f0; text-align: left; padding: 10px 12px; font-size: 11px; text-transform: uppercase; color: #666; border-bottom: 2px solid #ddd; letter-spacing: 0.4px; }
    td { padding: 10px 12px; font-size: 13px; border-bottom: 1px solid #eee; vertical-align: top; }
    .num { text-align: right; white-space: nowrap; }
    th.num { text-align: right; }
    .totals { margin-top: 12px; }
    .totals table { width: 360px; margin-left: auto; }
    .totals td { padding: 6px 12px; border: none; }
    .totals .total-row td { border-top: 2px solid #2D2A26; font-weight: 700; font-size: 15px; padding-top: 10px; color: ${header}; }
    .legal { margin-top: 24px; padding: 14px 16px; background: #f5f5f0; border-radius: 8px; font-size: 11px; color: #666; line-height: 1.6; }
    .footer { margin-top: 32px; padding-top: 12px; border-top: 1px solid #eee; font-size: 11px; color: #8A8580; text-align: center; }
    .print-bar { position: fixed; top: 12px; right: 12px; }
    .print-bar button { background: ${header}; color: #FFF; border: none; padding: 10px 18px; border-radius: 6px; font-weight: 600; cursor: pointer; font-size: 13px; }
    @media print {
      body { padding: 0; background: #FFFFFF; }
      .doc { box-shadow: none; padding: 24px; max-width: none; }
      .print-bar { display: none; }
      @page { size: A4; margin: 16mm; }
    }
  </style>
</head>
<body>
  <div class="print-bar"><button onclick="window.print()">Imprimir / Guardar PDF</button></div>
  <div class="doc">
    <div class="header">
      <div>
        ${logoBlock}
        <div style="font-size:11px;color:#8A8580;margin-top:6px;line-height:1.5;">${issuerLines}</div>
      </div>
      <div class="meta">
        <div style="font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#8A8580;">Factura</div>
        <div class="invoice-number">${escapeHtml(invoice.number)}</div>
        <div>Fecha emisión: ${formatDate(invoice.issuedAt ?? invoice.createdAt)}</div>
        ${invoice.paidAt ? `<div>Fecha pago: ${formatDate(invoice.paidAt)}</div>` : ""}
        <div class="badge">${escapeHtml(statusLabel)}</div>
      </div>
    </div>

    <h2>Datos del cliente</h2>
    <div class="info-block">
      ${clientLines || "Cliente"}
    </div>

    <h2>Detalle</h2>
    <table>
      <thead>
        <tr>
          <th>Descripción</th>
          <th class="num">Cant.</th>
          <th class="num">P. unitario</th>
          <th class="num">IVA %</th>
          <th class="num">Importe</th>
        </tr>
      </thead>
      <tbody>
        ${lineRows || `<tr><td colspan="5" style="text-align:center;color:#8A8580;">Sin líneas</td></tr>`}
      </tbody>
    </table>

    <div class="totals">
      <table>
        <tr><td>Subtotal (base imponible)</td><td class="num">${formatEUR(invoice.subtotal)}</td></tr>
        ${taxBreakdown}
        <tr class="total-row"><td>Total</td><td class="num">${formatEUR(invoice.total)}</td></tr>
      </table>
    </div>

    ${invoice.notes ? `<div class="legal"><strong>Observaciones:</strong> ${escapeHtml(invoice.notes)}</div>` : ""}

    ${fiscal.legalText ? `<div class="legal">${escapeHtml(fiscal.legalText)}</div>` : ""}

    <div class="footer">
      ${escapeHtml(fiscal.companyName)}${fiscal.companyNif ? ` · NIF ${escapeHtml(fiscal.companyNif)}` : ""}${fiscal.companyEmail ? ` · ${escapeHtml(fiscal.companyEmail)}` : ""}${fiscal.companyPhone ? ` · ${escapeHtml(fiscal.companyPhone)}` : ""}
      <br/>
      ${fiscal.footerText ? escapeHtml(fiscal.footerText) : `Documento generado automáticamente — ${escapeHtml(invoice.number)}`}
    </div>
  </div>
  <script>
    window.addEventListener('load', function () {
      setTimeout(function () { window.print(); }, 400);
    });
  </script>
</body>
</html>`;

    log.info({ invoiceId: id }, "Invoice PDF (HTML) generated");

    return new NextResponse(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    return apiError(error, {
      publicMessage: "Error al generar PDF de factura",
      code: "INVOICE_PDF_ERROR",
      logContext: { tenantId },
    });
  }
}
