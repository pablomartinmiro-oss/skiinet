"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { RefreshCw, Ticket } from "lucide-react";
import { useModules } from "@/hooks/useModules";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { useQuotes } from "@/hooks/useQuotes";
import { useReservationStats } from "@/hooks/useReservations";
import { OnboardingCards } from "./_components/OnboardingCards";
import { NeedsAttention } from "./_components/NeedsAttention";
import { FunnelChart } from "./_components/FunnelChart";
import { STATIONS } from "./reservas/_components/constants";

// ── Helpers ──────────────────────────────────────────────────────────

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("es-ES", {
    style: "currency", currency: "EUR", minimumFractionDigits: 0,
  }).format(value);
}

function getStationLabel(value: string): string {
  return STATIONS.find((s) => s.value === value)?.label ?? value;
}

function formatRelativeSync(dateStr: string): string {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "ahora mismo";
  if (diffMins < 60) return `hace ${diffMins} min`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `hace ${diffHours}h`;
  return `hace ${Math.floor(diffHours / 24)}d`;
}

function getWeekRange(): { from: string; to: string } {
  const today = new Date();
  const monday = new Date(today);
  monday.setDate(today.getDate() - today.getDay() + 1);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return { from: monday.toISOString().slice(0, 10), to: sunday.toISOString().slice(0, 10) };
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

const AVATAR_GRADIENTS = [
  "from-indigo-500 to-purple-500",
  "from-sky-500 to-indigo-500",
  "from-pink-500 to-amber-400",
  "from-emerald-500 to-sky-400",
  "from-amber-400 to-red-400",
  "from-indigo-500 to-pink-500",
  "from-violet-500 to-pink-500",
];

// ── Types ────────────────────────────────────────────────────────────

interface DashboardStats {
  ghlConnected: boolean;
  ghlError: string | null;
  stats: {
    totalContacts: number; totalOpportunities: number; pipelineValue: number;
    activeConversations: number; pipelineCount: number; wonDeals: number; lostDeals: number;
    pipelineBreakdown: { pipelineId: string; pipelineName: string; count: number; value: number }[];
    leadSources: { source: string; count: number }[];
    recentContacts: { id: string; name: string | null; email: string | null; source: string | null; updatedAt: string }[];
    recentOpportunities: { id: string; name: string | null; monetaryValue: number | null; status: string | null; updatedAt: string }[];
    lastSync: string | null; syncInProgress: boolean;
    hotelOccupancy: number; restaurantBookingsToday: number; spaAppointmentsToday: number;
    monthlyRevenue: number; outstandingInvoices: number; tpvSalesToday: number;
  };
}

function useDashboardStats() {
  return useQuery<DashboardStats>({
    queryKey: ["dashboard-stats"],
    queryFn: async () => { const r = await fetch("/api/dashboard/stats"); if (!r.ok) throw new Error("Failed"); return r.json(); },
  });
}

// ── Sub-components ───────────────────────────────────────────────────

function KpiCard({ label, value, sub, loading }: { label: string; value: string | number; sub?: string; loading?: boolean }) {
  return (
    <div className="glass-card p-5">
      <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500 mb-2">{label}</p>
      {loading ? (
        <div className="h-8 w-24 animate-pulse rounded bg-white/40 mb-1" />
      ) : (
        <p className="text-2xl font-bold tracking-tight text-slate-900 leading-none">{value}</p>
      )}
      {sub && <p className="mt-1.5 text-xs text-slate-500">{sub}</p>}
    </div>
  );
}

function StatusDot({ color }: { color: string }) {
  return <span className={`inline-block h-2 w-2 rounded-full flex-shrink-0 ${color}`} />;
}

// ── Page ─────────────────────────────────────────────────────────────

export default function DashboardHome() {
  const queryClient = useQueryClient();
  const [dateRange, setDateRange] = useState<{ from: string; to: string }>(getWeekRange);

  const { data: quotes, isLoading: quotesLoading } = useQuotes();
  const { data: dashStats, isLoading: statsLoading, isFetching: statsFetching } = useDashboardStats();
  const { data: resStats, isLoading: resStatsLoading } = useReservationStats(dateRange);
  const { isEnabled } = useModules();

  function handleRefresh() {
    queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
    queryClient.invalidateQueries({ queryKey: ["quotes"] });
    queryClient.invalidateQueries({ queryKey: ["reservation-stats"] });
  }

  const allQuotes = useMemo(() => quotes ?? [], [quotes]);
  const hasGHLData = dashStats?.ghlConnected && dashStats.stats;
  const stats = dashStats?.stats;

  const sent = allQuotes.filter((q) => q.status === "enviado" || q.status === "aceptado");
  const accepted = allQuotes.filter((q) => q.status === "aceptado");
  const conversionRate = sent.length > 0 ? Math.round((accepted.length / sent.length) * 100) : 0;

  const dailyVolume = resStats?.dailyVolume ?? [];
  const maxDayCount = Math.max(1, ...dailyVolume.map((d) => d.count));

  // Last 5 quotes sorted by createdAt desc
  const latestQuotes = useMemo(
    () => [...allQuotes].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5),
    [allQuotes],
  );

  // Groupon data: from resStats weekly.bySource or mock
  const grouponRevenue = resStats?.weekly.bySource["groupon"] ?? 0;
  const grouponPending = allQuotes.filter((q) => q.source === "groupon" && q.status === "nuevo").length;
  const grouponRedeemed = allQuotes.filter(
    (q) => q.source === "groupon" && (q.status === "aceptado" || q.status === "enviado"),
  ).length;

  // Activity feed items
  const recentContacts = (stats?.recentContacts ?? []).slice(0, 3);
  const recentOpps = (stats?.recentOpportunities ?? []).slice(0, 3);

  function quoteStatusBadge(status: string) {
    const map: Record<string, string> = {
      nuevo: "badge-default-glass",
      en_proceso: "badge-default-glass",
      enviado: "badge-confirmed",
      aceptado: "badge-confirmed",
      pagado: "badge-confirmed",
      cancelado: "badge-cancelled",
      rechazado: "badge-cancelled",
    };
    const labels: Record<string, string> = {
      nuevo: "Nuevo",
      en_proceso: "En proceso",
      enviado: "Enviado",
      aceptado: "Aceptado",
      pagado: "Pagado",
      cancelado: "Cancelado",
      rechazado: "Rechazado",
    };
    return { cls: map[status] ?? "badge-default-glass", label: labels[status] ?? status };
  }

  return (
    <div className="space-y-4">
      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Dashboard</h1>
          <p className="text-sm text-slate-500">
            Centro de mando · Skicenter
            {hasGHLData && stats?.lastSync && (
              <span className="ml-2 text-xs text-green-700">· Sincronizado {formatRelativeSync(stats.lastSync)}</span>
            )}
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={statsFetching}
          className="flex items-center gap-1.5 rounded-lg border border-white/40 bg-white/50 backdrop-blur-sm px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-white/70 transition-colors disabled:opacity-50 shadow-sm"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${statsFetching ? "animate-spin" : ""}`} />
          Actualizar
        </button>
      </div>

      <OnboardingCards />
      <NeedsAttention quotes={allQuotes} loading={quotesLoading} />

      {/* ── Fila 1: KPI Cards ──────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Reservas hoy"
          value={resStats?.today.total ?? 0}
          sub={`${resStats?.today.confirmed ?? 0} confirmadas`}
          loading={resStatsLoading}
        />
        <KpiCard
          label="Ingresos semanales"
          value={formatCurrency(resStats?.weekly.totalRevenue ?? 0)}
          sub={`${resStats?.weekly.totalReservations ?? 0} reservas`}
          loading={resStatsLoading}
        />
        {isEnabled("tpv") && stats ? (
          <KpiCard
            label="Ventas TPV hoy"
            value={formatCurrency(stats.tpvSalesToday)}
            sub="recaudado en caja"
            loading={statsLoading}
          />
        ) : (
          <KpiCard
            label="Presupuestos activos"
            value={allQuotes.filter((q) => !["cancelado", "rechazado"].includes(q.status)).length}
            sub={`${conversionRate}% tasa conversión`}
            loading={quotesLoading}
          />
        )}
        {hasGHLData && stats ? (
          <KpiCard
            label="Pipeline comercial"
            value={formatCurrency(stats.pipelineValue)}
            sub={`${stats.totalOpportunities} oportunidades`}
            loading={statsLoading}
          />
        ) : (
          <KpiCard
            label="Estación más activa"
            value={resStats?.weekly.topStation ? getStationLabel(resStats.weekly.topStation.name) : "—"}
            sub={resStats?.weekly.topStation ? `${resStats.weekly.topStation.count} reservas` : "Sin datos"}
            loading={resStatsLoading}
          />
        )}
      </div>

      {/* ── Fila 2: Reservas chart (2/3) + Conversión (1/3) ───── */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Reservas esta semana — 2/3 */}
        <div className="lg:col-span-2 glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-slate-900">Reservas esta semana</h2>
            <span className="text-xs text-slate-500">{resStats?.weekly.totalReservations ?? 0} total</span>
          </div>
          <div className="flex h-36 items-end gap-1.5">
            {resStatsLoading ? (
              Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="flex flex-1 flex-col items-center gap-1">
                  <div className="h-5 w-full animate-pulse rounded bg-white/40" />
                  <div className="h-2 w-6 animate-pulse rounded bg-white/30" />
                </div>
              ))
            ) : dailyVolume.length === 0 ? (
              <div className="flex w-full items-center justify-center text-sm text-slate-500">Sin datos</div>
            ) : (
              dailyVolume.map((d, i) => (
                <div key={i} className="flex min-w-[28px] flex-1 flex-col items-center gap-1">
                  <span className="text-[10px] font-semibold text-slate-700">{d.count > 0 ? d.count : ""}</span>
                  <div
                    className="w-full bg-gradient-to-t from-indigo-500 to-indigo-400 rounded-t transition-all"
                    style={{ height: `${d.count > 0 ? Math.max((d.count / maxDayCount) * 100, 6) : 2}%` }}
                  />
                  <span className="text-[10px] text-slate-500">{d.day}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Conversión — 1/3 */}
        <div className="glass-card p-5 flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-900 mb-1">Conversión</h2>
            <p className="text-xs text-slate-500">Presupuestos enviados → aceptados</p>
          </div>
          <div className="my-4 text-center">
            <p className="text-5xl font-bold tracking-tight text-slate-900">{conversionRate}<span className="text-2xl font-medium text-slate-400 ml-1">%</span></p>
            <p className="mt-2 text-xs text-slate-500">{accepted.length} de {sent.length} presupuestos</p>
          </div>
          <div>
            <div className="h-2 w-full rounded-full bg-white/40 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-indigo-400 transition-all"
                style={{ width: `${Math.min(conversionRate, 100)}%` }}
              />
            </div>
            <div className="mt-2 flex justify-between text-[10px] text-slate-400">
              <span>0%</span><span>50%</span><span>100%</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Fila 3: Estado reservas (1/3) + Últimas reservas (2/3) */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Estado reservas — 1/3 */}
        <div className="glass-card p-5">
          <h2 className="text-sm font-semibold text-slate-900 mb-4">Estado reservas</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <StatusDot color="bg-emerald-500" />
                <span className="text-sm text-slate-700">Confirmadas</span>
              </div>
              <span className="text-sm font-semibold text-slate-900">{resStats?.today.confirmed ?? 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <StatusDot color="bg-amber-400" />
                <span className="text-sm text-slate-700">Pendientes</span>
              </div>
              <span className="text-sm font-semibold text-slate-900">{resStats?.today.pending ?? 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <StatusDot color="bg-red-400" />
                <span className="text-sm text-slate-700">Sin disponibilidad</span>
              </div>
              <span className="text-sm font-semibold text-slate-900">{resStats?.today.noAvailability ?? 0}</span>
            </div>
            <div className="border-t border-white/30 pt-3 mt-1">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">Total hoy</span>
                <span className="text-sm font-bold text-slate-900">{resStats?.today.total ?? 0}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Últimas reservas — 2/3 */}
        <div className="lg:col-span-2 glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-slate-900">Últimas reservas</h2>
            <Link href="/reservas" className="text-[11px] font-medium text-indigo-600 hover:opacity-70">
              Ver todo →
            </Link>
          </div>
          {quotesLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-8 animate-pulse rounded bg-white/40" />
              ))}
            </div>
          ) : latestQuotes.length === 0 ? (
            <p className="text-sm text-slate-500 py-4 text-center">Sin presupuestos todavía</p>
          ) : (
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-white/30">
                  <th className="pb-2 text-left text-[10px] font-medium text-slate-500 uppercase tracking-wider">Cliente</th>
                  <th className="pb-2 text-left text-[10px] font-medium text-slate-500 uppercase tracking-wider hidden sm:table-cell">Estación</th>
                  <th className="pb-2 text-left text-[10px] font-medium text-slate-500 uppercase tracking-wider hidden md:table-cell">Fecha</th>
                  <th className="pb-2 text-left text-[10px] font-medium text-slate-500 uppercase tracking-wider">Estado</th>
                  <th className="pb-2 text-right text-[10px] font-medium text-slate-500 uppercase tracking-wider">Importe</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/20">
                {latestQuotes.map((q) => {
                  const { cls, label } = quoteStatusBadge(q.status);
                  const station = q.destination ? getStationLabel(q.destination) : "—";
                  const date = new Date(q.createdAt).toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit" });
                  return (
                    <tr key={q.id} className="hover:bg-white/10 transition-colors">
                      <td className="py-2 pr-2 font-medium text-slate-800 max-w-[120px] truncate">{q.clientName}</td>
                      <td className="py-2 pr-2 text-slate-500 hidden sm:table-cell">{station}</td>
                      <td className="py-2 pr-2 text-slate-500 hidden md:table-cell">{date}</td>
                      <td className="py-2 pr-2">
                        <span className={`badge ${cls} text-[10px] px-1.5 py-0.5`}>{label}</span>
                      </td>
                      <td className="py-2 text-right font-semibold text-slate-900 font-mono">{formatCurrency(q.totalAmount)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ── Fila 4: Cupones Groupon (1/2) + Actividad reciente (1/2) */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Cupones Groupon */}
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Ticket className="h-4 w-4 text-indigo-500" />
              <h2 className="text-sm font-semibold text-slate-900">Cupones Groupon</h2>
            </div>
            <Link href="/reservas?source=groupon" className="text-[11px] font-medium text-indigo-600 hover:opacity-70">
              Ver →
            </Link>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center">
              <p className="text-2xl font-bold text-amber-500">{grouponPending}</p>
              <p className="text-[10px] text-slate-500 mt-0.5 uppercase tracking-wide">Pendientes</p>
            </div>
            <div className="text-center border-x border-white/30">
              <p className="text-2xl font-bold text-emerald-600">{grouponRedeemed}</p>
              <p className="text-[10px] text-slate-500 mt-0.5 uppercase tracking-wide">Canjeados</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-slate-900">{formatCurrency(grouponRevenue)}</p>
              <p className="text-[10px] text-slate-500 mt-0.5 uppercase tracking-wide">Ingresos</p>
            </div>
          </div>
        </div>

        {/* Actividad reciente */}
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-slate-900">Actividad reciente</h2>
            {hasGHLData && (
              <Link href="/contacts" className="text-[11px] font-medium text-indigo-600 hover:opacity-70">
                Ver todo →
              </Link>
            )}
          </div>
          <div className="space-y-2">
            {/* Recent quotes as activity */}
            {latestQuotes.slice(0, 3).map((q, i) => {
              const initials = getInitials(q.clientName);
              const grad = AVATAR_GRADIENTS[i % AVATAR_GRADIENTS.length];
              const timeAgo = formatRelativeSync(q.createdAt);
              const station = q.destination ? getStationLabel(q.destination) : "";
              return (
                <div key={q.id} className="flex items-center gap-2.5 rounded-xl bg-white/30 border border-white/40 px-3 py-2">
                  <div className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${grad} text-white text-[10px] font-semibold`}>
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-slate-800 truncate">{q.clientName}</p>
                    <p className="text-[10px] text-slate-500">Presupuesto{station ? ` · ${station}` : ""}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs font-semibold text-slate-900 font-mono">{formatCurrency(q.totalAmount)}</p>
                    <p className="text-[10px] text-slate-400">{timeAgo}</p>
                  </div>
                </div>
              );
            })}
            {/* GHL opportunities if available */}
            {recentOpps.slice(0, 2).map((opp, i) => {
              const name = opp.name ?? "Oportunidad";
              const initials = getInitials(name);
              const grad = AVATAR_GRADIENTS[(latestQuotes.length + i) % AVATAR_GRADIENTS.length];
              const timeAgo = formatRelativeSync(opp.updatedAt);
              return (
                <div key={opp.id} className="flex items-center gap-2.5 rounded-xl bg-white/30 border border-white/40 px-3 py-2">
                  <div className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${grad} text-white text-[10px] font-semibold`}>
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-slate-800 truncate">{name}</p>
                    <p className="text-[10px] text-slate-500">Oportunidad CRM</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs font-semibold text-slate-900 font-mono">{opp.monetaryValue ? formatCurrency(opp.monetaryValue) : "—"}</p>
                    <p className="text-[10px] text-slate-400">{timeAgo}</p>
                  </div>
                </div>
              );
            })}
            {latestQuotes.length === 0 && recentOpps.length === 0 && (
              <p className="text-sm text-slate-500 text-center py-3">Sin actividad reciente</p>
            )}
          </div>
        </div>
      </div>

      {/* ── Funnel (solo si hay datos GHL) ─────────────────────── */}
      {hasGHLData && (
        <div className="glass-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">Embudo de Conversión</h2>
            <span className="text-xs text-slate-500">{allQuotes.length} presupuestos</span>
          </div>
          <FunnelChart quotes={allQuotes} totalReservations={resStats?.weekly.totalReservations ?? 0} />
        </div>
      )}
    </div>
  );
}
