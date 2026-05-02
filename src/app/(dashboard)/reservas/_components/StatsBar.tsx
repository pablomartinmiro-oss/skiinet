"use client";

import type { ReservationStats } from "@/hooks/useReservations";
import { getStationLabel } from "./constants";

interface StatsBarProps {
  stats: ReservationStats | undefined;
  loading: boolean;
}

export function StatsBar({ stats, loading }: StatsBarProps) {
  if (loading || !stats) {
    return (
      <div className="flex items-center gap-4 glass-card px-5 py-3">
        <div className="h-5 w-64 animate-pulse rounded bg-gray-200" />
        <div className="h-5 w-48 animate-pulse rounded bg-gray-200" />
      </div>
    );
  }

  const { today, stationCapacity } = stats;

  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 glass-card px-5 py-3">
      <div className="flex items-center gap-2 text-sm font-medium text-slate-900">
        <span>Hoy:</span>
        <span className="text-green-700">{today.confirmed} confirmadas</span>
        <span className="text-warm-border">|</span>
        <span className="text-muted-red">{today.noAvailability} sin disponibilidad</span>
        <span className="text-warm-border">|</span>
        <span className="text-amber-700">{today.pending} pendientes</span>
        <span className="text-gray-400">|</span>
        <span className="font-semibold">Total: {today.total}</span>
      </div>

      {Object.entries(stationCapacity).length > 0 && (
        <div className="flex items-center gap-3 border-l border-border pl-4 text-xs text-slate-500">
          {Object.entries(stationCapacity).map(([station, cap]) => (
            <span key={station} className={cap.booked >= cap.max ? "text-muted-red font-medium" : ""}>
              {getStationLabel(station)}: {cap.booked}/{cap.max} cursillos
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
