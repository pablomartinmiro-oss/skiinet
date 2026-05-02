import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Hotel y alojamiento",
  description:
    "Reserva tu alojamiento en Baqueira, Sierra Nevada o La Pinilla. Habitaciones con tarifas por temporada y disponibilidad en tiempo real.",
};

export default function HotelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
