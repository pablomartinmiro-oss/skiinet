"use client";

import { useLeadStats } from "@/hooks/useLeads";
import { LEAD_STAGES } from "./constants";
import { Target, TrendingUp, BarChart3, CheckCircle2 } from "lucide-react";

export function LeadStats() {
  const { data, isLoading } = useLeadStats();

  if (isLoading || !data) {
    return (
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-24 rounded-xl border border-border bg-white animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard
          label="Total leads"
          value={data.total.toString()}
          icon={<Target className="h-4 w-4" />}
          color="text-blue-600 bg-blue-50"
        />
        <StatCard
          label="Score medio"
          value={`${data.avgScore}/100`}
          icon={<BarChart3 className="h-4 w-4" />}
          color="text-purple-600 bg-purple-50"
        />
        <StatCard
          label="Convertidos"
          value={(data.byStatus.convertido ?? 0).toString()}
          icon={<CheckCircle2 className="h-4 w-4" />}
          color="text-emerald-600 bg-emerald-50"
        />
        <StatCard
          label="Tasa conversion"
          value={`${data.conversionRate}%`}
          icon={<TrendingUp className="h-4 w-4" />}
          color="text-coral bg-coral/10"
        />
      </div>

      <div className="rounded-xl border border-border bg-white p-4">
        <div className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">
          Distribucion del pipeline
        </div>
        <div className="space-y-2">
          {LEAD_STAGES.map((stage) => {
            const count = data.byStatus[stage.id] ?? 0;
            const pct = data.total > 0 ? (count / data.total) * 100 : 0;
            return (
              <div key={stage.id} className="flex items-center gap-3">
                <div className="w-24 shrink-0 text-xs font-medium text-slate-700">
                  {stage.label}
                </div>
                <div className="flex-1 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-2 rounded-full ${stage.color}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <div className="w-12 shrink-0 text-right text-xs font-semibold text-slate-700">
                  {count}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-white p-4">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
            {label}
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">{value}</div>
        </div>
        <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${color}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}
