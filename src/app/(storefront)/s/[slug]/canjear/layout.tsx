import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Canjear bono",
  description: "Introduce tu código y disfruta de tu experiencia.",
  robots: { index: false, follow: false },
};

export default function CanjearLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
