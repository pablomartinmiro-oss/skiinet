"use client";

import { useState, useMemo, useCallback } from "react";
import { Search, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Reservation } from "@/hooks/useReservations";
import { STATIONS, STATUS_CONFIG, SOURCE_CONFIG, formatDate, formatEUR, getStationLabel } from "./constants";
import { Badge } from "@/components/ui/badge";
import { exportToCSV } from "@/lib/export/csv";

interface ReservationListProps {
  reservations: Reservation[] | undefined;
  loading: boolean;
  selectedId: string | null;
  onSelect: (id: string) => void;
  emptyLabel?: string;
}

const DATE_FILTERS = [
  { value: "hoy", label: "Hoy" },
  { value: "manana", label: "Mañana" },
  { value: "semana", label: "Esta semana" },
  { value: "mes", label: "Este mes" },
  { value: "todas", label: "Todas" },
] as const;

const STATUS_FILTERS = [
  { value: "todas", label: "Todas" },
  { value: "pendiente", label: "Pendientes" },
  { value: "confirmada", label: "Confirmadas" },
  { value: "sin_disponibilidad", label: "Sin disp." },
  { value: "cancelada", label: "Canceladas" },
] as const;

function getDateRange(filter: string): { from: Date; to: Date } | null {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  switch (filter) {
    case "hoy":
      return { from: today, to: tomorrow };
    case "manana": {
      const dayAfter = new Date(tomorrow);
      dayAfter.setDate(dayAfter.getDate() + 1);
      return { from: tomorrow, to: dayAfter };
    }
    case "semana": {
      const weekEnd = new Date(today);
      weekEnd.setDate(weekEnd.getDate() + (7 - weekEnd.getDay()));
      return { from: today, to: weekEnd };
    }
    case "mes": {
      const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 1);
      return { from: today, to: monthEnd };
    }
    default:
      return null;
  }
}

const RESERVATION_CSV_COLUMNS = [
  { key: "activityDate", label: "Fecha", format: (v: unknown) => new Date(v as string).toLocaleDateString("es-ES") },
  { key: "clientName", label: "Cliente" },
  { key: "clientEmail", label: "Email" },
  { key: "clientPhone", label: "Teléfono" },
  { key: "station", label: "Estación", format: (v: unknown) => getStationLabel(v as string) },
  { key: "status", label: "Estado", format: (v: unknown) => STATUS_CONFIG[v as keyof typeof STATUS_CONFIG]?.label ?? String(v) },
  { key: "totalPrice", label: "Importe", format: (v: unknown) => (v as number).toFixed(2) },
  { key: "couponCode", label: "Cupón", format: (v: unknown) => String(v ?? "") },
] as const;

