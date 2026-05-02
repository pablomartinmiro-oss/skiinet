"use client";

import { useState, useEffect } from "react";
import { LogIn, LogOut } from "lucide-react";
import type { TimeEntry } from "@/hooks/useInstructors";
import { useClockIn, useClockOut } from "@/hooks/useInstructors";
import { getCurrentCoords } from "@/lib/geo/browser";
import { toast } from "sonner";

interface Props {
  instructorId: string;
  entries: TimeEntry[];
}

export default function ClockWidget({ instructorId, entries }: Props) {
  const [elapsed, setElapsed] = useState("");
  const clockInMutation = useClockIn();
  const clockOutMutation = useClockOut();

  const today = new Date().toISOString().split("T")[0];
  const openEntry = entries.find(
    (e) => e.instructorId === instructorId && e.date.startsWith(today) && !e.clockOut
  );

  useEffect(() => {
    if (!openEntry) { setElapsed(""); return; }
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
    try {
      const coords = await getCurrentCoords();
      await clockInMutation.mutateAsync({
        instructorId,
        source: "mobile",
        geoLat: coords?.lat ?? null,
        geoLon: coords?.lon ?? null,
      });
      toast.success(coords ? "Fichaje de entrada registrado · ubicación capturada" : "Fichaje de entrada registrado");
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
      toast.success(coords ? "Fichaje de salida registrado · ubicación capturada" : "Fichaje de salida registrado");
    } catch {
      toast.error("Error al fichar salida");
    }
  };

  return (
    <div className="flex w-full flex-col items-stretch gap-3 sm:w-auto sm:flex-row sm:items-center sm:gap-4">
      {openEntry && (
        <div className="text-center sm:text-right">
          <p className="text-xs text-white/50">En jornada</p>
          <p className="text-3xl font-bold tabular-nums tracking-tight sm:text-2xl">{elapsed}</p>
        </div>
      )}

      {openEntry ? (
        <button
          onClick={handleClockOut}
          disabled={clockOutMutation.isPending}
          className="flex min-h-[56px] w-full items-center justify-center gap-2 rounded-xl bg-white/10 backdrop-blur px-5 py-4 text-base font-semibold text-white border border-white/20 hover:bg-white/20 active:scale-[0.99] transition-all disabled:opacity-50 sm:w-auto sm:min-h-[44px] sm:py-3 sm:text-sm"
        >
          <LogOut className="h-5 w-5 sm:h-4 sm:w-4" />
          {clockOutMutation.isPending ? "..." : "Fichar Salida"}
        </button>
      ) : (
        <button
          onClick={handleClockIn}
          disabled={clockInMutation.isPending}
          className="flex min-h-[56px] w-full items-center justify-center gap-2 rounded-xl bg-[#5B8C6D] px-5 py-4 text-base font-semibold text-white hover:bg-[#4a7359] active:scale-[0.99] transition-all disabled:opacity-50 shadow-lg sm:w-auto sm:min-h-[44px] sm:py-3 sm:text-sm"
        >
          <LogIn className="h-5 w-5 sm:h-4 sm:w-4" />
          {clockInMutation.isPending ? "..." : "Fichar Entrada"}
        </button>
      )}
    </div>
  );
}
