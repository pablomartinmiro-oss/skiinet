/**
 * 3 PDF templates ready to seed for Skicenter:
 *   - quote (Presupuesto)
 *   - invoice (Factura)
 *   - settlement (Liquidación a proveedor)
 *
 * The bodyHtml uses the same {{var}} replacement scheme as emails.
 * Rendered to PDF via puppeteer-core or @react-pdf/renderer at runtime.
 */

import { SKICENTER_BRAND } from "./brand-skicenter";

const B = SKICENTER_BRAND;

export type PdfTemplateSeed = {
  templateKey: string;
  name: string;
  description: string;
  category: "fiscal" | "operations";
  logoUrl: string;
  headerColor: string;
  accentColor: string;
  companyName: string;
  companyAddress: string;
  companyPhone: string;
  companyEmail: string;
  companyNif: string;
  footerText: string;
  legalText: string;
  showLogo: boolean;
  showWatermark: boolean;
  bodyHtml: string;
  variables: string;
};

const SHARED_HEADER = `
<div style="background:${B.primary};color:#FFFFFF;padding:32px 40px;display:flex;justify-content:space-between;align-items:center;">
  <div>
    <div style="font-size:24px;font-weight:700;letter-spacing:0.3px;">${B.name}</div>
    <div style="font-size:11px;opacity:0.85;margin-top:4px;">${B.tagline}</div>
  </div>
  <div style="text-align:right;font-size:11px;opacity:0.85;line-height:1.6;">
    ${B.address}<br>
    ${B.phone} · ${B.email}<br>
    ${B.registry}
  </div>
</div>
`;

const SHARED_FOOTER_LEGAL = `
<div style="border-top:1px solid ${B.border};padding:16px 40px;margin-top:40px;font-size:9px;color:${B.textSecondary};line-height:1.5;">
  Documento emitido por {{companyName}} ({{companyNif}}). Sujeto al régimen general del IVA salvo indicación específica de
  régimen especial REAV (agencias de viajes). Para reclamaciones u hojas oficiales: {{companyEmail}} · {{companyPhone}}.
  Inscrita como agencia de viajes con código identificación {{registry}}.
</div>
`;

