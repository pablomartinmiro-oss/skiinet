import { emailBase, section, divider, h1, h2, p, infoTable } from "./_base";

export interface ReservationCancellationData {
  reservationId: string;
  clientName: string;
  station: string;
  activityDate: string;
  reason: "cancelada" | "sin_disponibilidad";
}

export function buildReservationCancellationHTML(data: ReservationCancellationData): string {
  const firstName = data.clientName.split(" ")[0];
  const isUnavailable = data.reason === "sin_disponibilidad";

  const heading = isUnavailable
    ? "Sin disponibilidad para tu fecha"
    : "Reserva cancelada";

  const intro = isUnavailable
    ? "Lamentamos comunicarte que no disponemos de plazas para la fecha solicitada. Nos encantaría ofrecerte una fecha alternativa — responde a este email y te ayudamos a encontrar el mejor día."
    : "Hemos cancelado tu reserva tal y como solicitaste. Si fue un error o quieres volver a reservar, contesta a este email y te ayudamos.";

  const body = `
${section(`
  ${h1(heading)}
  ${p(`Hola <strong>${firstName}</strong>,`)}
  ${p(intro)}
  ${infoTable([
    { label: "Referencia", value: `#${data.reservationId.slice(-8).toUpperCase()}` },
    { label: "Estación", value: data.station },
    { label: "Fecha solicitada", value: data.activityDate },
  ])}
`)}

${divider()}

${section(`
  ${h2("¿Buscamos una alternativa?")}
  ${p("Estamos aquí para ayudarte:")}
  ${p('📧 <a href="mailto:reservas@skicenter.es" style="color:#42A5F5;">reservas@skicenter.es</a><br>📞 639 576 627<br>💬 <a href="https://wa.me/34919041947" style="color:#42A5F5;">WhatsApp</a>')}
`)}`;

  return emailBase(body);
}
