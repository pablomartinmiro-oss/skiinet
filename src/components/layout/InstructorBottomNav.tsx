"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, Clock, GraduationCap, Wallet, User } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { label: "Mi Día", href: "/profesores/mi-portal", icon: CalendarDays, match: ["/profesores/mi-portal", "/profesores"] },
  { label: "Fichaje", href: "/profesores/fichaje", icon: Clock, match: ["/profesores/fichaje"] },
  { label: "Clases", href: "/profesores/horario", icon: GraduationCap, match: ["/profesores/horario", "/profesores/mis-diplomas"] },
  { label: "Ingresos", href: "/profesores/liquidaciones", icon: Wallet, match: ["/profesores/liquidaciones"] },
  { label: "Perfil", href: "/profesores/mi-perfil", icon: User, match: ["/profesores/mi-perfil", "/profesores/dias-libres", "/profesores/mensajes"] },
];

export function InstructorBottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 flex items-stretch border-t border-[#E8E4DE] bg-white pb-[env(safe-area-inset-bottom)] md:hidden"
      aria-label="Navegación del profesor"
    >
      {TABS.map((tab) => {
        const isActive = tab.match.some(
          (m) => pathname === m || pathname.startsWith(m + "/")
        );
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "flex min-h-[60px] flex-1 flex-col items-center justify-center gap-0.5 px-1 py-2 text-[11px] font-medium transition-colors",
              isActive ? "text-[#E87B5A]" : "text-[#8A8580] hover:text-[#2D2A26]"
            )}
          >
            <tab.icon className="h-5 w-5" aria-hidden />
            <span className="leading-none">{tab.label}</span>
            {isActive && <span className="absolute top-0 h-0.5 w-10 rounded-full bg-[#E87B5A]" />}
          </Link>
        );
      })}
    </nav>
  );
}
