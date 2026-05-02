"use client";

import { useState, useEffect } from "react";
import { LogIn, LogOut } from "lucide-react";
import type { Instructor, TimeEntry } from "@/hooks/useInstructors";
import { useClockIn, useClockOut } from "@/hooks/useInstructors";
import { getCurrentCoords } from "@/lib/geo/browser";
import { toast } from "sonner";

interface Props {
  instructors: Instructor[];
  entries: TimeEntry[];
  autoSelectId?: string;
}

export default function ClockInOutWidget({ instructors, entries, autoSelectId }: Props) {
  const [selectedId, setSelectedId] = useState(autoSelectId ?? "");

  // Auto-select when autoSelectId arrives
  useEffect(() => {
    if (autoSelectId && !selectedId) setSelectedId(autoSelectId);
  }, [autoSelectId, selectedId]);
  const [elapsed, setElapsed] = useState("");
  const clockInMutation = useClockIn();
  const clockOutMutation = useClockOut();

  // Find open entry for selected instructor
  const today = new Date().toISOString().split("T")[0];
  const openEntry = selectedId
    ? entries.find(
        (e) =>
          e.instructorId === selectedId &&
          e.date.startsWith(today) &&
          !e.clockOut
      )
    : null;

  // Live timer
  useEffect(() => {
    if (!openEntry) {
      setElapsed("");
      return;
    }
    const tick = () => {
      const diff = Date.now() - new Date(openEntry.clockIn).getTime();
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setElapsed(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`);
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [openEntry]);

  const handleClockIn = async () => {
    if (!selectedId) {
      toast.error("Selecciona un profesor");
      return;
    }
    try {
      const coords = await getCurrentCoords();
      await clockInMutation.mutateAsync({
        instructorId: selectedId,
        source: "mobile",
        geoLat: coords?.lat ?? null,
        geoLon: coords?.lon ?? null,
      });
      toast.success(coords ? "Entrada fichada · ubicación capturada" : "Entrada fichada correctamente");
    } catch {
      toast.error("Error al fichar entrada");
    }
  };

  const handleClockOut = async () => {
    if (!openEntry) return;
    try {
      const coords = await getCurrentCoords();
      await clockOutMutation.mutateAsync({
        entryId: openEntry.id,
        breakMinutes: 0,
        clockOutLat: coords?.lat ?? null,
        clockOutLon: coords?.lon ?? null,
      });
      toast.success(coords ? "Salida fichada · ubicación capturada" : "Salida fichada correctamente");
    } catch {
      toast.error("Error al fichar salida");
    }
  };

  const selectClass =
    "w-full rounded-[10px] border border-[#E8E4DE] bg-white px-3 py-2.5 text-sm text-[#2D2A26] focus:border-[#E87B5A] focus:outline-none focus:ring-1 focus:ring-[#E87B5A]";

  return (
    <div className="rounded-2xl border border-[#E8E4DE] bg-white p-6">
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-end sm:gap-6">
        {/* Instructor selector */}
        <div className="w-full sm:w-64">
          <label className="block text-xs font-medium text-[#8A8580] mb-1">Profesor</label>
          <select value={selectedId} onChange={(e) => setSelectedId(e.target.value)} className={selectClass}>
            <option value="">Seleccionar profesor...</option>
            {instructors.map((i) => (
              <option key={i.id} value={i.id}>{i.user.name ?? i.user.email}</option>
            ))}
          </select>
        </div>

        {/* Timer display */}
        {openEntry && (
          <div className="text-center">
            <p className="text-xs font-medium text-[#8A8580]">Tiempo en jornada</p>
            <p className="text-3xl font-bold tabular-nums text-[#2D2A26]">{elapsed}</p>
          </div>
        )}

        {/* Clock buttons */}
        <div className="flex gap-3">
          {openEntry ? (
            <button
              onClick={handleClockOut}
              disabled={clockOutMutation.isPending}
              className="flex items-center gap-2 rounded-[10px] bg-[#C75D4A] px-6 py-3 text-sm font-medium text-white hover:bg-[#b5523f] transition-colors disabled:opacity-50"
            >
              <LogOut className="h-4 w-4" />
              {clockOutMutation.isPending ? "Fichando..." : "Fichar Salida"}
            </button>
          ) : (
            <button
              onClick={handleClockIn}
              disabled={clockInMutation.isPending || !selectedId}
              className="flex items-center gap-2 rounded-[10px] bg-[#5B8C6D] px-6 py-3 text-sm font-medium text-white hover:bg-[#4a7359] transition-colors disabled:opacity-50"
            >
              <LogIn className="h-4 w-4" />
              {clockInMutation.isPending ? "Fichando..." : "Fichar Entrada"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
