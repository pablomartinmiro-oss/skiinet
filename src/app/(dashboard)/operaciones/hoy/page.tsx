"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  Briefcase,
  CalendarCheck,
  Clock,
  Receipt,
  Sparkles,
  Users,
} from "lucide-react";
import Link from "next/link";

interface OperationsToday {
  date: string;
  totals: {
    classesNow: number;
    rentalsActive: number;
    reservationsToday: number;
    invoicesUnpaid: number;
    invoicesUnpaidAmount: number;
    leadsNew: number;
  };
  classesNow: Array<{
    id: string;
    timeSlotStart: string;
    timeSlotEnd: string;
    discipline: string;
    level: string;
    station: string;
    status: string;
    instructor: { tdLevel: string; user: { name: string | null } } | null;
    meetingPoint: { name: string } | null;
    _count: { units: number; checkIns: number };
  }>;
  rentalsActive: Array<{
    id: string;
    clientName: string;
    stationSlug: string;
    status: string;
    pickupDate: string;
    returnDate: string;
    totalPrice: number;
    _count: { items: number };
  }>;
  reservationsToday: Array<{
    id: string;
    clientName: string;
    clientPhone: string;
    station: string;
    schedule: string;
    status: string;
    totalPrice: number;
  }>;
  invoicesUnpaid: Array<{
    id: string;
    number: string;
    total: number;
    issuedAt: string | null;
    reminderCount: number;
    client: { name: string } | null;
  }>;
  leadsNew: Array<{
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    source: string;
    score: number;
    createdAt: string;
  }>;
}

function formatEUR(n: number): string {
  return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);
}

