import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tu carrito",
  description: "Revisa tu reserva antes de finalizar la compra.",
  robots: { index: false, follow: false },
};

export default function CarritoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
