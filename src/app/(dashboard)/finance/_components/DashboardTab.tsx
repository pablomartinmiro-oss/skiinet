"use client";

import {
  TrendingUp,
  TrendingDown,
  Receipt,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { useFinanceDashboard, useFinanceReports } from "@/hooks/useFinance";
import { PageSkeleton } from "@/components/shared/LoadingSkeleton";
import { paymentMethodLabel } from "@/lib/finance/payment-methods";

const fmt = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

const MONTH_SHORT = [
  "Ene", "Feb", "Mar", "Abr", "May", "Jun",
  "Jul", "Ago", "Sep", "Oct", "Nov", "Dic",
];

function monthLabelFromKey(ym: string): string {
  const [, m] = ym.split("-");
  const idx = Math.max(0, Math.min(11, parseInt(m, 10) - 1));
  return MONTH_SHORT[idx];
}

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function getMonthRange(): { from: string; to: string } {
  const now = new Date();
  const first = new Date(now.getFullYear(), now.getMonth(), 1);
  return { from: isoDate(first), to: isoDate(now) };
}

function getSixMonthRange(): { from: string; to: string } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - 5, 1);
  return { from: isoDate(start), to: isoDate(now) };
}

function SummaryCard({
  label,
  value,
  icon: Icon,
  iconColor,
  subtext,
}: {
  label: string;
  value: string;
  icon: typeof TrendingUp;
  iconColor: string;
  subtext?: string;
}) {
  return (
    <div className="rounded-2xl border border-[#E8E4DE] bg-white p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-[#8A8580]">{label}</p>
        <div
          className="flex h-9 w-9 items-center justify-center rounded-xl"
          style={{ backgroundColor: `${iconColor}15` }}
        >
          <Icon className="h-4 w-4" style={{ color: iconColor }} />
        </div>
      </div>
      <p className="mt-2 text-2xl font-bold text-[#2D2A26]">{value}</p>
      {subtext && <p className="mt-1 text-xs text-[#8A8580]">{subtext}</p>}
    </div>
  );
}

interface TrendRow {
  month: string;
  revenue: number;
  expenses: number;
  profit: number;
}

