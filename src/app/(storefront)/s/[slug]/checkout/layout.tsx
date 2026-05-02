import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Finalizar compra",
  description: "Completa tu reserva con pago seguro mediante Redsys.",
  robots: { index: false, follow: false },
};

export default function CheckoutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
