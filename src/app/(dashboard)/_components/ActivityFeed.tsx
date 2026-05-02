"use client";

import Link from "next/link";
import { FileText, CalendarCheck, TrendingUp } from "lucide-react";

interface RecentReservation {
  id: string;
  clientName: string;
  station: string;
  status: string;
  totalPrice: number;
  source: string;
  createdAt: string;
}

interface RecentQuote {
  id: string;
  clientName: string;
  destination: string;
  status: string;
  totalAmount: number;
  createdAt: string;
}

interface RecentOpportunity {
  id: string;
  name: string | null;
  monetaryValue: number | null;
  status: string | null;
  updatedAt: string;
}

interface ActivityFeedProps {
  reservations: RecentReservation[];
  quotes: RecentQuote[];
  opportunities: RecentOpportunity[];
  loading?: boolean;
}

const STATION_LABELS: Record<string, string> = {
  baqueira: "Baqueira Beret",
  sierra_nevada: "Sierra Nevada",
  valdesqui: "Valdesqui",
  la_pinilla: "La Pinilla",
  grandvalira: "Grandvalira",
  formigal: "Formigal",
  alto_campoo: "Alto Campoo",
};

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
  }).format(value);
}

function formatRelativeTime(dateStr: string): string {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const diffMins = Math.floor(diffMs / 60_000);
  if (diffMins < 1) return "ahora";
  if (diffMins < 60) return `hace ${diffMins} min`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `hace ${diffHours}h`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return "ayer";
  if (diffDays < 7) return `hace ${diffDays}d`;
  return new Date(dateStr).toLocaleDateString("es-ES", { day: "numeric", month: "short" });
}

type ActivityItem = {
  id: string;
  type: "reservation" | "quote" | "opportunity";
  name: string;
  detail: string;
  amount: number | null;
  status: string;
  date: string;
};

function mergeAndSort(
  reservations: RecentReservation[],
  quotes: RecentQuote[],
  opportunities: RecentOpportunity[],
): ActivityItem[] {
  const items: ActivityItem[] = [];

  for (const r of reservations) {
    items.push({
      id: `res-${r.id}`,
      type: "reservation",
      name: r.clientName,
      detail: `Reserva · ${STATION_LABELS[r.station] ?? r.station}`,
      amount: r.totalPrice,
      status: r.status,
      date: r.createdAt,
    });
  }

  for (const q of quotes) {
    items.push({
      id: `quote-${q.id}`,
      type: "quote",
      name: q.clientName,
      detail: `Presupuesto · ${STATION_LABELS[q.destination] ?? q.destination}`,
      amount: q.totalAmount,
      status: q.status,
      date: q.createdAt,
    });
  }

  for (const o of opportunities) {
    items.push({
      id: `opp-${o.id}`,
      type: "opportunity",
      name: o.name ?? "Sin nombre",
      detail: `Oportunidad · ${o.status === "won" ? "Ganada" : o.status === "lost" ? "Perdida" : "Abierta"}`,
      amount: o.monetaryValue,
      status: o.status ?? "open",
      date: o.updatedAt,
    });
  }

  items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  return items.slice(0, 8);
}

const TYPE_CONFIG: Record<
  ActivityItem["type"],
  { icon: React.ElementType; stripe: string; iconBg: string; iconColor: string }
> = {
  reservation: {
    icon: CalendarCheck,
    stripe: "border-l-sage",
    iconBg: "bg-sage/10",
    iconColor: "text-green-700",
  },
  quote: {
    icon: FileText,
    stripe: "border-l-coral",
    iconBg: "bg-coral/10",
    iconColor: "text-blue-600",
  },
  opportunity: {
    icon: TrendingUp,
    stripe: "border-l-soft-blue",
    iconBg: "bg-soft-blue/10",
    iconColor: "text-soft-blue",
  },
};

export function ActivityFeed({
  reservations,
  quotes,
  opportunities,
  loading,
}: ActivityFeedProps) {
  const items = mergeAndSort(reservations, quotes, opportunities);

  if (loading) {
    return (
      <div className="animate-fade-in glass-card p-5">
        <h2 className="mb-4 text-base font-semibold text-slate-900">Actividad Reciente</h2>
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-14 animate-pulse rounded-xl bg-slate-100" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in glass-card p-5 hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)] transition-shadow">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-semibold text-slate-900">Actividad Reciente</h2>
        <div className="flex gap-3">
          <Link href="/reservas" className="text-xs text-blue-600 hover:underline">
            Ver reservas &rarr;
          </Link>
          <Link href="/presupuestos" className="text-xs text-blue-600 hover:underline">
            Ver presupuestos &rarr;
          </Link>
        </div>
      </div>

      {items.length === 0 ? (
        <p className="py-6 text-center text-sm text-slate-500">
          Sin actividad reciente
        </p>
      ) : (
        <div className="space-y-2">
          {items.map((item) => {
            const cfg = TYPE_CONFIG[item.type];
            const IconComponent = cfg.icon;

            return (
              <div
                key={item.id}
                className={`flex items-center justify-between rounded-xl border border-border border-l-[3px] ${cfg.stripe} p-3 transition-colors hover:bg-slate-100/30`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${cfg.iconBg}`}>
                    <IconComponent className={`h-4 w-4 ${cfg.iconColor}`} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">
                      {item.name}
                    </p>
                    <p className="text-xs text-slate-500 truncate">{item.detail}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end shrink-0 ml-3">
                  <span className="text-xs font-medium text-slate-900">
                    {item.amount != null ? formatCurrency(item.amount) : "\u2014"}
                  </span>
                  <span className="text-[11px] text-slate-500">
                    {formatRelativeTime(item.date)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
