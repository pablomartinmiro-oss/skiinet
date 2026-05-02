"use client";

import { Lock, MapPin } from "lucide-react";
import type { TimeEntry } from "@/hooks/useInstructors";

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
}

function formatMinutes(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${h}h ${m}m`;
}

interface Props {
  entries: TimeEntry[];
}

export default function TimeEntryTable({ entries }: Props) {
  if (entries.length === 0) {
    return (
      <div className="rounded-2xl border border-[#E8E4DE] bg-white p-8 text-center">
        <p className="text-sm text-[#8A8580]">No hay fichajes en este periodo</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-[#E8E4DE] bg-white">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[#E8E4DE] bg-[#FAF9F7]">
            <th className="px-4 py-3 text-left font-medium text-[#8A8580]">Profesor</th>
            <th className="px-4 py-3 text-left font-medium text-[#8A8580]">Fecha</th>
            <th className="px-4 py-3 text-left font-medium text-[#8A8580]">Entrada</th>
            <th className="px-4 py-3 text-left font-medium text-[#8A8580]">Salida</th>
            <th className="px-4 py-3 text-right font-medium text-[#8A8580]">Horas netas</th>
            <th className="px-4 py-3 text-center font-medium text-[#8A8580]">Estado</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => (
            <tr key={entry.id} className="border-b border-[#E8E4DE] last:border-0">
              <td className="px-4 py-3 font-medium text-[#2D2A26]">
                {entry.instructor.user.name ?? entry.instructor.user.email}
                {entry.correctionOf && (
                  <span className="ml-2 rounded-md bg-[#D4A853]/15 px-1.5 py-0.5 text-xs text-[#D4A853]">
                    Correccion
                  </span>
                )}
              </td>
              <td className="px-4 py-3 text-[#2D2A26]">
                {new Date(entry.date).toLocaleDateString("es-ES")}
              </td>
              <td className="px-4 py-3 text-[#2D2A26]">
                <div className="flex items-center gap-1.5">
                  {formatTime(entry.clockIn)}
                  {(entry.geoLat != null && entry.geoLon != null) && (
                    <span
                      title={`Ubicación: ${entry.geoLat.toFixed(5)}, ${entry.geoLon.toFixed(5)}`}
                      className="inline-flex items-center gap-0.5 rounded-md bg-[#5B8C6D]/15 px-1.5 py-0.5 text-[10px] font-medium text-[#5B8C6D]"
                    >
                      <MapPin className="h-2.5 w-2.5" />
                      Con ubicación
                    </span>
                  )}
                </div>
              </td>
              <td className="px-4 py-3 text-[#2D2A26]">
                {entry.clockOut ? (
                  <div className="flex items-center gap-1.5">
                    {formatTime(entry.clockOut)}
                    {(entry.clockOutLat != null && entry.clockOutLon != null) && (
                      <span
                        title={`Ubicación: ${entry.clockOutLat.toFixed(5)}, ${entry.clockOutLon.toFixed(5)}`}
                        className="inline-flex items-center gap-0.5 rounded-md bg-[#5B8C6D]/15 px-1.5 py-0.5 text-[10px] font-medium text-[#5B8C6D]"
                      >
                        <MapPin className="h-2.5 w-2.5" />
                        Con ubicación
                      </span>
                    )}
                  </div>
                ) : (
                  <span className="rounded-md bg-[#5B8C6D]/15 px-2 py-0.5 text-xs font-medium text-[#5B8C6D]">
                    En jornada
                  </span>
                )}
              </td>
              <td className="px-4 py-3 text-right font-medium text-[#2D2A26]">
                {entry.clockOut ? formatMinutes(entry.netMinutes) : "—"}
              </td>
              <td className="px-4 py-3 text-center">
                {entry.lockedAt ? (
                  <span className="inline-flex items-center gap-1 rounded-md bg-[#8A8580]/15 px-2 py-0.5 text-xs font-medium text-[#8A8580]">
                    <Lock className="h-3 w-3" />
                    Bloqueado
                  </span>
                ) : entry.clockOut ? (
                  <span className="rounded-md bg-[#5B8C6D]/15 px-2 py-0.5 text-xs font-medium text-[#5B8C6D]">
                    Completado
                  </span>
                ) : (
                  <span className="rounded-md bg-[#D4A853]/15 px-2 py-0.5 text-xs font-medium text-[#D4A853]">
                    Abierto
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
