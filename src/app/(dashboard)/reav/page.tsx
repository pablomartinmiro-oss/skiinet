"use client";

import { Scale } from "lucide-react";
import { useReavExpedients } from "@/hooks/useReav";
import ExpedientsTable from "./_components/ExpedientsTable";

const fmtEUR = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
});

interface StatTileProps {
  label: string;
  value: string;
}

function StatTile({ label, value }: StatTileProps) {
  return (
    <div className="glass-card p-5 flex flex-col gap-1">
      <span className="text-xs font-medium text-[#8A8580] uppercase tracking-wider">
        {label}
      </span>
      <span className="text-2xl font-bold text-[#2D2A26] leading-tight">
        {value}
      </span>
    </div>
  );
}

export default function ReavPage() {
  const { data } = useReavExpedients();
  const expedients = data?.expedients ?? [];

  const totalCount = expedients.length;
  const totalBase = expedients.reduce((acc, e) => acc + e.taxableBase, 0);
  // Approximate: sum all taxableBase as "importe pendiente" since invoice payment
  // status is not available in the expedient payload without a separate fetch.
  const pendingAmount = totalBase;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Scale className="h-6 w-6 text-[#E87B5A]" />
        <h1 className="text-2xl font-bold text-[#2D2A26]">
          REAV — Régimen Especial Agencias de Viajes
        </h1>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatTile
          label="Total expedientes"
          value={totalCount.toString()}
        />
        <StatTile
          label="Importe pendiente"
          value={fmtEUR.format(pendingAmount)}
        />
        <StatTile
          label="Base imponible total"
          value={fmtEUR.format(totalBase)}
        />
      </div>

      <ExpedientsTable />
    </div>
  );
}