export function ReservationList({ reservations, loading, selectedId, onSelect, emptyLabel }: ReservationListProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("todas");
  const [dateFilter, setDateFilter] = useState("hoy");
  const [stationFilter, setStationFilter] = useState("todas");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");

  const filtered = useMemo(() => {
    if (!reservations) return [];
    let list = reservations;

    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (r) =>
          r.clientName.toLowerCase().includes(q) ||
          r.clientEmail.toLowerCase().includes(q) ||
          r.clientPhone.includes(q) ||
          (r.couponCode && r.couponCode.toLowerCase().includes(q))
      );
    }

    if (statusFilter !== "todas") {
      list = list.filter((r) => r.status === statusFilter);
    }

    if (stationFilter !== "todas") {
      list = list.filter((r) => r.station === stationFilter);
    }

    if (dateFilter === "custom") {
      if (customFrom) {
        const from = new Date(customFrom);
        list = list.filter((r) => new Date(r.activityDate) >= from);
      }
      if (customTo) {
        const to = new Date(customTo);
        to.setDate(to.getDate() + 1);
        list = list.filter((r) => new Date(r.activityDate) < to);
      }
    } else {
      const dateRange = getDateRange(dateFilter);
      if (dateRange) {
        list = list.filter((r) => {
          const d = new Date(r.activityDate);
          return d >= dateRange.from && d < dateRange.to;
        });
      }
    }

    return list;
  }, [reservations, search, statusFilter, dateFilter, stationFilter, customFrom, customTo]);

  const handleExportCsv = useCallback(() => {
    exportToCSV(
      filtered as unknown as Record<string, unknown>[],
      `reservas-${new Date().toISOString().slice(0, 10)}.csv`,
      RESERVATION_CSV_COLUMNS as unknown as { key: string; label: string; format?: (v: unknown) => string }[]
    );
  }, [filtered]);

  if (loading) {
    return (
      <div className="flex h-full flex-col gap-3 p-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-20 animate-pulse rounded-lg bg-gray-100" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Search */}
      <div className="border-b border-border p-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar reservas..."
            className="w-full rounded-lg border border-border bg-white py-2 pl-9 pr-3 text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Date filters */}
      <div className="flex flex-wrap gap-1 border-b border-border px-3 py-2">
        {DATE_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setDateFilter(f.value)}
            className={cn(
              "shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors",
              dateFilter === f.value
                ? "bg-coral text-white"
                : "bg-slate-100 text-slate-500 hover:bg-warm-border"
            )}
          >
            {f.label}
          </button>
        ))}
        <button
          onClick={() => setDateFilter("custom")}
          className={cn(
            "shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors",
            dateFilter === "custom"
              ? "bg-coral text-white"
              : "bg-slate-100 text-slate-500 hover:bg-warm-border"
          )}
        >
          Rango
        </button>
      </div>

      {/* Custom date range */}
      {dateFilter === "custom" && (
        <div className="flex gap-2 border-b border-border px-3 py-2">
          <input
            type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)}
            className="flex-1 rounded-lg border border-border bg-white px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <span className="self-center text-xs text-slate-500">—</span>
          <input
            type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)}
            className="flex-1 rounded-lg border border-border bg-white px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      )}

      {/* Status + station filters */}
      <div className="flex flex-wrap gap-1 border-b border-border px-3 py-2">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setStatusFilter(f.value)}
            className={cn(
              "rounded-full px-2.5 py-1 text-xs font-medium transition-colors",
              statusFilter === f.value
                ? "bg-coral text-white"
                : "bg-slate-100 text-slate-500 hover:bg-warm-border"
            )}
          >
            {f.label}
          </button>
        ))}
        <select
          value={stationFilter}
          onChange={(e) => setStationFilter(e.target.value)}
          className="ml-auto rounded-lg border border-border bg-white px-2 py-1 text-xs text-slate-500"
        >
          <option value="todas">Todas estaciones</option>
          {STATIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="flex h-32 items-center justify-center text-sm text-slate-500">
            {emptyLabel ?? "No se encontraron reservas"}
          </div>
        ) : (
          <div className="space-y-1 p-2">
            {filtered.map((r) => {
              const statusCfg = STATUS_CONFIG[r.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.pendiente;
              const sourceCfg = SOURCE_CONFIG[r.source as keyof typeof SOURCE_CONFIG];

              return (
                <button
                  key={r.id}
                  onClick={() => onSelect(r.id)}
                  className={cn(
                    "w-full rounded-lg border p-3 text-left transition-colors",
                    selectedId === r.id
                      ? "border-blue-500 bg-blue-50"
                      : "border-transparent bg-white hover:bg-slate-100/50"
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        {sourceCfg && <span className="text-sm">{sourceCfg.icon}</span>}
                        <span className="truncate text-sm font-medium text-slate-900">
                          {r.clientName}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                        <span>{formatDate(r.activityDate)}</span>
                        <span>·</span>
                        <span>{getStationLabel(r.station)}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge className={cn("text-[10px]", statusCfg.color)}>
                        {statusCfg.label}
                      </Badge>
                      <span className="text-xs font-medium text-slate-900">
                        {formatEUR(r.totalPrice)}
                      </span>
                    </div>
                  </div>
                  {r.quoteId && r.quote && (
                    <div className="mt-1 text-[10px] text-coral">
                      Presupuesto #{r.quote.id.slice(-4).toUpperCase()}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Count + Export */}
      <div className="flex items-center justify-between border-t border-border px-3 py-2">
        <span className="text-xs text-slate-500">
          {filtered.length} de {reservations?.length ?? 0} reservas
        </span>
        <button onClick={handleExportCsv} className="flex items-center gap-1 rounded px-2 py-1 text-xs text-slate-500 hover:text-blue-600 hover:bg-slate-100 transition-colors">
          <Download className="h-3 w-3" /> CSV
        </button>
      </div>
    </div>
  );
}
