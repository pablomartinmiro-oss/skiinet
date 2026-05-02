import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Spa y bienestar",
  description:
    "Reserva tratamientos de spa: masajes, circuitos termales y rituales. Después del esquí, te lo mereces.",
};

export default function SpaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
