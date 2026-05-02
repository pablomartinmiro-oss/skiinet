"use client";

import { FileBarChart } from "lucide-react";

const fmt = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
});

const MONTH_NAMES: Record<string, string> = {
  "01": "Enero", "02": "Febrero", "03": "Marzo", "04": "Abril",
  "05": "Mayo", "06": "Junio", "07": "Julio", "08": "Agosto",
  "09": "Septiembre", "10": "Octubre", "11": "Noviembre", "12": "Diciembre",
};

function formatMonth(ym: string): string {
  const [year, month] = ym.split("-");
  return `${MONTH_NAMES[month] ?? month} ${year}`;
}

export interface ReportData {
  summary: {
    totalRevenue: number;
    totalExpenses: number;
    netProfit: number;
    profitMargin: number;
  };
  revenueByGroup: { label: string; amount: number; percentage: number }[];
  expensesByGroup: { label: string; amount: number; percentage: number }[];
  monthlyTrend: {
    month: string;
    revenue: number;
    expenses: number;
    profit: number;
  }[];
}

export default function ReportContent({ data }: { data: ReportData }) {
  const { summary, revenueByGroup, expensesByGroup, monthlyTrend } = data;
  const netPositive = summary.netProfit >= 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          label="Ingresos totales"
          value={fmt.format(summary.totalRevenue)}
          color="#5B8C6D"
        />
        <SummaryCard
          label="Gastos totales"
          value={fmt.format(summary.totalExpenses)}
          color="#C75D4A"
        />
        <SummaryCard
          label="Beneficio neto"
          value={fmt.format(summary.netProfit)}
          color={netPositive ? "#5B8C6D" : "#C75D4A"}
        />
        <SummaryCard
          label="Margen %"
          value={`${summary.profitMargin.toFixed(1)}%`}
          color={netPositive ? "#5B8C6D" : "#C75D4A"}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <GroupTable
          title="Desglose de ingresos"
          rows={revenueByGroup}
          emptyText="Sin ingresos en el periodo"
        />
        <GroupTable
          title="Desglose de gastos"
          rows={expensesByGroup}
          emptyText="Sin gastos en el periodo"
        />
      </div>

      <div className="glass-card p-5">
        <h3 className="mb-4 text-sm font-semibold text-[#2D2A26]">
          Tendencia mensual
        </h3>
        {monthlyTrend.length === 0 ? (
          <p className="text-sm text-[#8A8580]">Sin datos</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#E8E4DE] text-left text-xs text-[#8A8580]">
                  <th className="pb-2 pr-4 font-medium">Mes</th>
                  <th className="pb-2 pr-4 text-right font-medium">Ingresos</th>
                  <th className="pb-2 pr-4 text-right font-medium">Gastos</th>
                  <th className="pb-2 text-right font-medium">Beneficio</th>
                </tr>
              </thead>
              <tbody>
                {monthlyTrend.map((row) => (
                  <tr
                    key={row.month}
                    className="border-b border-[#E8E4DE] last:border-0"
                  >
                    <td className="py-2.5 pr-4 text-[#2D2A26]">
                      {formatMonth(row.month)}
                    </td>
                    <td className="py-2.5 pr-4 text-right font-medium text-[#5B8C6D]">
                      {fmt.format(row.revenue)}
                    </td>
                    <td className="py-2.5 pr-4 text-right font-medium text-[#C75D4A]">
                      {fmt.format(row.expenses)}
                    </td>
                    <td
                      className={`py-2.5 text-right font-semibold ${
                        row.profit >= 0 ? "text-[#5B8C6D]" : "text-[#C75D4A]"
                      }`}
                    >
                      {fmt.format(row.profit)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="glass-card p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-[#8A8580]">{label}</p>
        <div
          className="flex h-9 w-9 items-center justify-center rounded-xl"
          style={{ backgroundColor: `${color}15` }}
        >
          <FileBarChart className="h-4 w-4" style={{ color }} />
        </div>
      </div>
      <p className="mt-2 text-2xl font-bold text-[#2D2A26]">{value}</p>
    </div>
  );
}

function GroupTable({
  title,
  rows,
  emptyText,
}: {
  title: string;
  rows: { label: string; amount: number; percentage: number }[];
  emptyText: string;
}) {
  return (
    <div className="glass-card p-5">
      <h3 className="mb-4 text-sm font-semibold text-[#2D2A26]">{title}</h3>
      {rows.length === 0 ? (
        <p className="text-sm text-[#8A8580]">{emptyText}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#E8E4DE] text-left text-xs text-[#8A8580]">
                <th className="pb-2 pr-4 font-medium">Concepto</th>
                <th className="pb-2 pr-4 text-right font-medium">Importe</th>
                <th className="pb-2 text-right font-medium">%</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr
                  key={r.label}
                  className="border-b border-[#E8E4DE] last:border-0"
                >
                  <td className="py-2.5 pr-4 text-[#2D2A26]">{r.label}</td>
                  <td className="py-2.5 pr-4 text-right font-medium text-[#2D2A26]">
                    {fmt.format(r.amount)}
                  </td>
                  <td className="py-2.5 text-right text-[#8A8580]">
                    {r.percentage.toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
