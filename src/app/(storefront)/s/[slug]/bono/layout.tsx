import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Bono regalo",
  description: "Regala una experiencia en la nieve con nuestros bonos canjeables.",
};

export default function BonoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
