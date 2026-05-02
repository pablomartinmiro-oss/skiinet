"use client";

import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Activity,
  Euro,
  AlertTriangle,
  Wrench,
  PackageCheck,
} from "lucide-react";
import { useRentalDashboard } from "@/hooks/useRental";

const fmt = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
});

const dayShort = new Intl.DateTimeFormat("es-ES", { weekday: "short" });
const timeFmt = new Intl.DateTimeFormat("es-ES", {
  hour: "2-digit",
  minute: "2-digit",
});

const EQUIP_LABELS: Record<string, string> = {
  SKI: "Esquis",
  BOOT: "Botas",
  POLE: "Bastones",
  HELMET: "Casco",
  SNOWBOARD: "Snowboard",
  SNOWBOARD_BOOT: "Botas Snow",
};

const STATIONS: Record<string, string> = {
  baqueira: "Baqueira Beret",
  sierra_nevada: "Sierra Nevada",
  la_pinilla: "La Pinilla",
};

const STATUS_LABELS: Record<string, string> = {
  RESERVED: "Reservado",
  PREPARED: "Preparado",
  PICKED_UP: "Recogido",
  IN_USE: "En uso",
};

export default function PanelTab() {
  const { data, isLoading } = useRentalDashboard();

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-[#E8E4DE] rounded-[16px]" />
          ))}
        </div>
        <div className="h-48 bg-[#E8E4DE] rounded-[16px]" />
      </div>
    );
  }

  if (!data) return null;

  const stats = [
    {
      label: "Equipos Disponibles",
      value: data.availableUnits,
      icon: PackageCheck,
      color: "#5B8C6D",
    },
    {
      label: "Alquilados Hoy",
      value: data.pickupsToday,
      icon: ArrowDownToLine,
      color: "#D4A853",
    },
    {
      label: "Pendientes Devolución",
      value: data.returnsToday,
      icon: ArrowUpFromLine,
      color: "#E87B5A",
    },
    {
      label: "En Mantenimiento",
      value: data.maintenanceCount,
      icon: Wrench,
      color: "#8A8580",
    },
  ];

  const secondary = [
    {
      label: "Alquileres Activos",
      value: data.activeRentals,
      icon: Activity,
      color: "#E87B5A",
    },
    {
      label: "Ingresos Hoy",
      value: fmt.format(data.revenueToday),
      icon: Euro,
      color: "#5B8C6D",
    },
  ];

  const maxCount = Math.max(...data.last7Days.map((d) => d.count), 1);

  return (
    <div className="space-y-6">
      {/* Primary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div
              key={s.label}
              className="glass-card p-4"
            >
              <div className="flex items-center gap-3">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-[10px]"
                  style={{ backgroundColor: `${s.color}26` }}
                >
                  <Icon className="h-5 w-5" style={{ color: s.color }} />
                </div>
                <div>
                  <p className="text-xs text-[#8A8580]">{s.label}</p>
                  <p className="text-xl font-bold text-[#2D2A26]">{s.value}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Secondary stats */}
      <div className="grid grid-cols-2 gap-4">
        {secondary.map((s) => {
          const Icon = s.icon;
          return (
            <div
              key={s.label}
              className="glass-card p-4"
            >
              <div className="flex items-center gap-3">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-[10px]"
                  style={{ backgroundColor: `${s.color}26` }}
                >
                  <Icon className="h-5 w-5" style={{ color: s.color }} />
                </div>
                <div>
                  <p className="text-xs text-[#8A8580]">{s.label}</p>
                  <p className="text-xl font-bold text-[#2D2A26]">{s.value}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 7-day pickup chart (inline SVG) */}
      <div className="glass-card p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-[#2D2A26]">
            Alquileres por día (últimos 7 días)
          </h3>
          <span className="text-xs text-[#8A8580]">
            Total:{" "}
            {data.last7Days.reduce((sum, d) => sum + d.count, 0)} recogidas
          </span>
        </div>
        <div className="flex items-end gap-2 h-40 px-2">
          {data.last7Days.map((d) => {
            const heightPct = (d.count / maxCount) * 100;
            const date = new Date(d.date);
            return (
              <div
                key={d.date}
                className="flex-1 flex flex-col items-center gap-1"
              >
                <span className="text-xs font-medium text-[#2D2A26]">
                  {d.count > 0 ? d.count : ""}
                </span>
                <div className="w-full flex-1 flex items-end">
                  <div
                    className="w-full rounded-t-[6px] bg-gradient-to-t from-[#E87B5A] to-[#F09B7E] transition-all"
                    style={{ height: `${heightPct}%`, minHeight: d.count > 0 ? "4px" : "2px" }}
                  />
                </div>
                <span className="text-xs text-[#8A8580] capitalize">
                  {dayShort.format(date).replace(".", "")}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Upcoming returns */}
      <div className="rounded-[16px] border border-[#E8E4DE] bg-white">
        <div className="border-b border-[#E8E4DE] px-4 py-3">
          <h3 className="text-sm font-semibold text-[#2D2A26]">
            Próximas Devoluciones (hoy + mañana)
          </h3>
        </div>
        {data.upcomingReturns.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-[#8A8580]">
            Sin devoluciones programadas
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#E8E4DE] text-left text-[#8A8580]">
                <th className="px-4 py-2 font-medium">Cliente</th>
                <th className="px-4 py-2 font-medium">Estación</th>
                <th className="px-4 py-2 font-medium">Devolución</th>
                <th className="px-4 py-2 font-medium">Estado</th>
                <th className="px-4 py-2 font-medium text-right">Depósito</th>
              </tr>
            </thead>
            <tbody>
              {data.upcomingReturns.map((r) => {
                const date = new Date(r.returnDate);
                const isToday =
                  new Date().toDateString() === date.toDateString();
                return (
                  <tr
                    key={r.id}
                    className="border-b border-[#E8E4DE] last:border-0"
                  >
                    <td className="px-4 py-2 font-medium text-[#2D2A26]">
                      {r.clientName}
                    </td>
                    <td className="px-4 py-2 text-[#8A8580]">
                      {STATIONS[r.stationSlug] ?? r.stationSlug}
                    </td>
                    <td className="px-4 py-2">
                      <span
                        className={`text-xs ${isToday ? "text-[#E87B5A] font-medium" : "text-[#2D2A26]"}`}
                      >
                        {isToday ? "Hoy" : "Mañana"}{" "}
                        {timeFmt.format(date)}
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      <span className="inline-flex rounded-[6px] bg-[#E8E4DE] px-2 py-0.5 text-xs text-[#2D2A26]">
                        {STATUS_LABELS[r.status] ?? r.status}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-right text-[#2D2A26]">
                      {r.depositCents > 0
                        ? fmt.format(r.depositCents / 100)
                        : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Low stock alerts */}
      {data.lowStockAlerts.length > 0 && (
        <div className="rounded-[16px] border border-[#D4A853]/30 bg-[#D4A853]/5 p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="h-5 w-5 text-[#D4A853]" />
            <h3 className="text-sm font-semibold text-[#2D2A26]">
              Alertas de Stock Bajo
            </h3>
          </div>
          <div className="space-y-2">
            {data.lowStockAlerts.map((alert, i) => (
              <div
                key={i}
                className="flex items-center justify-between text-sm"
              >
                <span className="text-[#2D2A26]">
                  {EQUIP_LABELS[alert.equipmentType] ?? alert.equipmentType}{" "}
                  — Talla {alert.size} ({alert.qualityTier}) en{" "}
                  {STATIONS[alert.stationSlug] ?? alert.stationSlug}
                </span>
                <span className="font-medium text-[#C75D4A]">
                  {alert.availableQuantity} disponibles
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Completed today */}
      {data.completedToday > 0 && (
        <div className="glass-card p-4">
          <p className="text-sm text-[#8A8580]">
            Completados hoy:{" "}
            <span className="font-semibold text-[#5B8C6D]">
              {data.completedToday} pedidos
            </span>
          </p>
        </div>
      )}
    </div>
  );
}