function MiniBarChart({ rows }: { rows: TrendRow[] }) {
  if (rows.length === 0) {
    return <p className="text-sm text-[#8A8580]">Sin datos suficientes</p>;
  }
  const max = Math.max(
    1,
    ...rows.map((r) => Math.max(r.revenue, r.expenses))
  );
  return (
    <div className="space-y-3">
      <div className="flex items-end gap-3 h-44">
        {rows.map((r) => (
          <div key={r.month} className="flex-1 flex flex-col items-center gap-1">
            <div className="flex items-end gap-1 h-36 w-full">
              <div
                className="flex-1 rounded-t-md bg-[#5B8C6D]"
                style={{ height: `${(r.revenue / max) * 100}%` }}
                title={`Ingresos: ${fmt.format(r.revenue)}`}
              />
              <div
                className="flex-1 rounded-t-md bg-[#C75D4A]"
                style={{ height: `${(r.expenses / max) * 100}%` }}
                title={`Gastos: ${fmt.format(r.expenses)}`}
              />
            </div>
            <span className="text-xs text-[#8A8580]">
              {monthLabelFromKey(r.month)}
            </span>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-4 text-xs text-[#8A8580]">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-[#5B8C6D]" />
          Ingresos
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-[#C75D4A]" />
          Gastos
        </span>
      </div>
    </div>
  );
}

export default function DashboardTab() {
  const { data: dash, isLoading: dashLoading, error: dashErr } =
    useFinanceDashboard();
  const month = getMonthRange();
  const six = getSixMonthRange();
  const { data: monthRpt, isLoading: monthLoading } = useFinanceReports(
    month.from,
    month.to,
    "category"
  );
  const { data: trendRpt, isLoading: trendLoading } = useFinanceReports(
    six.from,
    six.to,
    "month"
  );

  if (dashLoading || monthLoading || trendLoading) return <PageSkeleton />;
  if (dashErr || !dash) {
    return (
      <div className="rounded-2xl border border-[#E8E4DE] bg-white p-8 text-center text-[#8A8580]">
        Error al cargar el resumen financiero
      </div>
    );
  }

  const monthRevenue = monthRpt?.summary.totalRevenue ?? 0;
  const monthExpenses = monthRpt?.summary.totalExpenses ?? 0;
  const monthProfit = monthRpt?.summary.netProfit ?? 0;
  const netIsPositive = monthProfit >= 0;

  const topCategories = (monthRpt?.expensesByGroup ?? []).slice(0, 5);
  const trendRows = trendRpt?.monthlyTrend ?? [];

  return (
    <div className="space-y-6">
      {/* Month summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          label="Ingresos mes"
          value={fmt.format(monthRevenue)}
          icon={TrendingUp}
          iconColor="#5B8C6D"
        />
        <SummaryCard
          label="Gastos mes"
          value={fmt.format(monthExpenses)}
          icon={TrendingDown}
          iconColor="#C75D4A"
        />
        <SummaryCard
          label="Beneficio neto"
          value={fmt.format(monthProfit)}
          icon={netIsPositive ? ArrowUpRight : ArrowDownRight}
          iconColor={netIsPositive ? "#5B8C6D" : "#C75D4A"}
          subtext={
            monthRevenue > 0
              ? `Margen ${((monthProfit / monthRevenue) * 100).toFixed(1)}%`
              : undefined
          }
        />
        <SummaryCard
          label="Facturas pendientes"
          value={String(dash.summary.pendingInvoices)}
          icon={dash.summary.pendingInvoices > 0 ? AlertCircle : Receipt}
          iconColor={dash.summary.pendingInvoices > 0 ? "#D4A853" : "#8A8580"}
          subtext="Borrador + Enviada"
        />
      </div>

      {/* Mini chart + top categories */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-2xl border border-[#E8E4DE] bg-white p-5">
          <h3 className="mb-4 text-sm font-semibold text-[#2D2A26]">
            Ingresos vs gastos · ultimos 6 meses
          </h3>
          <MiniBarChart rows={trendRows} />
        </div>

        <div className="rounded-2xl border border-[#E8E4DE] bg-white p-5">
          <h3 className="mb-4 text-sm font-semibold text-[#2D2A26]">
            Top categorias de gasto · este mes
          </h3>
          {topCategories.length === 0 ? (
            <p className="text-sm text-[#8A8580]">Sin gastos este mes</p>
          ) : (
            <div className="space-y-3">
              {topCategories.map((c) => (
                <div key={c.label}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[#2D2A26] truncate">{c.label}</span>
                    <span className="font-semibold text-[#2D2A26]">
                      {fmt.format(c.amount)}
                    </span>
                  </div>
                  <div className="mt-1 h-1.5 w-full rounded-full bg-[#FAF9F7]">
                    <div
                      className="h-full rounded-full bg-[#E87B5A]"
                      style={{ width: `${Math.min(100, c.percentage)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent transactions */}
      <div className="rounded-2xl border border-[#E8E4DE] bg-white p-5">
        <h3 className="mb-4 text-sm font-semibold text-[#2D2A26]">
          Ultimas transacciones
        </h3>
        {dash.recentTransactions.length === 0 ? (
          <p className="text-sm text-[#8A8580]">Sin transacciones recientes</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#E8E4DE] text-left text-xs text-[#8A8580]">
                  <th className="pb-2 pr-4 font-medium">Fecha</th>
                  <th className="pb-2 pr-4 font-medium">Factura</th>
                  <th className="pb-2 pr-4 font-medium">Método</th>
                  <th className="pb-2 text-right font-medium">Importe</th>
                </tr>
              </thead>
              <tbody>
                {dash.recentTransactions.map((tx) => (
                  <tr
                    key={tx.id}
                    className="border-b border-[#E8E4DE] last:border-0"
                  >
                    <td className="py-2.5 pr-4 text-[#2D2A26]">
                      {new Date(tx.date).toLocaleDateString("es-ES")}
                    </td>
                    <td className="py-2.5 pr-4 text-[#8A8580]">
                      {tx.invoice?.number ?? "-"}
                    </td>
                    <td className="py-2.5 pr-4 text-[#2D2A26]">{paymentMethodLabel(tx.method)}</td>
                    <td className="py-2.5 text-right font-semibold text-[#2D2A26]">
                      {fmt.format(tx.amount)}
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
