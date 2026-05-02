"use client";

import { useState } from "react";
import { useFinanceReports } from "@/hooks/useFinance";
import { PageSkeleton } from "@/components/shared/LoadingSkeleton";
import { Download } from "lucide-react";
import ReportContent from "./ReportContent";

const GROUP_OPTIONS = [
  { value: "month", label: "Mes" },
  { value: "channel", label: "Canal" },
  { value: "product", label: "Producto" },
  { value: "category", label: "Categoria" },
  { value: "costCenter", label: "Centro de coste" },
] as const;

const inputCls =
  "rounded-[10px] border border-[#E8E4DE] px-3 py-2 text-sm text-[#2D2A26] focus:border-[#E87B5A] focus:outline-none focus:ring-1 focus:ring-[#E87B5A]";
const selectCls = inputCls;

type PresetKey = "thisMonth" | "lastMonth" | "thisQuarter" | "thisYear" | "custom";

const PRESETS: { key: PresetKey; label: string }[] = [
  { key: "thisMonth", label: "Este mes" },
  { key: "lastMonth", label: "Mes pasado" },
  { key: "thisQuarter", label: "Trimestre" },
  { key: "thisYear", label: "Ano" },
  { key: "custom", label: "Personalizado" },
];

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function rangeFromPreset(preset: PresetKey): { from: string; to: string } | null {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  if (preset === "thisMonth") {
    return { from: isoDate(new Date(y, m, 1)), to: isoDate(now) };
  }
  if (preset === "lastMonth") {
    return {
      from: isoDate(new Date(y, m - 1, 1)),
      to: isoDate(new Date(y, m, 0)),
    };
  }
  if (preset === "thisQuarter") {
    const qStart = Math.floor(m / 3) * 3;
    return { from: isoDate(new Date(y, qStart, 1)), to: isoDate(now) };
  }
  if (preset === "thisYear") {
    return { from: isoDate(new Date(y, 0, 1)), to: isoDate(now) };
  }
  return null;
}

function csvEscape(v: string | number): string {
  const s = String(v);
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function downloadCSV(filename: string, rows: string[][]) {
  const csv = rows.map((r) => r.map(csvEscape).join(",")).join("\n");
  const blob = new Blob([`﻿${csv}`], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export default function ReportsTab() {
  const year = new Date().getFullYear();
  const [from, setFrom] = useState(`${year}-01-01`);
  const [to, setTo] = useState(new Date().toISOString().slice(0, 10));
  const [groupBy, setGroupBy] = useState("month");
  const [preset, setPreset] = useState<PresetKey>("thisYear");

  const applyPreset = (p: PresetKey) => {
    setPreset(p);
    const r = rangeFromPreset(p);
    if (r) {
      setFrom(r.from);
      setTo(r.to);
    }
  };

  const { data, isLoading, error } = useFinanceReports(from, to, groupBy);

  const handleExportCSV = () => {
    if (!data) return;
    const rows: string[][] = [];
    rows.push(["Informe P&L", `${from} a ${to}`]);
    rows.push([]);
    rows.push(["Resumen"]);
    rows.push(["Ingresos totales", data.summary.totalRevenue.toFixed(2)]);
    rows.push(["Gastos totales", data.summary.totalExpenses.toFixed(2)]);
    rows.push(["Beneficio neto", data.summary.netProfit.toFixed(2)]);
    rows.push(["Margen %", data.summary.profitMargin.toFixed(2)]);
    rows.push([]);
    rows.push(["Ingresos por concepto", "Importe", "%"]);
    data.revenueByGroup.forEach((r) =>
      rows.push([r.label, r.amount.toFixed(2), r.percentage.toFixed(2)])
    );
    rows.push([]);
    rows.push(["Gastos por concepto", "Importe", "%"]);
    data.expensesByGroup.forEach((r) =>
      rows.push([r.label, r.amount.toFixed(2), r.percentage.toFixed(2)])
    );
    rows.push([]);
    rows.push(["Mes", "Ingresos", "Gastos", "Beneficio"]);
    data.monthlyTrend.forEach((m) =>
      rows.push([
        m.month,
        m.revenue.toFixed(2),
        m.expenses.toFixed(2),
        m.profit.toFixed(2),
      ])
    );
    downloadCSV(`informe-pl-${from}-${to}.csv`, rows);
  };

  return (
    <div className="space-y-6">
      <div className="glass-card p-5 space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.key}
              onClick={() => applyPreset(p.key)}
              className={`rounded-[10px] border px-3 py-1.5 text-sm font-medium transition-colors ${
                preset === p.key
                  ? "border-[#E87B5A] bg-[#E87B5A]/10 text-[#E87B5A]"
                  : "border-[#E8E4DE] text-[#8A8580] hover:bg-[#FAF9F7]"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-[#8A8580]">
              Desde
            </label>
            <input
              type="date"
              value={from}
              onChange={(e) => {
                setFrom(e.target.value);
                setPreset("custom");
              }}
              className={inputCls}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-[#8A8580]">
              Hasta
            </label>
            <input
              type="date"
              value={to}
              onChange={(e) => {
                setTo(e.target.value);
                setPreset("custom");
              }}
              className={inputCls}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-[#8A8580]">
              Agrupar por
            </label>
            <select
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value)}
              className={selectCls}
            >
              {GROUP_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={handleExportCSV}
            disabled={!data}
            className="ml-auto flex items-center gap-2 rounded-[10px] border border-[#E8E4DE] px-4 py-2 text-sm font-medium text-[#2D2A26] hover:bg-[#FAF9F7] disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            Exportar CSV
          </button>
        </div>
      </div>

      {isLoading && <PageSkeleton />}
      {error && (
        <div className="glass-card p-8 text-center text-[#8A8580]">
          Error al cargar el informe
        </div>
      )}
      {data && <ReportContent data={data} />}
    </div>
  );
}
