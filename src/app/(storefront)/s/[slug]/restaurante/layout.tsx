import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Restaurante",
  description:
    "Reserva tu mesa en nuestro restaurante de montaña. Almuerzo, cena y propuestas gastronómicas regionales.",
};

export default function RestauranteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
