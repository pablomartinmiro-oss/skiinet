"use client";

import { Fragment, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  ChevronDown,
  ChevronRight,
  Clock,
  GraduationCap,
  PackageOpen,
  Snowflake,
  Users,
} from "lucide-react";

interface RentalItem {
  id: string;
  participantName: string;
  equipmentType: string;
  size: string | null;
  qualityTier: string;
  itemStatus: string;
}

interface RentalOrderRow {
  id: string;
  clientName: string;
  stationSlug: string;
  status: string;
  pickupDate: string;
  returnDate: string;
  totalPrice: number;
  items: RentalItem[];
}

interface ClassRow {
  id: string;
  timeSlotStart: string;
  timeSlotEnd: string;
  station: string;
  discipline: string;
  level: string;
  status: string;
  instructor: { id: string; tdLevel: string; station: string; user: { name: string | null } } | null;
  meetingPoint: { id: string; name: string } | null;
  _count: { units: number; checkIns: number };
}

interface InstructorRow {
  id: string;
  name: string;
  tdLevel: string;
  station: string;
  classesCount: number;
  currentStatus: "en_clase" | "libre";
  nextClassTime: string | null;
}

interface OperationsToday {
  date: string;
  now: string;
  totals: {
    classesToday: number;
    rentalsActive: number;
    instructorsOnShift: number;
    materialPendingReturn: number;
    reservationsToday: number;
    invoicesUnpaid: number;
    invoicesUnpaidAmount: number;
    leadsNew: number;
  };
  classesToday: ClassRow[];
  rentalsToday: RentalOrderRow[];
  instructorsToday: InstructorRow[];
}

const EQUIPMENT_LABEL: Record<string, string> = {
  SKI: "Esquis",
  BOOT: "Botas",
  POLE: "Bastones",
  HELMET: "Casco",
  SNOWBOARD: "Snowboard",
  SNOWBOARD_BOOT: "Botas snow",
};

function equipmentLabel(type: string): string {
  return EQUIPMENT_LABEL[type] ?? type;
}

function formatDateShort(iso: string): string {
  return new Date(iso).toLocaleDateString("es-ES", { day: "numeric", month: "short" });
}

function rentalStatusBadge(status: string): { label: string; cls: string } {
  switch (status) {
    case "PICKED_UP":
      return { label: "Activo", cls: "bg-[#5B8C6D]/15 text-[#3F6B4E]" };
    case "RETURNED":
    case "INSPECTED":
      return { label: "Devuelto", cls: "bg-[#E8E4DE] text-[#5B544D]" };
    case "PREPARED":
      return { label: "Preparado", cls: "bg-[#D4A853]/20 text-[#876413]" };
    case "RESERVED":
      return { label: "Pendiente", cls: "bg-[#D4A853]/15 text-[#876413]" };
    case "CANCELLED":
      return { label: "Cancelado", cls: "bg-[#C75D4A]/15 text-[#9C3D2C]" };
    default:
      return { label: status, cls: "bg-[#E8E4DE] text-[#5B544D]" };
  }
}

function classStatusBadge(status: string): { label: string; cls: string } {
  switch (status) {
    case "in_progress":
      return { label: "En curso", cls: "bg-[#E87B5A]/15 text-[#B85838]" };
    case "confirmed":
      return { label: "Confirmada", cls: "bg-[#5B8C6D]/15 text-[#3F6B4E]" };
    case "draft":
      return { label: "Borrador", cls: "bg-[#D4A853]/15 text-[#876413]" };
    case "completed":
      return { label: "Completada", cls: "bg-[#E8E4DE] text-[#5B544D]" };
    case "cancelled":
      return { label: "Cancelada", cls: "bg-[#C75D4A]/15 text-[#9C3D2C]" };
    default:
      return { label: status, cls: "bg-[#E8E4DE] text-[#5B544D]" };
  }
}

export default function OperacionesHoyPage() {
  const { data, isLoading } = useQuery<OperationsToday>({
    queryKey: ["operations-today"],
    queryFn: () => fetch("/api/operations/today").then((r) => r.json()),
    refetchInterval: 60_000,
    staleTime: 30_000,
  });

  return (
    <div className="space-y-6">
      <header className="flex items-baseline justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#2D2A26]">Dashboard Operaciones</h1>
          <p className="mt-0.5 text-sm text-[#8A8580]">
            {data
              ? new Date(data.date).toLocaleDateString("es-ES", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })
              : "Cargando..."}
          </p>
        </div>
        <span className="text-xs text-[#8A8580]">Actualizacion automatica cada 60s</span>
      </header>

      <StatsBar isLoading={isLoading} totals={data?.totals} />

      <Section icon={Snowflake} title="Alquileres del dia" badge={data?.rentalsToday?.length ?? 0}>
        <RentalsTable rows={data?.rentalsToday ?? []} loading={isLoading} />
      </Section>

      <Section icon={Activity} title="Clases de hoy" badge={data?.classesToday?.length ?? 0}>
        <ClassesTable rows={data?.classesToday ?? []} loading={isLoading} />
      </Section>

      <Section icon={GraduationCap} title="Profesores en turno hoy" badge={data?.instructorsToday?.length ?? 0}>
        <InstructorsGrid rows={data?.instructorsToday ?? []} loading={isLoading} />
      </Section>
    </div>
  );
}

