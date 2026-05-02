"use client";

import { useState, use } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  CalendarCheck,
  FileText,
  GraduationCap,
  Mail,
  MessageSquare,
  Phone,
  Receipt,
  Briefcase,
  Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";

type TabKey = "resumen" | "reservas" | "alquiler" | "clases" | "facturas" | "mensajes";

interface ClientHistory {
  client: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    skiLevel: string | null;
    bootSize: string | null;
    helmetSize: string | null;
    height: number | null;
    weight: number | null;
    preferredStation: string | null;
    notes: string | null;
    cumulativeSpend: number;
    visitCount: number;
    lastVisit: string | null;
  };
  totals: {
    quotes: number;
    reservations: number;
    rentalOrders: number;
    classes: number;
    invoices: number;
    messages: number;
    lifetimeSpend: number;
  };
  quotes: Array<{
    id: string;
    status: string;
    destination: string;
    checkIn: string;
    checkOut: string;
    totalAmount: number;
    createdAt: string;
    paidAt: string | null;
    _count: { items: number };
  }>;
  reservations: Array<{
    id: string;
    status: string;
    station: string;
    activityDate: string;
    schedule: string;
    totalPrice: number;
    source: string;
    createdAt: string;
  }>;
  rentalOrders: Array<{
    id: string;
    status: string;
    stationSlug: string;
    pickupDate: string;
    returnDate: string;
    totalPrice: number;
    _count: { items: number };
  }>;
  classes: Array<{
    id: string;
    activityDate: string;
    station: string;
    discipline: string;
    level: string;
    timeSlotStart: string;
    timeSlotEnd: string;
    status: string;
    instructor: { user: { name: string | null } } | null;
    _count: { units: number };
  }>;
  invoices: Array<{
    id: string;
    number: string;
    status: string;
    total: number;
    issuedAt: string | null;
    paidAt: string | null;
    createdAt: string;
  }>;
  messages: Array<{
    id: string;
    body: string;
    isRead: boolean;
    createdAt: string;
    fromUser: { name: string | null; email: string };
    toUser: { name: string | null; email: string };
  }>;
}

function formatEUR(n: number): string {
  return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(n);
}

function formatDate(s: string | null | undefined): string {
  if (!s) return "—";
  return new Date(s).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" });
}

