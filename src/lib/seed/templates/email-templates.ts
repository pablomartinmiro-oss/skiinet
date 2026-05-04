/**
 * 8 transactional email templates ready to seed for Skicenter.
 *
 * Variables follow `{{varName}}` syntax. Replacement happens at send
 * time in `src/lib/email/builders.ts`. Don't escape HTML inside
 * variables — sender is responsible for sanitisation upstream.
 */

import { SKICENTER_BRAND } from "./brand-skicenter";
import { renderEmail } from "./email-base";

export type EmailTemplateSeed = {
  templateKey: string;
  name: string;
  description: string;
  category: "reservations" | "crm" | "cancellations" | "tpv" | "system";
  recipient: "client" | "admin" | "both";
  subject: string;
  bodyHtml: string;
  variables: string; // JSON-stringified list of available vars
};

const B = SKICENTER_BRAND;

export const EMAIL_TEMPLATES: EmailTemplateSeed[] = [
  // ──────────────────────────────────────────────────────────────
  // 1. quote_send — admin envía un presupuesto al cliente
  // ──────────────────────────────────────────────────────────────
  {
    templateKey: "quote_send",
    name: "Envío de presupuesto",
    description: "Email al cliente cuando el equipo envía un presupuesto con link de pago.",
    category: "crm",
    recipient: "client",
    subject: "Tu presupuesto {{quoteNumber}} — Skicenter",
    bodyHtml: renderEmail(B, {
      eyebrow: "PRESUPUESTO",
      heading: "Aquí tienes tu presupuesto, {{firstName}}",
      subheading:
        "Hemos preparado un plan a medida para tu viaje a {{destination}}. Echa un vistazo y, cuando estés listo/a, reserva en un clic.",
      bodyBlocks: [
        `Tu presupuesto incluye todo lo que has solicitado y está disponible durante <strong>14 días</strong>.`,
      ],
      summary: [
        { label: "Presupuesto", value: "{{quoteNumber}}" },
        { label: "Destino", value: "{{destination}}" },
        { label: "Fechas", value: "{{checkIn}} → {{checkOut}}" },
        { label: "Personas", value: "{{adults}} adultos · {{children}} niños" },
        { label: "Importe total", value: "<strong>{{totalAmount}}</strong>" },
      ],
      cta: { label: "Ver y reservar", url: "{{paymentUrl}}" },
      closing:
        "¿Necesitas ajustar algo? Responde a este email o llámanos al " +
        B.phone +
        " — estamos aquí para personalizarlo a tu medida.",
    }),
    variables: JSON.stringify([
      "firstName",
      "quoteNumber",
      "destination",
      "checkIn",
      "checkOut",
      "adults",
      "children",
      "totalAmount",
      "paymentUrl",
    ]),
  },

  // ──────────────────────────────────────────────────────────────
  // 2. payment_confirmation — Redsys ha confirmado el pago
  // ──────────────────────────────────────────────────────────────
  {
    templateKey: "payment_confirmation",
    name: "Pago confirmado",
    description: "Email automático tras pago Redsys exitoso.",
    category: "reservations",
    recipient: "client",
    subject: "¡Pago recibido! Tu reserva {{quoteNumber}} está confirmada",
    bodyHtml: renderEmail(B, {
      eyebrow: "✓ PAGO CONFIRMADO",
      heading: "¡Listo, {{firstName}}! Tu reserva está confirmada",
      subheading:
        "Hemos recibido tu pago y todo está en marcha. Te enviaremos los detalles operativos (puntos de recogida, horarios) 48h antes de tu llegada.",
      bodyBlocks: [
        `Guarda este email — es tu comprobante de reserva.`,
      ],
      summary: [
        { label: "Reserva", value: "{{quoteNumber}}" },
        { label: "Destino", value: "{{destination}}" },
        { label: "Fechas", value: "{{checkIn}} → {{checkOut}}" },
        { label: "Importe pagado", value: "<strong>{{totalAmount}}</strong>" },
        { label: "Autorización", value: "{{paymentRef}}" },
      ],
      closing:
        "Si necesitas cambiar algo o tienes preguntas, escríbenos a " +
        B.email +
        ". ¡Nos vemos en la nieve!",
    }),
    variables: JSON.stringify([
      "firstName",
      "quoteNumber",
      "destination",
      "checkIn",
      "checkOut",
      "totalAmount",
      "paymentRef",
    ]),
  },

  // ──────────────────────────────────────────────────────────────
  // 3. payment_reminder_24h — 24h después de enviar quote sin pago
  // ──────────────────────────────────────────────────────────────
  {
    templateKey: "payment_reminder_24h",
    name: "Recordatorio 24h",
    description: "Recordatorio amistoso 24h tras enviar el presupuesto sin pago.",
    category: "crm",
    recipient: "client",
    subject: "Tu viaje a {{destination}} te espera — {{quoteNumber}}",
    bodyHtml: renderEmail(B, {
      eyebrow: "RECORDATORIO",
      heading: "{{firstName}}, no dejes pasar tu plan",
      subheading: `Ayer te enviamos un presupuesto para tu escapada a {{destination}}. Sigue disponible y puedes reservar cuando quieras.`,
      bodyBlocks: [
        `Las plazas en temporada alta vuelan — si esperas mucho, los precios pueden cambiar o los hoteles agotarse.`,
      ],
      cta: { label: "Reservar ahora", url: "{{paymentUrl}}" },
      closing: "Cualquier duda, aquí estamos.",
    }),
    variables: JSON.stringify(["firstName", "quoteNumber", "destination", "paymentUrl"]),
  },

  // ──────────────────────────────────────────────────────────────
  // 4. payment_reminder_72h_discount — 10% incentive
  // ──────────────────────────────────────────────────────────────
  {
    templateKey: "payment_reminder_72h_discount",
    name: "Recordatorio 72h con descuento",
    description: "72h tras envío sin pago — incluye código descuento 10% temporal.",
    category: "crm",
    recipient: "client",
    subject: "10% off en tu viaje — válido 24h",
    bodyHtml: renderEmail(B, {
      eyebrow: "OFERTA EXCLUSIVA",
      heading: "Un empujoncito para que te decidas",
      subheading: `Sabemos que decidirse un viaje implica varias variables. Para hacerte la vida más fácil, te dejamos un <strong>10% de descuento</strong> usando este código:`,
      bodyBlocks: [
        `<div style="background:#FFF7ED;border:2px dashed ${B.accent};border-radius:8px;padding:20px;text-align:center;margin:8px 0;">
          <div style="font-size:11px;color:${B.textSecondary};letter-spacing:1.5px;margin-bottom:6px;">CÓDIGO DE DESCUENTO</div>
          <div style="font-size:28px;font-weight:700;color:${B.primary};letter-spacing:3px;font-family:monospace;">{{discountCode}}</div>
          <div style="font-size:12px;color:${B.textSecondary};margin-top:8px;">Válido 24h sobre tu presupuesto {{quoteNumber}}</div>
        </div>`,
      ],
      cta: { label: "Aplicar y reservar", url: "{{paymentUrl}}" },
      closing: "El descuento expira mañana a las 23:59. Si lo pasas, no te preocupes — sigue habiendo alternativas.",
    }),
    variables: JSON.stringify([
      "firstName",
      "quoteNumber",
      "discountCode",
      "paymentUrl",
    ]),
  },

  // ──────────────────────────────────────────────────────────────
  // 5. payment_expired — quote expired
  // ──────────────────────────────────────────────────────────────
  {
    templateKey: "payment_expired",
    name: "Presupuesto expirado",
    description: "Email al cliente cuando un presupuesto pasa expiresAt sin pago.",
    category: "crm",
    recipient: "client",
    subject: "Tu presupuesto {{quoteNumber}} ha expirado",
    bodyHtml: renderEmail(B, {
      eyebrow: "EXPIRADO",
      heading: "Tu presupuesto ha caducado",
      subheading: `El presupuesto que te enviamos para {{destination}} ya no está disponible. Pero no pasa nada — podemos prepararte uno nuevo en minutos con los precios actualizados.`,
      bodyBlocks: [
        `Solo tienes que responder a este email o llamarnos. La temporada está activa, hay buenas opciones y nos encantará volver a ayudarte.`,
      ],
      cta: { label: "Pedir nuevo presupuesto", url: "{{websiteUrl}}/presupuesto" },
      closing: "Te esperamos.",
    }),
    variables: JSON.stringify([
      "firstName",
      "quoteNumber",
      "destination",
      "websiteUrl",
    ]),
  },

  // ──────────────────────────────────────────────────────────────
  // 6. cancellation_received — solicitud de cancelación recibida
  // ──────────────────────────────────────────────────────────────
  {
    templateKey: "cancellation_received",
    name: "Cancelación recibida",
    description: "Acuse de recibo cuando un cliente solicita cancelación.",
    category: "cancellations",
    recipient: "client",
    subject: "Hemos recibido tu solicitud de cancelación",
    bodyHtml: renderEmail(B, {
      eyebrow: "EN REVISIÓN",
      heading: "Tenemos tu solicitud, {{firstName}}",
      subheading: `Hemos recibido tu solicitud de cancelación para la reserva {{reservationNumber}}. Nuestro equipo la está revisando.`,
      bodyBlocks: [
        `Te avisaremos por email en las próximas <strong>48 horas</strong> con la resolución y, si procede, los próximos pasos para la devolución o emisión de bono.`,
      ],
      summary: [
        { label: "Solicitud", value: "{{cancellationRef}}" },
        { label: "Reserva", value: "{{reservationNumber}}" },
        { label: "Recibida", value: "{{submittedAt}}" },
      ],
      closing: "Si tienes nueva información que aportar, responde a este email.",
    }),
    variables: JSON.stringify([
      "firstName",
      "cancellationRef",
      "reservationNumber",
      "submittedAt",
    ]),
  },

  // ──────────────────────────────────────────────────────────────
  // 7. cancellation_voucher — bono emitido
  // ──────────────────────────────────────────────────────────────
  {
    templateKey: "cancellation_voucher",
    name: "Bono de compensación emitido",
    description: "Cliente recibe bono tras cancelación aceptada con compensación.",
    category: "cancellations",
    recipient: "client",
    subject: "Tu bono Skicenter {{voucherCode}}",
    bodyHtml: renderEmail(B, {
      eyebrow: "BONO ACTIVO",
      heading: "Aquí tienes tu bono, {{firstName}}",
      subheading: "Tras revisar tu cancelación, hemos emitido un bono que puedes usar en cualquier reserva con nosotros antes de la fecha de expiración.",
      bodyBlocks: [
        `<div style="background:${B.surface};border:2px solid ${B.primary};border-radius:8px;padding:24px;text-align:center;margin:8px 0;">
          <div style="font-size:11px;color:${B.textSecondary};letter-spacing:1.5px;margin-bottom:6px;">BONO</div>
          <div style="font-size:28px;font-weight:700;color:${B.primary};letter-spacing:3px;font-family:monospace;margin-bottom:12px;">{{voucherCode}}</div>
          <div style="font-size:18px;font-weight:600;color:${B.accent};">Valor: {{voucherValue}}</div>
          <div style="font-size:12px;color:${B.textSecondary};margin-top:8px;">Válido hasta {{voucherExpiry}}</div>
        </div>`,
        `Para canjearlo, simplemente menciónalo cuando solicites tu próximo presupuesto o introdúcelo en el checkout online.`,
      ],
      cta: { label: "Verificar bono", url: "{{websiteUrl}}/canjear?code={{voucherCode}}" },
      closing: "Esperamos verte de nuevo en pistas pronto.",
    }),
    variables: JSON.stringify([
      "firstName",
      "voucherCode",
      "voucherValue",
      "voucherExpiry",
      "websiteUrl",
    ]),
  },

  // ──────────────────────────────────────────────────────────────
  // 8. cancellation_refund — devolución pendiente
  // ──────────────────────────────────────────────────────────────
  {
    templateKey: "cancellation_refund",
    name: "Devolución en curso",
    description: "Cliente con cancelación aceptada y devolución monetaria.",
    category: "cancellations",
    recipient: "client",
    subject: "Devolución en curso — {{cancellationRef}}",
    bodyHtml: renderEmail(B, {
      eyebrow: "DEVOLUCIÓN APROBADA",
      heading: "{{firstName}}, hemos aprobado tu devolución",
      subheading:
        "Procesaremos el reembolso a la misma tarjeta o cuenta usada en el pago original. Suele tardar entre <strong>5 y 10 días hábiles</strong> en aparecer en tu extracto.",
      bodyBlocks: [],
      summary: [
        { label: "Solicitud", value: "{{cancellationRef}}" },
        { label: "Reserva", value: "{{reservationNumber}}" },
        { label: "Importe", value: "<strong>{{refundAmount}}</strong>" },
        { label: "N.º abono", value: "{{creditNoteNumber}}" },
      ],
      closing:
        "Si pasados 10 días no ves el reembolso, escríbenos a " +
        B.email +
        " con tu número de solicitud y lo revisaremos.",
    }),
    variables: JSON.stringify([
      "firstName",
      "cancellationRef",
      "reservationNumber",
      "refundAmount",
      "creditNoteNumber",
    ]),
  },
];