function formatDate(s: string): string {
  return new Date(s).toLocaleDateString("es-ES", { day: "numeric", month: "short" });
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

export default function OperacionesHoyPage() {
  const { data, isLoading } = useQuery<OperationsToday>({
    queryKey: ["operations-today"],
    queryFn: () => fetch("/api/operations/today").then((r) => r.json()),
    refetchInterval: 60_000,
    staleTime: 30_000,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-200 border-t-slate-700" />
      </div>
    );
  }
  if (!data) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-baseline justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Operaciones · Hoy</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {new Date(data.date).toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>
        <span className="text-xs text-slate-500">Auto-refresh cada 60s</span>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <Stat icon={CalendarCheck} label="Reservas hoy" value={data.totals.reservationsToday} accent="blue" />
        <Stat icon={Activity} label="Clases" value={data.totals.classesNow} accent="violet" />
        <Stat icon={Briefcase} label="Alquileres activos" value={data.totals.rentalsActive} accent="amber" />
        <Stat
          icon={Receipt}
          label="Facturas impagadas"
          value={data.totals.invoicesUnpaid}
          subline={formatEUR(data.totals.invoicesUnpaidAmount)}
          accent="red"
        />
        <Stat icon={Sparkles} label="Leads nuevos" value={data.totals.leadsNew} accent="emerald" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Section icon={Activity} title="Clases en curso" badge={data.totals.classesNow}>
          {data.classesNow.length === 0 ? (
            <Empty label="Sin clases hoy" />
          ) : (
            <div className="divide-y divide-slate-100">
              {data.classesNow.map((c) => (
                <div key={c.id} className="px-4 py-3 hover:bg-slate-50">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-900">
                        {c.timeSlotStart}–{c.timeSlotEnd} · {c.discipline} {c.level}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5 truncate">
                        {c.station}
                        {c.meetingPoint?.name ? ` · ${c.meetingPoint.name}` : ""} · {c._count.units} alumnos
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs text-slate-700 font-medium">
                        {c.instructor?.user.name ?? <span className="text-amber-700">Sin monitor</span>}
                      </p>
                      <p className="text-[10px] text-slate-400">{c.status}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>

        <Section icon={Briefcase} title="Equipos prestados" badge={data.totals.rentalsActive}>
          {data.rentalsActive.length === 0 ? (
            <Empty label="Sin alquileres activos" />
          ) : (
            <div className="divide-y divide-slate-100">
              {data.rentalsActive.map((r) => (
                <div key={r.id} className="px-4 py-3 hover:bg-slate-50">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-900 truncate">{r.clientName}</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {r.stationSlug} · {r._count.items} equipos · {formatDate(r.pickupDate)}–{formatDate(r.returnDate)}
                      </p>
                    </div>
                    <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700 shrink-0">
                      {r.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>

        <Section icon={CalendarCheck} title="Check-ins pendientes" badge={data.totals.reservationsToday}>
          {data.reservationsToday.length === 0 ? (
            <Empty label="Sin reservas hoy" />
          ) : (
            <div className="divide-y divide-slate-100">
              {data.reservationsToday.map((r) => (
                <Link
                  key={r.id}
                  href={`/reservas?selected=${r.id}`}
                  className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-slate-50"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-900 truncate">{r.clientName}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {r.station} · {r.schedule}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                        r.status === "confirmada" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                      }`}
                    >
                      {r.status}
                    </span>
                    <p className="mt-0.5 text-xs font-medium text-slate-700">{formatEUR(r.totalPrice)}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Section>

        <Section icon={Receipt} title="Facturas pendientes de cobro" badge={data.totals.invoicesUnpaid}>
          {data.invoicesUnpaid.length === 0 ? (
            <Empty label="Sin facturas pendientes" />
          ) : (
            <div className="divide-y divide-slate-100">
              {data.invoicesUnpaid.map((inv) => (
                <div key={inv.id} className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-slate-50">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-900">{inv.number}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {inv.client?.name ?? "Cliente"}
                      {inv.issuedAt && ` · emitida ${formatDate(inv.issuedAt)}`}
                      {inv.reminderCount > 0 && (
                        <span className="ml-2 text-amber-700">· {inv.reminderCount} recordatorio(s)</span>
                      )}
                    </p>
                  </div>
                  <p className="text-sm font-bold text-slate-900 shrink-0">{formatEUR(inv.total)}</p>
                </div>
              ))}
            </div>
          )}
        </Section>

        <Section icon={Sparkles} title="Leads sin contactar" badge={data.totals.leadsNew}>
          {data.leadsNew.length === 0 ? (
            <Empty label="Sin leads pendientes" />
          ) : (
            <div className="divide-y divide-slate-100">
              {data.leadsNew.map((l) => (
                <Link
                  key={l.id}
                  href={`/leads?selected=${l.id}`}
                  className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-slate-50"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-900 truncate">{l.name}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {l.source} · score {l.score} · hace {timeAgo(l.createdAt)}
                    </p>
                  </div>
                  <Users className="h-4 w-4 text-slate-400" />
                </Link>
              ))}
            </div>
          )}
        </Section>
      </div>
    </div>
  );
}

const ACCENT_CLASSES: Record<string, string> = {
  blue: "bg-blue-50 text-blue-700",
  violet: "bg-violet-50 text-violet-700",
  amber: "bg-amber-50 text-amber-700",
  red: "bg-red-50 text-red-700",
  emerald: "bg-emerald-50 text-emerald-700",
};

function Stat({
  icon: Icon,
  label,
  value,
  subline,
  accent,
}: {
  icon: typeof Activity;
  label: string;
  value: number;
  subline?: string;
  accent: keyof typeof ACCENT_CLASSES;
}) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-wider text-slate-500 font-medium">{label}</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
          {subline && <p className="mt-0.5 text-xs text-slate-500">{subline}</p>}
        </div>
        <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${ACCENT_CLASSES[accent]}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
    </div>
  );
}

function Section({
  icon: Icon,
  title,
  badge,
  children,
}: {
  icon: typeof Activity;
  title: string;
  badge: number;
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-4 py-3">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-slate-500" />
          <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
        </div>
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
          {badge}
        </span>
      </div>
      {children}
    </div>
  );
}

function Empty({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-slate-400">
      <Clock className="h-8 w-8 opacity-40" />
      <p className="mt-2 text-sm">{label}</p>
    </div>
  );
}
