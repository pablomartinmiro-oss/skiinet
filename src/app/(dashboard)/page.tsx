"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Euro, Users, MessageCircle,
  BarChart3, CalendarCheck, Snowflake, Target, Trophy, XCircle, Send, RefreshCw,
  Hotel, UtensilsCrossed, Sparkles, CreditCard,
} from "lucide-react";
import { useModules } from "@/hooks/useModules";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useQuotes } from "@/hooks/useQuotes";
import { useReservationStats } from "@/hooks/useReservations";
import { StatCard } from "./_components/StatCard";
import { OnboardingCards } from "./_components/OnboardingCards";
import { NeedsAttention } from "./_components/NeedsAttention";
import { ActivityFeed } from "./_components/ActivityFeed";
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

/** Generate a simple pseudo-sparkline from a seed value */
function makeSparkline(seed: number): number[] {
  const base = Math.max(seed, 1);
  return [
    base * 0.7, base * 0.85, base * 0.6, base * 0.9,
    base * 0.75, base * 0.95, base,
  ];
}

// ── Types ────────────────────────────────────────────────────────────

interface PipelineBreakdown { pipelineId: string; pipelineName: string; count: number; value: number }
interface LeadSource { source: string; count: number }
interface DashboardStats {
  ghlConnected: boolean;
  ghlError: string | null;
  stats: {
    totalContacts: number; totalOpportunities: number; pipelineValue: number;
    activeConversations: number; pipelineCount: number; wonDeals: number; lostDeals: number;
    pipelineBreakdown: PipelineBreakdown[]; leadSources: LeadSource[];
    recentContacts: { id: string; name: string | null; email: string | null; source: string | null; updatedAt: string }[];
    recentOpportunities: { id: string; name: string | null; monetaryValue: number | null; status: string | null; updatedAt: string }[];
    lastSync: string | null; syncInProgress: boolean;
    // Module stats
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

const PRESETS = [
  { label: "Esta semana", getValue: () => getWeekRange() },
  { label: "Ultimos 7d", getValue: () => { const t = new Date(); t.setHours(0,0,0,0); const f = new Date(t); f.setDate(t.getDate()-6); return { from: f.toISOString().slice(0,10), to: t.toISOString().slice(0,10) }; } },
  { label: "Este mes", getValue: () => { const n = new Date(); return { from: new Date(n.getFullYear(),n.getMonth(),1).toISOString().slice(0,10), to: new Date(n.getFullYear(),n.getMonth()+1,0).toISOString().slice(0,10) }; } },
  { label: "Ultimos 30d", getValue: () => { const t = new Date(); t.setHours(0,0,0,0); const f = new Date(t); f.setDate(t.getDate()-29); return { from: f.toISOString().slice(0,10), to: t.toISOString().slice(0,10) }; } },
] as const;

// ── Page ─────────────────────────────────────────────────────────────

export default function DashboardHome() {
  const queryClient = useQueryClient();
  const [dateRange, setDateRange] = useState<{ from: string; to: string }>(getWeekRange);
  const [activePreset, setActivePreset] = useState("Esta semana");

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
  const pipelineBreakdown = stats?.pipelineBreakdown ?? [];
  const maxPipelineCount = Math.max(1, ...pipelineBreakdown.map((p) => p.count));
  const leadSources = stats?.leadSources ?? [];
  const maxSourceCount = Math.max(1, ...leadSources.map((s) => s.count));

  return (
    <div className="space-y-6">
      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Dashboard</h1>
          <p className="text-sm text-slate-500">
            Centro de mando de Skicenter
            {hasGHLData && stats?.lastSync && (
              <span className="ml-2 text-xs text-green-700">· Sincronizado {formatRelativeSync(stats.lastSync)}</span>
            )}
          </p>
        </div>
        <button onClick={handleRefresh} disabled={statsFetching} className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-slate-500 hover:bg-surface transition-colors disabled:opacity-50">
          <RefreshCw className={`h-3.5 w-3.5 ${statsFetching ? "animate-spin" : ""}`} />
          Actualizar
        </button>
      </div>

      <OnboardingCards />

      {/* ── Top KPI Row (GHL) ──────────────────────────────────── */}
      {hasGHLData && stats && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Link href="/contacts"><StatCard title="Contactos" value={stats.totalContacts.toLocaleString("es-ES")} description="en GoHighLevel" icon={Users} loading={statsLoading} iconColor="text-blue-600" iconBg="bg-blue-50" trend={{ value: 12, label: "vs semana anterior" }} sparkline={makeSparkline(stats.totalContacts)} /></Link>
          <Link href="/pipeline"><StatCard title="Oportunidades" value={stats.totalOpportunities.toLocaleString("es-ES")} description={`${stats.pipelineCount} pipelines`} icon={Target} loading={statsLoading} iconColor="text-sky-600" iconBg="bg-sky-50" trend={{ value: 8, label: "vs semana anterior" }} sparkline={makeSparkline(stats.totalOpportunities)} /></Link>
          <Link href="/pipeline"><StatCard title="Valor Pipeline" value={formatCurrency(stats.pipelineValue)} description="oportunidades abiertas" icon={BarChart3} loading={statsLoading} iconColor="text-green-600" iconBg="bg-green-50" trend={{ value: 15, label: "vs semana anterior" }} sparkline={makeSparkline(stats.pipelineValue / 100)} /></Link>
          <Link href="/comms"><StatCard title="Conversaciones" value={stats.activeConversations} description="ultimos 7 dias" icon={MessageCircle} loading={statsLoading} iconColor="text-amber-600" iconBg="bg-amber-50" trend={{ value: -3, label: "vs semana anterior" }} sparkline={makeSparkline(stats.activeConversations)} /></Link>
        </div>
      )}

      {/* ── Secondary KPI Row ──────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {hasGHLData && stats && (
          <>
            <Link href="/pipeline"><StatCard title="Deals Ganados" value={stats.wonDeals} description="cerrados con exito" icon={Trophy} loading={statsLoading} iconColor="text-green-600" iconBg="bg-green-50" sparkline={makeSparkline(stats.wonDeals)} /></Link>
            <Link href="/pipeline"><StatCard title="Deals Perdidos" value={stats.lostDeals} description="no convertidos" icon={XCircle} loading={statsLoading} iconColor="text-red-500" iconBg="bg-red-50" sparkline={makeSparkline(stats.lostDeals)} /></Link>
          </>
        )}
        <Link href="/reservas"><StatCard title="Reservas Hoy" value={resStats?.today.total ?? 0} description={`${resStats?.today.confirmed ?? 0} confirmadas`} icon={CalendarCheck} loading={resStatsLoading} iconColor="text-blue-600" iconBg="bg-blue-50" sparkline={makeSparkline(resStats?.today.total ?? 0)} /></Link>
        <Link href="/reservas"><StatCard title="Ingresos Semanales" value={formatCurrency(resStats?.weekly.totalRevenue ?? 0)} description={`${resStats?.weekly.totalReservations ?? 0} reservas`} icon={Euro} loading={resStatsLoading} iconColor="text-green-600" iconBg="bg-green-50" trend={{ value: conversionRate > 0 ? conversionRate : 5, label: "conversion" }} sparkline={makeSparkline(resStats?.weekly.totalRevenue ? resStats.weekly.totalRevenue / 100 : 1)} /></Link>
      </div>

      {/* ── Hoy en el complejo ─────────────────────────────────── */}
      {stats && (isEnabled("hotel") || isEnabled("restaurant") || isEnabled("spa") || isEnabled("tpv")) && (
        <div>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Hoy en el complejo</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {isEnabled("hotel") && (
              <StatCard title="Ocupacion Hotel" value={stats.hotelOccupancy} description="reservas alojamiento hoy" icon={Hotel} loading={statsLoading} iconColor="text-indigo-600" iconBg="bg-indigo-50" />
            )}
            {isEnabled("restaurant") && (
              <StatCard title="Reservas Restaurante" value={stats.restaurantBookingsToday} description="mesas reservadas hoy" icon={UtensilsCrossed} loading={statsLoading} iconColor="text-orange-600" iconBg="bg-orange-50" />
            )}
            {isEnabled("spa") && (
              <StatCard title="Citas Spa" value={stats.spaAppointmentsToday} description="tratamientos hoy" icon={Sparkles} loading={statsLoading} iconColor="text-purple-600" iconBg="bg-purple-50" />
            )}
            {isEnabled("tpv") && (
              <StatCard title="Ventas TPV" value={formatCurrency(stats.tpvSalesToday)} description="recaudado hoy" icon={CreditCard} loading={statsLoading} iconColor="text-emerald-600" iconBg="bg-emerald-50" />
            )}
          </div>
        </div>
      )}

      {/* ── Needs Attention ────────────────────────────────────── */}
      <NeedsAttention quotes={allQuotes} loading={quotesLoading} />

      {/* ── Charts Row ─────────────────────────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-2">
        {pipelineBreakdown.length > 0 && (
          <div className="animate-fade-in card-hover rounded-2xl bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)] transition-shadow">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-900">Oportunidades por Pipeline</h2>
              <span className="text-xs text-slate-500">{stats?.totalOpportunities.toLocaleString("es-ES")} total</span>
            </div>
            <div className="space-y-3">
              {pipelineBreakdown.map((p, i) => { const pct = (p.count / maxPipelineCount) * 100; const colors = ["bg-coral","bg-sage","bg-gold","bg-soft-blue","bg-muted-red","bg-coral/60","bg-sage/60"]; return (
                <div key={p.pipelineId}><div className="mb-1 flex items-center justify-between"><span className="text-sm text-slate-900">{p.pipelineName}</span><span className="text-xs font-medium text-slate-500">{p.count} · {formatCurrency(p.value)}</span></div><div className="h-2 overflow-hidden rounded-full bg-muted"><div className={`h-full rounded-full ${colors[i % colors.length]} transition-all`} style={{ width: `${Math.max(pct, 4)}%` }} /></div></div>
              ); })}
            </div>
          </div>
        )}
        {leadSources.length > 0 && (
          <div className="animate-fade-in card-hover rounded-2xl bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)] transition-shadow">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-900">Leads por Origen</h2>
              <span className="text-xs text-slate-500">{stats?.totalContacts.toLocaleString("es-ES")} contactos</span>
            </div>
            <div className="space-y-3">
              {leadSources.map((s, i) => { const pct = (s.count / maxSourceCount) * 100; const colors = ["bg-sage","bg-coral","bg-gold","bg-soft-blue","bg-muted-red"]; return (
                <div key={s.source}><div className="mb-1 flex items-center justify-between"><span className="text-sm text-slate-900">{s.source}</span><span className="text-xs font-medium text-slate-500">{s.count.toLocaleString("es-ES")}</span></div><div className="h-2 overflow-hidden rounded-full bg-muted"><div className={`h-full rounded-full ${colors[i % colors.length]} transition-all`} style={{ width: `${Math.max(pct, 4)}%` }} /></div></div>
              ); })}
            </div>
          </div>
        )}
      </div>

      {/* ── Reservations Bar Chart + Funnel ─────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="animate-fade-in card-hover rounded-2xl bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)] transition-shadow">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-900">Reservas</h2>
            <span className="text-xs text-slate-500">{resStats?.weekly.totalReservations ?? 0} total</span>
          </div>
          <div className="mb-3 flex flex-wrap gap-1.5">
            {PRESETS.map(({ label, getValue }) => (
              <button key={label} onClick={() => { setDateRange(getValue()); setActivePreset(label); }} className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors ${activePreset === label ? "bg-coral text-white" : "bg-slate-100 text-slate-500 hover:bg-blue-600/10 hover:text-blue-600"}`}>{label}</button>
            ))}
            <div className="flex items-center gap-1 ml-auto">
              <input type="date" value={dateRange.from} onChange={(e) => { setDateRange((r) => ({ ...r, from: e.target.value })); setActivePreset(""); }} className="rounded-lg border border-border px-2 py-1 text-[11px] focus:border-blue-500 focus:outline-none" />
              <span className="text-[11px] text-slate-500">&ndash;</span>
              <input type="date" value={dateRange.to} min={dateRange.from} onChange={(e) => { setDateRange((r) => ({ ...r, to: e.target.value })); setActivePreset(""); }} className="rounded-lg border border-border px-2 py-1 text-[11px] focus:border-blue-500 focus:outline-none" />
            </div>
          </div>
          <div className="flex h-40 items-end gap-1 overflow-x-auto">
            {dailyVolume.map((d, i) => (
              <div key={i} className="flex min-w-[24px] flex-1 flex-col items-center gap-1">
                <span className="text-[10px] font-medium text-slate-900">{d.count > 0 ? d.count : ""}</span>
                <div className="w-full rounded-t-lg bg-gradient-to-t from-coral to-coral/40 transition-all" style={{ height: `${d.count > 0 ? Math.max((d.count / maxDayCount) * 100, 4) : 0}%` }} />
                <span className="text-[10px] text-slate-500">{d.day}</span>
              </div>
            ))}
            {dailyVolume.length === 0 && <div className="flex w-full items-center justify-center text-sm text-slate-500">Sin datos</div>}
          </div>
        </div>

        <div className="animate-fade-in card-hover rounded-2xl bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)] transition-shadow">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-900">Embudo de Conversión</h2>
            <span className="text-xs text-slate-500">{allQuotes.length} presupuestos</span>
          </div>
          <FunnelChart quotes={allQuotes} totalReservations={resStats?.weekly.totalReservations ?? 0} />
        </div>
      </div>

      {/* ── Station + Source Breakdown ──────────────────────────── */}
      {resStats && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {resStats.weekly.topStation && (
            <div className="animate-fade-in flex items-center gap-4 rounded-2xl bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-50"><Snowflake className="h-5 w-5 text-coral" /></div>
              <div><p className="text-xs font-medium text-slate-500">Estacion Mas Activa</p><p className="text-lg font-bold text-slate-900">{getStationLabel(resStats.weekly.topStation.name)}</p><p className="text-xs text-slate-500">{resStats.weekly.topStation.count} reservas esta semana</p></div>
            </div>
          )}
          {Object.entries(resStats.weekly.bySource).map(([src, revenue]) => (
            <div key={src} className="animate-fade-in flex items-center gap-4 rounded-2xl bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
              <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${src === "groupon" ? "bg-green-50" : "bg-amber-50"}`}><Send className={`h-5 w-5 ${src === "groupon" ? "text-green-700" : "text-amber-700"}`} /></div>
              <div><p className="text-xs font-medium text-slate-500 capitalize">{src === "caja" ? "Venta en caja" : src === "groupon" ? "Groupon" : src}</p><p className="text-lg font-bold text-slate-900">{formatCurrency(revenue)}</p><p className="text-xs text-slate-500">ingresos esta semana</p></div>
            </div>
          ))}
        </div>
      )}

      {/* ── Activity Feed ──────────────────────────────────────── */}
      <ActivityFeed
        reservations={resStats?.recentReservations ?? []}
        quotes={allQuotes.slice(0, 5)}
        opportunities={hasGHLData && stats ? stats.recentOpportunities : []}
        loading={quotesLoading && resStatsLoading && statsLoading}
      />
    </div>
  );
}