/* ---------------- Stats bar ---------------- */

function StatsBar({
  isLoading,
  totals,
}: {
  isLoading: boolean;
  totals?: OperationsToday["totals"];
}) {
  const items: Array<{ label: string; value: number; icon: typeof Activity }> = [
    { label: "Clases hoy", value: totals?.classesToday ?? 0, icon: Activity },
    { label: "Alquileres activos", value: totals?.rentalsActive ?? 0, icon: Snowflake },
    { label: "Profesores en turno", value: totals?.instructorsOnShift ?? 0, icon: Users },
    { label: "Material pend. devolucion", value: totals?.materialPendingReturn ?? 0, icon: PackageOpen },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {items.map((it) =>
        isLoading ? (
          <StatSkeleton key={it.label} />
        ) : (
          <StatCard key={it.label} label={it.label} value={it.value} Icon={it.icon} />
        ),
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  Icon,
}: {
  label: string;
  value: number;
  Icon: typeof Activity;
}) {
  return (
    <div className="glass-card p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wider text-[#8A8580]">{label}</p>
          <p className="mt-1 text-2xl font-bold text-[#2D2A26]">{value}</p>
        </div>
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#E87B5A]/12 text-[#E87B5A]">
          <Icon className="h-4 w-4" />
        </div>
      </div>
    </div>
  );
}

function StatSkeleton() {
  return (
    <div className="glass-card p-4">
      <div className="h-3 w-24 animate-pulse rounded bg-[#E8E4DE]" />
      <div className="mt-2 h-7 w-12 animate-pulse rounded bg-[#E8E4DE]" />
    </div>
  );
}

/* ---------------- Section wrapper ---------------- */

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
    <section className="glass-card overflow-hidden">
      <header className="flex items-center justify-between border-b border-[#E8E4DE] bg-[#FAF9F7] px-5 py-3">
        <div className="flex items-center gap-2.5">
          <Icon className="h-4 w-4 text-[#E87B5A]" />
          <h2 className="text-sm font-semibold text-[#2D2A26]">{title}</h2>
        </div>
        <span className="rounded-full bg-[#E8E4DE] px-2.5 py-0.5 text-[11px] font-semibold text-[#5B544D]">
          {badge}
        </span>
      </header>
      {children}
    </section>
  );
}

/* ---------------- Rentals ---------------- */

