import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Packs combinados",
  description:
    "Packs todo-en-uno con clases, alquiler de material, alojamiento y forfait. Configura tu pack y reserva en un solo paso.",
};

export default function PacksLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
