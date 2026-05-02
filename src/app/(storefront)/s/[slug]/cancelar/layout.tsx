import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cancelar reserva",
  description: "Cancela una reserva existente.",
  robots: { index: false, follow: false },
};

export default function CancelarLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