function RentalsTable({ rows, loading }: { rows: RentalOrderRow[]; loading: boolean }) {
  const [openIds, setOpenIds] = useState<Set<string>>(new Set());

  const toggle = (id: string) =>
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  if (loading) return <TableSkeleton rows={4} cols={6} />;
  if (rows.length === 0) return <EmptyRow label="No hay alquileres para hoy" />;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-[#FAF9F7] text-left text-[11px] font-semibold uppercase tracking-wider text-[#8A8580]">
          <tr>
            <th className="px-5 py-2.5 w-10" />
            <th className="px-5 py-2.5">Cliente</th>
            <th className="px-5 py-2.5">Material alquilado</th>
            <th className="px-5 py-2.5">Recogida</th>
            <th className="px-5 py-2.5">Devolucion</th>
            <th className="px-5 py-2.5">Estado</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#E8E4DE]">
          {rows.map((r) => {
            const open = openIds.has(r.id);
            const badge = rentalStatusBadge(r.status);
            const summary = r.items.length
              ? `${r.items.length} pieza${r.items.length === 1 ? "" : "s"}`
              : "Sin items";
            return (
              <Fragment key={r.id}>
                <tr className="hover:bg-[#FAF9F7]">
                  <td className="px-5 py-3">
                    <button
                      type="button"
                      onClick={() => toggle(r.id)}
                      className="flex h-6 w-6 items-center justify-center rounded-md text-[#8A8580] hover:bg-[#E8E4DE] hover:text-[#2D2A26]"
                      aria-label={open ? "Cerrar detalle" : "Ver detalle"}
                    >
                      {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </button>
                  </td>
                  <td className="px-5 py-3">
                    <p className="font-medium text-[#2D2A26]">{r.clientName}</p>
                    <p className="text-xs text-[#8A8580]">{r.stationSlug}</p>
                  </td>
                  <td className="px-5 py-3 text-[#5B544D]">{summary}</td>
                  <td className="px-5 py-3 text-[#5B544D]">{formatDateShort(r.pickupDate)}</td>
                  <td className="px-5 py-3 text-[#5B544D]">{formatDateShort(r.returnDate)}</td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${badge.cls}`}>
                      {badge.label}
                    </span>
                  </td>
                </tr>
                {open && (
                  <tr className="bg-[#FAF9F7]/50">
                    <td />
                    <td colSpan={5} className="px-5 py-3">
                      {r.items.length === 0 ? (
                        <p className="text-xs text-[#8A8580]">Sin items registrados</p>
                      ) : (
                        <ul className="space-y-1">
                          {r.items.map((it) => (
                            <li key={it.id} className="flex items-center justify-between gap-3 text-xs text-[#5B544D]">
                              <span className="font-medium text-[#2D2A26]">{it.participantName}</span>
                              <span className="flex-1 text-[#5B544D]">
                                {equipmentLabel(it.equipmentType)}
                                {it.size ? ` · talla ${it.size}` : ""} · {it.qualityTier}
                              </span>
                              <span className="text-[10px] uppercase tracking-wider text-[#8A8580]">{it.itemStatus}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/* ---------------- Classes ---------------- */

function ClassesTable({ rows, loading }: { rows: ClassRow[]; loading: boolean }) {
  if (loading) return <TableSkeleton rows={4} cols={6} />;
  if (rows.length === 0) return <EmptyRow label="No hay clases programadas para hoy" />;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-[#FAF9F7] text-left text-[11px] font-semibold uppercase tracking-wider text-[#8A8580]">
          <tr>
            <th className="px-5 py-2.5">Hora</th>
            <th className="px-5 py-2.5">Instructor</th>
            <th className="px-5 py-2.5">Disciplina / Nivel</th>
            <th className="px-5 py-2.5">Alumnos</th>
            <th className="px-5 py-2.5">Estacion</th>
            <th className="px-5 py-2.5">Estado</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#E8E4DE]">
          {rows.map((c) => {
            const badge = classStatusBadge(c.status);
            return (
              <tr key={c.id} className="hover:bg-[#FAF9F7]">
                <td className="px-5 py-3 font-medium text-[#2D2A26]">
                  {c.timeSlotStart}–{c.timeSlotEnd}
                </td>
                <td className="px-5 py-3">
                  {c.instructor ? (
                    <>
                      <p className="font-medium text-[#2D2A26]">{c.instructor.user?.name ?? "Sin nombre"}</p>
                      <p className="text-xs text-[#8A8580]">{c.instructor.tdLevel}</p>
                    </>
                  ) : (
                    <span className="text-xs font-medium text-[#876413]">Sin asignar</span>
                  )}
                </td>
                <td className="px-5 py-3 text-[#5B544D]">
                  {c.discipline} · Nivel {c.level}
                </td>
                <td className="px-5 py-3 text-[#5B544D]">{c._count.units}</td>
                <td className="px-5 py-3 text-[#5B544D]">{c.station}</td>
                <td className="px-5 py-3">
                  <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${badge.cls}`}>
                    {badge.label}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/* ---------------- Instructors ---------------- */

function InstructorsGrid({ rows, loading }: { rows: InstructorRow[]; loading: boolean }) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-3 p-5 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-xl bg-[#E8E4DE]" />
        ))}
      </div>
    );
  }
  if (rows.length === 0) return <EmptyRow label="No hay profesores en turno hoy" />;

  return (
    <div className="grid grid-cols-1 gap-3 p-5 md:grid-cols-2 lg:grid-cols-3">
      {rows.map((p) => {
        const inClass = p.currentStatus === "en_clase";
        return (
          <div
            key={p.id}
            className="rounded-xl border border-[#E8E4DE] bg-[#FAF9F7] p-4 transition-colors hover:bg-white"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-[#2D2A26]">{p.name}</p>
                <p className="mt-0.5 text-xs text-[#8A8580]">
                  {p.tdLevel} · {p.station}
                </p>
              </div>
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                  inClass ? "bg-[#E87B5A]/15 text-[#B85838]" : "bg-[#5B8C6D]/15 text-[#3F6B4E]"
                }`}
              >
                {inClass ? "En clase" : "Libre"}
              </span>
            </div>
            <div className="mt-3 flex items-center justify-between text-xs text-[#5B544D]">
              <span>{p.classesCount} clase{p.classesCount === 1 ? "" : "s"} hoy</span>
              {p.nextClassTime && !inClass && (
                <span className="flex items-center gap-1 text-[#8A8580]">
                  <Clock className="h-3 w-3" />
                  Proxima {p.nextClassTime}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ---------------- Helpers ---------------- */

function TableSkeleton({ rows, cols }: { rows: number; cols: number }) {
  return (
    <div className="p-5 space-y-2">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="grid gap-3" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
          {Array.from({ length: cols }).map((__, c) => (
            <div key={c} className="h-4 animate-pulse rounded bg-[#E8E4DE]" />
          ))}
        </div>
      ))}
    </div>
  );
}

function EmptyRow({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-5 py-12 text-[#8A8580]">
      <Clock className="h-7 w-7 opacity-40" />
      <p className="text-sm">{label}</p>
    </div>
  );
}