export default function ClientePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [tab, setTab] = useState<TabKey>("resumen");

  const { data, isLoading } = useQuery<ClientHistory>({
    queryKey: ["client-history", id],
    queryFn: () => fetch(`/api/clientes/${id}/history`).then((r) => r.json()),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-200 border-t-slate-700" />
      </div>
    );
  }
  if (!data || !data.client) return <p className="text-sm text-slate-500">Cliente no encontrado</p>;

  const c = data.client;

  return (
    <div className="space-y-6">
      <Link href="/clientes" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900">
        <ArrowLeft className="h-3.5 w-3.5" /> Volver a clientes
      </Link>

      {/* Header card */}
      <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-700 text-lg font-bold">
              {c.name[0]?.toUpperCase()}
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">{c.name}</h1>
              <div className="mt-1 flex flex-wrap gap-3 text-xs text-slate-500">
                {c.email && (
                  <span className="flex items-center gap-1">
                    <Mail className="h-3 w-3" /> {c.email}
                  </span>
                )}
                {c.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="h-3 w-3" /> {c.phone}
                  </span>
                )}
                {c.preferredStation && (
                  <span>· Estación: {c.preferredStation}</span>
                )}
              </div>
              {c.notes && <p className="mt-2 text-sm text-slate-600 italic">&ldquo;{c.notes}&rdquo;</p>}
            </div>
          </div>
          <div className="text-right">
            <p className="text-[11px] uppercase tracking-wider text-slate-500">Lifetime</p>
            <p className="text-lg font-bold text-slate-900">{formatEUR(data.totals.lifetimeSpend)}</p>
            <p className="mt-0.5 text-[11px] text-slate-500">
              {c.visitCount} visita{c.visitCount !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 border-b border-slate-200">
        <Tab active={tab === "resumen"} onClick={() => setTab("resumen")}>
          Resumen
        </Tab>
        <Tab active={tab === "reservas"} onClick={() => setTab("reservas")}>
          Reservas <Pill>{data.totals.reservations}</Pill>
        </Tab>
        <Tab active={tab === "alquiler"} onClick={() => setTab("alquiler")}>
          Alquiler <Pill>{data.totals.rentalOrders}</Pill>
        </Tab>
        <Tab active={tab === "clases"} onClick={() => setTab("clases")}>
          Clases <Pill>{data.totals.classes}</Pill>
        </Tab>
        <Tab active={tab === "facturas"} onClick={() => setTab("facturas")}>
          Facturas <Pill>{data.totals.invoices}</Pill>
        </Tab>
        <Tab active={tab === "mensajes"} onClick={() => setTab("mensajes")}>
          Mensajes <Pill>{data.totals.messages}</Pill>
        </Tab>
      </div>

      {/* Tab content */}
      {tab === "resumen" && (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <ResumenCard icon={FileText} label="Presupuestos" value={data.totals.quotes} />
          <ResumenCard icon={CalendarCheck} label="Reservas" value={data.totals.reservations} />
          <ResumenCard icon={Briefcase} label="Alquileres" value={data.totals.rentalOrders} />
          <ResumenCard icon={GraduationCap} label="Clases" value={data.totals.classes} />
          <ResumenCard icon={Receipt} label="Facturas" value={data.totals.invoices} />
          <ResumenCard icon={MessageSquare} label="Mensajes" value={data.totals.messages} />
          <ResumenCard
            icon={Activity}
            label="Última visita"
            value={c.lastVisit ? formatDate(c.lastVisit) : "—"}
          />
          <ResumenCard
            icon={GraduationCap}
            label="Nivel"
            value={c.skiLevel ?? "—"}
          />
        </div>
      )}

      {tab === "reservas" && (
        <List
          items={data.reservations}
          empty="Sin reservas"
          render={(r) => (
            <Link
              key={r.id}
              href={`/reservas?selected=${r.id}`}
              className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3 last:border-0 hover:bg-slate-50"
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-900">
                  {r.station} · {formatDate(r.activityDate)}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {r.schedule} · {r.source} · creada {formatDate(r.createdAt)}
                </p>
              </div>
              <div className="text-right shrink-0">
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[10px] font-medium",
                    r.status === "confirmada"
                      ? "bg-emerald-50 text-emerald-700"
                      : r.status === "cancelada"
                        ? "bg-red-50 text-red-700"
                        : "bg-amber-50 text-amber-700"
                  )}
                >
                  {r.status}
                </span>
                <p className="mt-0.5 text-xs font-medium text-slate-700">{formatEUR(r.totalPrice)}</p>
              </div>
            </Link>
          )}
        />
      )}

      {tab === "alquiler" && (
        <List
          items={data.rentalOrders}
          empty="Sin órdenes de alquiler"
          render={(o) => (
            <div key={o.id} className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3 last:border-0">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-900">
                  {o.stationSlug} · {o._count.items} equipo(s)
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {formatDate(o.pickupDate)} → {formatDate(o.returnDate)}
                </p>
              </div>
              <div className="text-right shrink-0">
                <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700">
                  {o.status}
                </span>
                <p className="mt-0.5 text-xs font-medium text-slate-700">{formatEUR(o.totalPrice)}</p>
              </div>
            </div>
          )}
        />
      )}

      {tab === "clases" && (
        <List
          items={data.classes}
          empty="Sin clases"
          render={(g) => (
            <div key={g.id} className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3 last:border-0">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-900">
                  {formatDate(g.activityDate)} · {g.discipline} {g.level}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {g.timeSlotStart}–{g.timeSlotEnd} · {g.station} · {g._count.units} alumnos
                </p>
              </div>
              <p className="text-xs text-slate-700 shrink-0">
                {g.instructor?.user.name ?? <span className="text-amber-700">Sin monitor</span>}
              </p>
            </div>
          )}
        />
      )}

      {tab === "facturas" && (
        <List
          items={data.invoices}
          empty="Sin facturas"
          render={(inv) => (
            <Link
              key={inv.id}
              href={`/api/finance/invoices/${inv.id}/pdf`}
              target="_blank"
              className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3 last:border-0 hover:bg-slate-50"
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-900">{inv.number}</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Emitida {formatDate(inv.issuedAt)}
                  {inv.paidAt && ` · pagada ${formatDate(inv.paidAt)}`}
                </p>
              </div>
              <div className="text-right shrink-0">
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[10px] font-medium",
                    inv.status === "paid"
                      ? "bg-emerald-50 text-emerald-700"
                      : inv.status === "cancelled"
                        ? "bg-red-50 text-red-700"
                        : "bg-amber-50 text-amber-700"
                  )}
                >
                  {inv.status}
                </span>
                <p className="mt-0.5 text-sm font-bold text-slate-900">{formatEUR(inv.total)}</p>
              </div>
            </Link>
          )}
        />
      )}

      {tab === "mensajes" && (
        <List
          items={data.messages}
          empty="Sin mensajes"
          render={(m) => (
            <div key={m.id} className="border-b border-slate-100 px-4 py-3 last:border-0">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-medium text-slate-700">
                  {m.fromUser.name ?? m.fromUser.email} → {m.toUser.name ?? m.toUser.email}
                </p>
                <p className="text-[10px] text-slate-400">{formatDate(m.createdAt)}</p>
              </div>
              <p className="mt-1 text-sm text-slate-900 whitespace-pre-wrap">{m.body}</p>
            </div>
          )}
        />
      )}
    </div>
  );
}

function Tab({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 border-b-2 px-3 py-2 text-sm font-medium transition-colors",
        active ? "border-blue-600 text-slate-900" : "border-transparent text-slate-500 hover:text-slate-700"
      )}
    >
      {children}
    </button>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600">
      {children}
    </span>
  );
}

function ResumenCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof MessageSquare;
  label: string;
  value: number | string;
}) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-slate-400" />
        <p className="text-[11px] uppercase tracking-wider text-slate-500 font-medium">{label}</p>
      </div>
      <p className="mt-2 text-xl font-bold text-slate-900">{value}</p>
    </div>
  );
}

function List<T>({
  items,
  empty,
  render,
}: {
  items: T[];
  empty: string;
  render: (item: T) => React.ReactNode;
}) {
  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-100 bg-white py-10 text-center text-sm text-slate-400 shadow-sm">
        {empty}
      </div>
    );
  }
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
      {items.map(render)}
    </div>
  );
}
