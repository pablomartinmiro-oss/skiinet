export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { requireTenant } from "@/lib/auth/guard";
import { requireModule } from "@/lib/modules/guard";
import { prisma } from "@/lib/db";
import { apiError } from "@/lib/api-response";
import { getTenantFiscalData } from "@/lib/tenant/fiscal";

const IBAN = "ES58 0182 2900 5402 0182 7221";

function formatEUR(amount: number): string {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
  }).format(amount);
}

function formatDate(d: Date | null | undefined): string {
  if (!d) return "";
  return new Date(d).toLocaleDateString("es-ES");
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

interface PdfItem {
  name: string;
  category: string | null;
  description: string | null;
  quantity: number;
  unitPrice: number;
  discount: number;
  totalPrice: number;
  startDate: Date | null;
  numDays: number | null;
  horario: string | null;
  modalidad: string | null;
  nivel: string | null;
  sector: string | null;
  idioma: string | null;
  tipoCliente: string | null;
  notes: string | null;
}

function buildItemDetailLine(item: PdfItem): string {
  const lines: string[] = [];
  if (item.startDate) {
    const dateStr = formatDate(item.startDate);
    const timeStr = item.horario ? ` ${escapeHtml(item.horario)}` : "";
    lines.push(`Fecha: ${dateStr}${timeStr}`);
  }
  if (item.numDays) lines.push(`Días: ${item.numDays}`);
  if (item.modalidad) lines.push(`Modalidad: ${escapeHtml(item.modalidad)}`);
  if (item.nivel) lines.push(`Nivel: ${escapeHtml(item.nivel)}`);
  if (item.sector) lines.push(`Sector: ${escapeHtml(item.sector)}`);
  if (item.idioma) lines.push(`Idioma: ${escapeHtml(item.idioma)}`);
  if (item.tipoCliente) lines.push(`Cliente: ${escapeHtml(item.tipoCliente)}`);
  if (item.notes) lines.push(escapeHtml(item.notes));
  if (lines.length === 0) return "";
  return `<div class="item-detail">${lines.join(" · ")}</div>`;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const [session, authError] = await requireTenant();
  if (authError) return authError;

  const modError = await requireModule(session.tenantId, "booking");
  if (modError) return modError;

  const { tenantId } = session;
  const { id } = await params;

  try {
    const [quote, fiscal] = await Promise.all([
      prisma.quote.findFirst({
        where: { id, tenantId },
        include: { items: true },
      }),
      getTenantFiscalData(tenantId, "quote"),
    ]);

    if (!quote) {
      return NextResponse.json({ error: "Presupuesto no encontrado" }, { status: 404 });
    }

    const quoteNumber = `Q-${quote.id.slice(-8).toUpperCase()}`;
    const tenantName = fiscal.companyName;
    const COMPANY_EMAIL = fiscal.companyEmail ?? "reservas@skicenter.es";
    const COMPANY_PHONE = fiscal.companyPhone ?? "639 576 627";
    const headerColor = fiscal.headerColor;
    const accentColor = fiscal.accentColor;
    const issuerLines = [
      escapeHtml(tenantName),
      fiscal.companyNif ? `NIF: ${escapeHtml(fiscal.companyNif)}` : "",
      fiscal.companyAddress ? escapeHtml(fiscal.companyAddress) : "",
    ].filter(Boolean).join("<br/>");
    const logoBlock = fiscal.logoUrl
      ? `<img src="${escapeHtml(fiscal.logoUrl)}" alt="${escapeHtml(tenantName)}" style="max-height:50px;display:block;margin-bottom:6px;" />`
      : `<div class="brand">${escapeHtml(tenantName.toUpperCase())}<small>Agencia de viajes de esquí</small></div>`;

    const subtotal = quote.items.reduce((acc, it) => acc + it.unitPrice * it.quantity, 0);
    const discountTotal = quote.items.reduce((acc, it) => {
      const lineGross = it.unitPrice * it.quantity;
      return acc + (lineGross - it.totalPrice);
    }, 0);

    const itemRows = quote.items
      .map((item) => {
        const detail = buildItemDetailLine({
          name: item.name,
          category: item.category,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discount: item.discount,
          totalPrice: item.totalPrice,
          startDate: item.startDate,
          numDays: item.numDays,
          horario: item.horario,
          modalidad: item.modalidad,
          nivel: item.nivel,
          sector: item.sector,
          idioma: item.idioma,
          tipoCliente: item.tipoCliente,
          notes: item.notes,
        });
        return `
        <tr>
          <td class="col-desc">
            <div class="item-name">${escapeHtml(item.name)}</div>
            ${detail}
          </td>
          <td class="col-num">${item.quantity}</td>
          <td class="col-num">${formatEUR(item.unitPrice)}</td>
          <td class="col-num">${item.discount > 0 ? `${item.discount}%` : "—"}</td>
          <td class="col-num">${formatEUR(item.totalPrice)}</td>
        </tr>`;
      })
      .join("");

    const paymentBlock = quote.redsysPaymentUrl
      ? `<p>Puede formalizar el pago en línea:<br/>
         <a href="${escapeHtml(quote.redsysPaymentUrl)}">${escapeHtml(quote.redsysPaymentUrl)}</a></p>
         <p>O por transferencia bancaria al IBAN <strong>${IBAN}</strong>, indicando como concepto <strong>${quoteNumber}</strong> y enviando el justificante a ${COMPANY_EMAIL}.</p>`
      : `<p>Pago por transferencia bancaria al IBAN <strong>${IBAN}</strong>, indicando como concepto <strong>${quoteNumber}</strong> y enviando el justificante a ${COMPANY_EMAIL}.</p>`;

    const expiryBlock = quote.expiresAt
      ? `<p>Validez del presupuesto hasta el <strong>${formatDate(quote.expiresAt)}</strong>.</p>`
      : "";

    const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${quoteNumber} — ${escapeHtml(tenantName)}</title>
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; padding: 24px; background: #FAF9F7; color: #2D2A26; font-family: 'DM Sans', Arial, sans-serif; font-size: 13px; line-height: 1.6; }
    .doc { max-width: 820px; margin: 0 auto; background: #FFFFFF; padding: 40px 48px; box-shadow: 0 1px 4px rgba(0,0,0,0.05); }
    .header { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 16px; border-bottom: 2px solid ${headerColor}; margin-bottom: 24px; }
    .brand { font-size: 22px; font-weight: 700; letter-spacing: 1px; color: ${headerColor}; }
    .brand small { display: block; font-size: 11px; color: #8A8580; font-weight: 400; letter-spacing: 0; margin-top: 2px; }
    .issuer-info { font-size: 11px; color: #8A8580; margin-top: 6px; line-height: 1.5; }
    .meta { text-align: right; font-size: 12px; color: #8A8580; }
    .meta .quote-number { font-size: 18px; color: #2D2A26; font-weight: 700; letter-spacing: 1px; }
    h2 { font-size: 14px; text-transform: uppercase; letter-spacing: 1px; color: ${headerColor}; margin: 24px 0 8px; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px 24px; margin-bottom: 16px; }
    .info-block { background: #f5f5f0; padding: 12px 16px; border-radius: 6px; font-size: 12px; line-height: 1.6; }
    .info-block strong { display: block; font-size: 11px; text-transform: uppercase; color: #8A8580; letter-spacing: 0.5px; margin-bottom: 4px; }
    table { width: 100%; border-collapse: collapse; margin-top: 8px; }
    th { background: #f5f5f0; text-align: left; padding: 10px 12px; font-size: 11px; text-transform: uppercase; color: #666; border-bottom: 2px solid #ddd; letter-spacing: 0.4px; }
    td { padding: 10px 12px; font-size: 13px; border-bottom: 1px solid #eee; vertical-align: top; }
    .col-num { text-align: right; white-space: nowrap; }
    th.col-num { text-align: right; }
    .item-name { font-weight: 600; }
    .item-detail { font-size: 11px; color: #666; line-height: 1.5; margin-top: 4px; }
    .totals { margin-top: 12px; }
    .totals table { width: 320px; margin-left: auto; }
    .totals td { padding: 6px 12px; border: none; }
    .totals .total-row td { border-top: 2px solid #2D2A26; font-weight: 700; font-size: 15px; padding-top: 10px; }
    .payment-box { margin-top: 24px; padding: 16px 20px; background: #f5f5f0; border-radius: 8px; font-size: 12px; }
    .payment-box p { margin: 6px 0; }
    .payment-box a { color: ${headerColor}; word-break: break-all; }
    .legal { margin-top: 24px; padding: 14px 16px; background: #f5f5f0; border-radius: 8px; font-size: 11px; color: #666; line-height: 1.6; }
    .footer { margin-top: 32px; padding-top: 12px; border-top: 1px solid #eee; font-size: 11px; color: #8A8580; text-align: center; }
    .print-bar { position: fixed; top: 12px; right: 12px; }
    .print-bar button { background: ${headerColor}; color: #FFF; border: none; padding: 10px 18px; border-radius: 6px; font-weight: 600; cursor: pointer; font-size: 13px; }
    .item-name strong { color: ${accentColor}; }
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
        <div class="issuer-info">${issuerLines}</div>
      </div>
      <div class="meta">
        <div style="font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#8A8580;">Presupuesto</div>
        <div class="quote-number">${quoteNumber}</div>
        <div>Emitido: ${formatDate(quote.createdAt)}</div>
        ${quote.expiresAt ? `<div>Validez: ${formatDate(quote.expiresAt)}</div>` : ""}
      </div>
    </div>

    <h2>Cliente</h2>
    <div class="info-grid">
      <div class="info-block">
        <strong>Datos personales</strong>
        ${escapeHtml(quote.clientName)}<br/>
        ${quote.clientEmail ? `${escapeHtml(quote.clientEmail)}<br/>` : ""}
        ${quote.clientPhone ? `${escapeHtml(quote.clientPhone)}` : ""}
      </div>
      <div class="info-block">
        <strong>Viaje</strong>
        Destino: ${escapeHtml(quote.destination)}<br/>
        Entrada: ${formatDate(quote.checkIn)}<br/>
        Salida: ${formatDate(quote.checkOut)}<br/>
        Adultos: ${quote.adults} · Niños: ${quote.children}
      </div>
    </div>

    <h2>Detalle</h2>
    <table>
      <thead>
        <tr>
          <th>Descripción</th>
          <th class="col-num">Cant.</th>
          <th class="col-num">P. unitario</th>
          <th class="col-num">Dto.</th>
          <th class="col-num">Importe</th>
        </tr>
      </thead>
      <tbody>
        ${itemRows || `<tr><td colspan="5" style="text-align:center;color:#8A8580;">Sin líneas</td></tr>`}
      </tbody>
    </table>

    <div class="totals">
      <table>
        <tr><td>Subtotal</td><td class="col-num">${formatEUR(subtotal)}</td></tr>
        ${discountTotal > 0 ? `<tr><td>Descuentos</td><td class="col-num">- ${formatEUR(discountTotal)}</td></tr>` : ""}
        <tr class="total-row"><td>Total</td><td class="col-num">${formatEUR(quote.totalAmount)}</td></tr>
      </table>
    </div>

    <h2>Forma de pago</h2>
    <div class="payment-box">
      ${paymentBlock}
      ${expiryBlock}
    </div>

    <h2>Condiciones generales</h2>
    <div class="legal">
      ${fiscal.legalText ? escapeHtml(fiscal.legalText) : `Este presupuesto está sujeto a disponibilidad y a las condiciones generales de contratación. Los precios incluyen IVA cuando aplica. La aceptación implica la conformidad con la política de cancelación: gratuita hasta 15 días antes de la fecha de inicio; cancelaciones posteriores no son reembolsables salvo emisión de bono. Para confirmar la reserva es necesario el pago íntegro o señal acordada.`}
    </div>

    <div class="footer">
      ${escapeHtml(tenantName)}${fiscal.companyNif ? ` · NIF ${escapeHtml(fiscal.companyNif)}` : ""} · ${escapeHtml(COMPANY_EMAIL)} · ${escapeHtml(COMPANY_PHONE)}<br/>
      ${fiscal.footerText ? escapeHtml(fiscal.footerText) : `Documento generado automáticamente — ${quoteNumber}`}
    </div>
  </div>
  <script>
    window.addEventListener('load', function () {
      setTimeout(function () { window.print(); }, 400);
    });
  </script>
</body>
</html>`;

    return new NextResponse(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    return apiError(error, {
      publicMessage: "Error generando el PDF del presupuesto",
      code: "QUOTE_PDF_ERROR",
      logContext: { tenantId, quoteId: id },
    });
  }
}
