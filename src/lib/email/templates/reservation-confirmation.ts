import { emailBase, section, divider, h1, h2, p, infoTable, highlight, formatEUR } from "./_base";

export interface ReservationConfirmationData {
  reservationId: string;
  clientName: string;
  station: string;
  activityDate: string;
  schedule: string;
  services: string[];
  totalPrice: number;
}

export function buildReservationConfirmationHTML(data: ReservationConfirmationData): string {
  const firstName = data.clientName.split(" ")[0];
  const serviceList = data.services.length
    ? data.services.map((s) => `<li style="padding:4px 0;color:#4B5563;font-size:13px;">✓ ${s}</li>`).join("")
    : "<li style=\"padding:4px 0;color:#9CA3AF;font-size:13px;\">Sin servicios específicos</li>";

  const body = `
${section(`
  ${h1("¡Reserva confirmada!")}
  ${p(`Hola <strong>${firstName}</strong>,`)}
  ${p("Tu reserva con Skicenter ha sido confirmada. Aquí tienes los detalles:")}
  ${highlight("✅ <strong>Reserva confirmada</strong> — Te esperamos en la montaña")}
  ${infoTable([
    { label: "Referencia", value: `#${data.reservationId.slice(-8).toUpperCase()}` },
    { label: "Estación", value: data.station },
    { label: "Fecha", value: data.activityDate },
    { label: "Horario", value: data.schedule || "Por confirmar" },
    { label: "Total", value: formatEUR(data.totalPrice) },
  ])}
`)}

${divider()}

${section(`
  ${h2("Servicios incluidos")}
  <ul style="margin:0;padding:0 0 0 4px;list-style:none;">${serviceList}</ul>
`)}

${divider()}

${section(`
  ${h2("¿Necesitas ayuda?")}
  ${p('📧 <a href="mailto:reservas@skicenter.es" style="color:#42A5F5;">reservas@skicenter.es</a><br>📞 639 576 627')}
`)}`;

  return emailBase(body);
}