export const PDF_TEMPLATES: PdfTemplateSeed[] = [
  // ──────────────────────────────────────────────────────────
  // 1. QUOTE — Presupuesto
  // ──────────────────────────────────────────────────────────
  {
    templateKey: "quote",
    name: "Presupuesto",
    description: "PDF para presupuestos enviados al cliente. Incluye desglose de líneas y validez.",
    category: "operations",
    logoUrl: B.logoUrl,
    headerColor: B.primary,
    accentColor: B.accent,
    companyName: B.name,
    companyAddress: B.address,
    companyPhone: B.phone,
    companyEmail: B.email,
    companyNif: B.nif,
    footerText: B.tagline,
    legalText:
      "Presupuesto válido durante 14 días naturales desde su emisión. Los precios pueden variar si se modifican fechas, número de pasajeros o servicios solicitados. Pago seguro vía Redsys.",
    showLogo: true,
    showWatermark: false,
    bodyHtml: `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <title>Presupuesto {{quoteNumber}}</title>
</head>
<body style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:${B.textPrimary};">
  ${SHARED_HEADER}

  <div style="padding:32px 40px;">
    <table width="100%" style="margin-bottom:32px;">
      <tr>
        <td>
          <div style="font-size:11px;color:${B.textSecondary};letter-spacing:1.5px;text-transform:uppercase;">Presupuesto</div>
          <div style="font-size:28px;font-weight:700;color:${B.primary};margin-top:4px;">{{quoteNumber}}</div>
          <div style="font-size:12px;color:${B.textSecondary};margin-top:8px;">Emitido el {{issuedDate}}</div>
        </td>
        <td align="right">
          <div style="font-size:11px;color:${B.textSecondary};letter-spacing:1.5px;text-transform:uppercase;">Válido hasta</div>
          <div style="font-size:18px;font-weight:600;color:${B.accent};margin-top:4px;">{{validUntil}}</div>
        </td>
      </tr>
    </table>

    <table width="100%" style="margin-bottom:24px;">
      <tr>
        <td style="vertical-align:top;width:50%;padding-right:16px;">
          <div style="font-size:11px;color:${B.textSecondary};letter-spacing:1.2px;text-transform:uppercase;font-weight:600;">Cliente</div>
          <div style="font-size:14px;color:${B.textPrimary};font-weight:600;margin-top:6px;">{{clientName}}</div>
          <div style="font-size:12px;color:${B.textSecondary};margin-top:2px;">{{clientEmail}}</div>
          <div style="font-size:12px;color:${B.textSecondary};">{{clientPhone}}</div>
        </td>
        <td style="vertical-align:top;width:50%;padding-left:16px;border-left:1px solid ${B.border};">
          <div style="font-size:11px;color:${B.textSecondary};letter-spacing:1.2px;text-transform:uppercase;font-weight:600;">Detalles del viaje</div>
          <div style="font-size:14px;color:${B.textPrimary};font-weight:600;margin-top:6px;">{{destination}}</div>
          <div style="font-size:12px;color:${B.textSecondary};margin-top:2px;">{{checkIn}} → {{checkOut}}</div>
          <div style="font-size:12px;color:${B.textSecondary};">{{adults}} adultos · {{children}} niños</div>
        </td>
      </tr>
    </table>

    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-top:24px;">
      <thead>
        <tr style="background:${B.surface};">
          <th style="text-align:left;font-size:10px;letter-spacing:1.2px;text-transform:uppercase;color:${B.textSecondary};padding:12px 14px;border-bottom:2px solid ${B.primary};">Concepto</th>
          <th style="text-align:right;font-size:10px;letter-spacing:1.2px;text-transform:uppercase;color:${B.textSecondary};padding:12px 14px;border-bottom:2px solid ${B.primary};">Cant.</th>
          <th style="text-align:right;font-size:10px;letter-spacing:1.2px;text-transform:uppercase;color:${B.textSecondary};padding:12px 14px;border-bottom:2px solid ${B.primary};">Precio</th>
          <th style="text-align:right;font-size:10px;letter-spacing:1.2px;text-transform:uppercase;color:${B.textSecondary};padding:12px 14px;border-bottom:2px solid ${B.primary};">Total</th>
        </tr>
      </thead>
      <tbody>
        {{itemsRows}}
      </tbody>
    </table>

    <table width="100%" style="margin-top:24px;">
      <tr>
        <td></td>
        <td style="width:280px;">
          <table width="100%" style="background:${B.surface};border-radius:8px;padding:16px;">
            <tr>
              <td style="font-size:13px;color:${B.textSecondary};padding:6px 16px;">Subtotal</td>
              <td align="right" style="font-size:13px;color:${B.textPrimary};padding:6px 16px;">{{subtotal}}</td>
            </tr>
            <tr>
              <td style="font-size:13px;color:${B.textSecondary};padding:6px 16px;">IVA</td>
              <td align="right" style="font-size:13px;color:${B.textPrimary};padding:6px 16px;">{{taxAmount}}</td>
            </tr>
            <tr>
              <td style="font-size:14px;color:${B.primary};font-weight:700;padding:12px 16px 6px;border-top:2px solid ${B.primary};">TOTAL</td>
              <td align="right" style="font-size:18px;color:${B.primary};font-weight:700;padding:12px 16px 6px;border-top:2px solid ${B.primary};">{{totalAmount}}</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <div style="margin-top:24px;padding:16px;background:${B.surface};border-left:4px solid ${B.accent};font-size:12px;color:${B.textSecondary};line-height:1.6;">
      <strong style="color:${B.textPrimary};">Condiciones:</strong> {{legalText}}
    </div>
  </div>

  ${SHARED_FOOTER_LEGAL}
</body>
</html>
    `,
    variables: JSON.stringify([
      "quoteNumber",
      "issuedDate",
      "validUntil",
      "clientName",
      "clientEmail",
      "clientPhone",
      "destination",
      "checkIn",
      "checkOut",
      "adults",
      "children",
      "itemsRows",
      "subtotal",
      "taxAmount",
      "totalAmount",
      "companyName",
      "companyNif",
      "companyEmail",
      "companyPhone",
      "registry",
      "legalText",
    ]),
  },

  // ──────────────────────────────────────────────────────────
  // 2. INVOICE — Factura
  // ──────────────────────────────────────────────────────────
  {
    templateKey: "invoice",
    name: "Factura",
    description: "PDF de factura fiscal con desglose IVA y régimen aplicable.",
    category: "fiscal",
    logoUrl: B.logoUrl,
    headerColor: B.primary,
    accentColor: B.accent,
    companyName: B.name,
    companyAddress: B.address,
    companyPhone: B.phone,
    companyEmail: B.email,
    companyNif: B.nif,
    footerText: B.tagline,
    legalText:
      "Esta factura cumple los requisitos del Real Decreto 1619/2012. Operación sujeta al régimen general del IVA, salvo las líneas marcadas con régimen especial REAV.",
    showLogo: true,
    showWatermark: false,
    bodyHtml: `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <title>Factura {{invoiceNumber}}</title>
</head>
<body style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:${B.textPrimary};">
  ${SHARED_HEADER}

  <div style="padding:32px 40px;">
    <table width="100%" style="margin-bottom:32px;">
      <tr>
        <td>
          <div style="font-size:11px;color:${B.textSecondary};letter-spacing:1.5px;text-transform:uppercase;">Factura</div>
          <div style="font-size:28px;font-weight:700;color:${B.primary};margin-top:4px;">{{invoiceNumber}}</div>
          <div style="font-size:12px;color:${B.textSecondary};margin-top:8px;">Fecha emisión: {{issuedDate}}</div>
        </td>
        <td align="right">
          <div style="font-size:11px;color:${B.textSecondary};letter-spacing:1.5px;text-transform:uppercase;">Estado</div>
          <div style="display:inline-block;font-size:11px;font-weight:700;color:#FFFFFF;background:${B.accent};padding:6px 12px;border-radius:4px;margin-top:4px;letter-spacing:0.5px;">{{statusLabel}}</div>
        </td>
      </tr>
    </table>

    <table width="100%" style="margin-bottom:24px;">
      <tr>
        <td style="vertical-align:top;width:50%;padding-right:16px;">
          <div style="font-size:11px;color:${B.textSecondary};letter-spacing:1.2px;text-transform:uppercase;font-weight:600;">Emisor</div>
          <div style="font-size:13px;color:${B.textPrimary};font-weight:700;margin-top:6px;">${B.legalName}</div>
          <div style="font-size:11px;color:${B.textSecondary};margin-top:2px;">NIF: {{companyNif}}</div>
          <div style="font-size:11px;color:${B.textSecondary};">${B.address}</div>
        </td>
        <td style="vertical-align:top;width:50%;padding-left:16px;border-left:1px solid ${B.border};">
          <div style="font-size:11px;color:${B.textSecondary};letter-spacing:1.2px;text-transform:uppercase;font-weight:600;">Cliente</div>
          <div style="font-size:13px;color:${B.textPrimary};font-weight:700;margin-top:6px;">{{clientName}}</div>
          <div style="font-size:11px;color:${B.textSecondary};margin-top:2px;">{{clientNif}}</div>
          <div style="font-size:11px;color:${B.textSecondary};">{{clientAddress}}</div>
        </td>
      </tr>
    </table>

    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-top:24px;">
      <thead>
        <tr style="background:${B.surface};">
          <th style="text-align:left;font-size:10px;letter-spacing:1.2px;text-transform:uppercase;color:${B.textSecondary};padding:12px 14px;border-bottom:2px solid ${B.primary};">Descripción</th>
          <th style="text-align:right;font-size:10px;letter-spacing:1.2px;text-transform:uppercase;color:${B.textSecondary};padding:12px 14px;border-bottom:2px solid ${B.primary};">Cant.</th>
          <th style="text-align:right;font-size:10px;letter-spacing:1.2px;text-transform:uppercase;color:${B.textSecondary};padding:12px 14px;border-bottom:2px solid ${B.primary};">P. Unit.</th>
          <th style="text-align:right;font-size:10px;letter-spacing:1.2px;text-transform:uppercase;color:${B.textSecondary};padding:12px 14px;border-bottom:2px solid ${B.primary};">IVA</th>
          <th style="text-align:right;font-size:10px;letter-spacing:1.2px;text-transform:uppercase;color:${B.textSecondary};padding:12px 14px;border-bottom:2px solid ${B.primary};">Total</th>
        </tr>
      </thead>
      <tbody>
        {{linesRows}}
      </tbody>
    </table>

    <table width="100%" style="margin-top:24px;">
      <tr>
        <td></td>
        <td style="width:320px;">
          <table width="100%" style="background:${B.surface};border-radius:8px;padding:16px;">
            <tr>
              <td style="font-size:13px;color:${B.textSecondary};padding:6px 16px;">Base imponible</td>
              <td align="right" style="font-size:13px;color:${B.textPrimary};padding:6px 16px;">{{subtotal}}</td>
            </tr>
            <tr>
              <td style="font-size:13px;color:${B.textSecondary};padding:6px 16px;">Cuota IVA</td>
              <td align="right" style="font-size:13px;color:${B.textPrimary};padding:6px 16px;">{{taxAmount}}</td>
            </tr>
            <tr>
              <td style="font-size:14px;color:${B.primary};font-weight:700;padding:12px 16px 6px;border-top:2px solid ${B.primary};">TOTAL FACTURA</td>
              <td align="right" style="font-size:20px;color:${B.primary};font-weight:700;padding:12px 16px 6px;border-top:2px solid ${B.primary};">{{totalAmount}}</td>
            </tr>
            <tr>
              <td colspan="2" style="font-size:11px;color:${B.textSecondary};padding:8px 16px;text-align:right;">Pagado el {{paidDate}} · Ref: {{paymentRef}}</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <div style="margin-top:24px;padding:14px;background:${B.surface};border-left:4px solid ${B.primary};font-size:11px;color:${B.textSecondary};line-height:1.6;">
      {{legalText}}
    </div>
  </div>

  ${SHARED_FOOTER_LEGAL}
</body>
</html>
    `,
    variables: JSON.stringify([
      "invoiceNumber",
      "issuedDate",
      "statusLabel",
      "companyNif",
      "clientName",
      "clientNif",
      "clientAddress",
      "linesRows",
      "subtotal",
      "taxAmount",
      "totalAmount",
      "paidDate",
      "paymentRef",
      "companyName",
      "companyEmail",
      "companyPhone",
      "registry",
      "legalText",
    ]),
  },

  // ──────────────────────────────────────────────────────────
  // 3. SETTLEMENT — Liquidación a proveedor
  // ──────────────────────────────────────────────────────────
  {
    templateKey: "settlement",
    name: "Liquidación a proveedor",
    description: "PDF resumen de líneas y comisión a abonar al proveedor en el periodo.",
    category: "operations",
    logoUrl: B.logoUrl,
    headerColor: B.primary,
    accentColor: B.accent,
    companyName: B.name,
    companyAddress: B.address,
    companyPhone: B.phone,
    companyEmail: B.email,
    companyNif: B.nif,
    footerText: B.tagline,
    legalText:
      "Este documento es un resumen de liquidación. La factura proforma debe ser emitida por el proveedor con su NIF. Pago vía transferencia al IBAN registrado en su ficha.",
    showLogo: true,
    showWatermark: false,
    bodyHtml: `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <title>Liquidación {{settlementNumber}}</title>
</head>
<body style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:${B.textPrimary};">
  ${SHARED_HEADER}

  <div style="padding:32px 40px;">
    <table width="100%" style="margin-bottom:32px;">
      <tr>
        <td>
          <div style="font-size:11px;color:${B.textSecondary};letter-spacing:1.5px;text-transform:uppercase;">Liquidación</div>
          <div style="font-size:28px;font-weight:700;color:${B.primary};margin-top:4px;">{{settlementNumber}}</div>
          <div style="font-size:12px;color:${B.textSecondary};margin-top:8px;">Periodo: {{startDate}} → {{endDate}}</div>
        </td>
        <td align="right">
          <div style="font-size:11px;color:${B.textSecondary};letter-spacing:1.5px;text-transform:uppercase;">Estado</div>
          <div style="display:inline-block;font-size:11px;font-weight:700;color:#FFFFFF;background:${B.accent};padding:6px 12px;border-radius:4px;margin-top:4px;letter-spacing:0.5px;">{{statusLabel}}</div>
        </td>
      </tr>
    </table>

    <div style="background:${B.surface};border-radius:8px;padding:20px;margin-bottom:24px;">
      <div style="font-size:11px;color:${B.textSecondary};letter-spacing:1.2px;text-transform:uppercase;font-weight:600;">Proveedor</div>
      <div style="font-size:16px;color:${B.textPrimary};font-weight:700;margin-top:8px;">{{supplierFiscalName}}</div>
      <div style="font-size:12px;color:${B.textSecondary};margin-top:4px;">NIF: {{supplierNif}} · {{supplierIban}}</div>
    </div>

    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-top:24px;">
      <thead>
        <tr style="background:${B.surface};">
          <th style="text-align:left;font-size:10px;letter-spacing:1.2px;text-transform:uppercase;color:${B.textSecondary};padding:12px 14px;border-bottom:2px solid ${B.primary};">Servicio</th>
          <th style="text-align:left;font-size:10px;letter-spacing:1.2px;text-transform:uppercase;color:${B.textSecondary};padding:12px 14px;border-bottom:2px solid ${B.primary};">Fecha</th>
          <th style="text-align:right;font-size:10px;letter-spacing:1.2px;text-transform:uppercase;color:${B.textSecondary};padding:12px 14px;border-bottom:2px solid ${B.primary};">PAX</th>
          <th style="text-align:right;font-size:10px;letter-spacing:1.2px;text-transform:uppercase;color:${B.textSecondary};padding:12px 14px;border-bottom:2px solid ${B.primary};">Venta</th>
          <th style="text-align:right;font-size:10px;letter-spacing:1.2px;text-transform:uppercase;color:${B.textSecondary};padding:12px 14px;border-bottom:2px solid ${B.primary};">% Com.</th>
          <th style="text-align:right;font-size:10px;letter-spacing:1.2px;text-transform:uppercase;color:${B.textSecondary};padding:12px 14px;border-bottom:2px solid ${B.primary};">Comisión</th>
        </tr>
      </thead>
      <tbody>
        {{linesRows}}
      </tbody>
    </table>

    <table width="100%" style="margin-top:24px;">
      <tr>
        <td></td>
        <td style="width:340px;">
          <table width="100%" style="background:${B.surface};border-radius:8px;padding:16px;">
            <tr>
              <td style="font-size:13px;color:${B.textSecondary};padding:6px 16px;">Importe bruto vendido</td>
              <td align="right" style="font-size:13px;color:${B.textPrimary};padding:6px 16px;">{{grossAmount}}</td>
            </tr>
            <tr>
              <td style="font-size:13px;color:${B.textSecondary};padding:6px 16px;">Comisión Skicenter</td>
              <td align="right" style="font-size:13px;color:${B.accent};padding:6px 16px;">−{{commissionAmount}}</td>
            </tr>
            <tr>
              <td style="font-size:14px;color:${B.primary};font-weight:700;padding:12px 16px 6px;border-top:2px solid ${B.primary};">A LIQUIDAR</td>
              <td align="right" style="font-size:20px;color:${B.primary};font-weight:700;padding:12px 16px 6px;border-top:2px solid ${B.primary};">{{netAmount}}</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <div style="margin-top:24px;padding:14px;background:${B.surface};border-left:4px solid ${B.primary};font-size:11px;color:${B.textSecondary};line-height:1.6;">
      {{legalText}}
    </div>
  </div>

  ${SHARED_FOOTER_LEGAL}
</body>
</html>
    `,
    variables: JSON.stringify([
      "settlementNumber",
      "startDate",
      "endDate",
      "statusLabel",
      "supplierFiscalName",
      "supplierNif",
      "supplierIban",
      "linesRows",
      "grossAmount",
      "commissionAmount",
      "netAmount",
      "companyName",
      "companyNif",
      "companyEmail",
      "companyPhone",
      "registry",
      "legalText",
    ]),
  },
];
