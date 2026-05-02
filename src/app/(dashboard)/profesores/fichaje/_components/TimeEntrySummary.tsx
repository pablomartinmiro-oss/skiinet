"use client";

import { Clock, Users, AlertTriangle } from "lucide-react";
import type { TimeEntry } from "@/hooks/useInstructors";

interface Props {
  entries: TimeEntry[];
}

export default function TimeEntrySummary({ entries }: Props) {
  // A fichaje is COMPLETO when it has clockIn AND clockOut.
  // ABIERTO  when it has clockIn but NOT clockOut.
  // These are mutually exclusive partitions of `entries` — the previous label
  // ("X fichajes completos" buried under "Horas totales") + a second card
  // titled "Fichajes abiertos" made it look like the same number was counted
  // twice. Each card now states the partition explicitly.
  const completedEntries = entries.filter((e) => e.clockIn && e.clockOut);
  const openEntries = entries.filter((e) => e.clockIn && !e.clockOut);
  const lockedEntries = entries.filter((e) => e.lockedAt);
  const totalNetMinutes = completedEntries.reduce((s, e) => s + e.netMinutes, 0);
  const totalHours = (totalNetMinutes / 60).toFixed(1);
  const uniqueInstructors = new Set(entries.map((e) => e.instructorId)).size;

  const cards = [
    {
      icon: Clock,
      label: "Horas registradas",
      value: `${totalHours}h`,
      sub: `${completedEntries.length} fichaje${completedEntries.length === 1 ? "" : "s"} completo${completedEntries.length === 1 ? "" : "s"} (con entrada y salida)`,
      color: "#E87B5A",
    },
    {
      icon: Users,
      label: "Profesores con fichajes",
      value: String(uniqueInstructors),
      sub: `${lockedEntries.length} bloqueado${lockedEntries.length === 1 ? "" : "s"}`,
      color: "#5B8C6D",
    },
    {
      icon: AlertTriangle,
      label: "Fichajes abiertos",
      value: String(openEntries.length),
      sub: openEntries.length > 0 ? "Con entrada pero sin salida" : "Todo en orden",
      color: openEntries.length > 0 ? "#D4A853" : "#8A8580",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {cards.map((card) => (
        <div key={card.label} className="rounded-2xl border border-[#E8E4DE] bg-white p-4">
          <div className="flex items-center gap-2">
            <card.icon className="h-4 w-4" style={{ color: card.color }} />
            <span className="text-xs font-medium text-[#8A8580]">{card.label}</span>
          </div>
          <p className="mt-2 text-2xl font-bold text-[#2D2A26]">{card.value}</p>
          <p className="text-xs text-[#8A8580]">{card.sub}</p>
        </div>
      ))}
    </div>
  );
}
