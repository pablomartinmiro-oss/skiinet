"use client";

import { Users, TrendingUp, CalendarCheck, UserPlus } from "lucide-react";
import type { ClientStats } from "@/hooks/useClients";

const EUR = new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });

export function StatsCards({ stats }: { stats: ClientStats | undefined }) {
  const items = [
    {
      label: "Total Clientes",
      value: stats ? stats.totalClients.toLocaleString("es-ES") : "—",
      icon: Users,
      color: "#E87B5A",
    },
    {
      label: "Gasto Medio",
      value: stats ? EUR.format((stats.avgSpent ?? 0) / 100) : "—",
      icon: TrendingUp,
      color: "#5B8C6D",
    },
    {
      label: "Visitas Totales",
      value: stats ? stats.totalVisits.toLocaleString("es-ES") : "—",
      icon: CalendarCheck,
      color: "#D4A853",
    },
    {
      label: "Nuevos Este Mes",
      value: stats ? stats.newThisMonth.toLocaleString("es-ES") : "—",
      icon: UserPlus,
      color: "#7C9CB8",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {items.map((it) => {
        const Icon = it.icon;
        return (
          <div
            key={it.label}
            className="glass-card p-4 hover-lift"
          >
            <div className="flex items-center gap-2 mb-2">
              <div
                className="flex h-8 w-8 items-center justify-center rounded-lg"
                style={{ backgroundColor: `${it.color}1A` }}
              >
                <Icon className="h-4 w-4" style={{ color: it.color }} />
              </div>
              <span className="text-xs font-medium text-[#8A8580]">{it.label}</span>
            </div>
            <p className="text-xl font-bold text-[#2D2A26]">{it.value}</p>
          </div>
        );
      })}
    </div>
  );
}
