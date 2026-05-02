"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Mountain,
  CalendarDays,
  Clock,
  User,
  LogOut,
  CalendarOff,
  Wallet,
  Award,
  MessageSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { signOut } from "next-auth/react";
import { useMyInstructorProfile } from "@/hooks/useInstructors";

const NAV_ITEMS = [
  { label: "Mi Dia", href: "/profesores/mi-portal", icon: CalendarDays },
  { label: "Fichaje", href: "/profesores/fichaje", icon: Clock },
  { label: "Diplomas", href: "/profesores/mis-diplomas", icon: Award },
  { label: "Dias libres", href: "/profesores/dias-libres", icon: CalendarOff },
  { label: "Mensajes", href: "/profesores/mensajes", icon: MessageSquare },
  { label: "Liquidaciones", href: "/profesores/liquidaciones", icon: Wallet },
  { label: "Mi Perfil", href: "/profesores/mi-perfil", icon: User },
];

export function InstructorSidebar() {
  const pathname = usePathname();
  const { data } = useMyInstructorProfile();
  const name = data?.instructor?.user?.name ?? "Profesor";
  const firstName = name.split(" ")[0];
  const tdLevel = data?.instructor?.tdLevel ?? "";

  return (
    <aside className="glass-sidebar flex h-screen w-[240px] flex-col">
      {/* Logo */}
      <div className="flex h-14 items-center border-b px-5" style={{borderColor: 'rgba(255,255,255,0.75)'}}>
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg" style={{background: 'linear-gradient(135deg, #6366f1, #8b5cf6)'}}>
            <Mountain className="h-4 w-4 text-white" />
          </div>
          <span className="text-[15px] font-bold text-[#0f172a] tracking-tight">
            Skicenter
          </span>
        </div>
      </div>

      {/* Profile card */}
      <div className="mx-3 mt-4 rounded-2xl bg-gradient-to-br from-[#E87B5A]/10 to-[#D4A853]/10 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#E87B5A]/20 text-[#E87B5A] font-bold text-sm">
            {firstName[0]}
          </div>
          <div>
            <p className="text-sm font-semibold text-[#2D2A26]">{firstName}</p>
            <p className="text-xs text-[#8A8580]">{tdLevel} · Profesor</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 pt-6">
        <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-widest text-[#8A8580]">
          Menu
        </p>
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                isActive
                  ? "glass-active-item text-[#0f172a]"
                  : "text-[#475569] hover:bg-white/50 hover:text-[#0f172a]"
              )}
            >
              <item.icon className={cn("h-5 w-5", isActive ? "text-[#6366f1]" : "text-[#475569]")} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="border-t p-3" style={{borderColor: 'rgba(255,255,255,0.75)'}}>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-[#475569] hover:bg-white/50 hover:text-[#dc2626] transition-all"
        >
          <LogOut className="h-5 w-5" />
          Cerrar sesion
        </button>
      </div>
    </aside>
  );
}
