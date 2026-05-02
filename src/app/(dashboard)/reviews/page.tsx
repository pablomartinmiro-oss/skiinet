"use client";

import { useState, useMemo } from "react";
import { Star, Search } from "lucide-react";
import { useReviews } from "@/hooks/useReviews";
import { PageSkeleton } from "@/components/shared/LoadingSkeleton";
import ReviewsTable from "./_components/ReviewsTable";

const inputCls =
  "w-full rounded-[10px] border border-[#E8E4DE] px-3 py-2 text-sm text-[#2D2A26] placeholder:text-[#8A8580] focus:border-[#E87B5A] focus:outline-none focus:ring-1 focus:ring-[#E87B5A]";

const ENTITY_TYPES = [
  { value: "", label: "Todos los tipos" },
  { value: "experience", label: "Experiencia" },
  { value: "hotel", label: "Hotel" },
  { value: "spa", label: "Spa" },
  { value: "restaurant", label: "Restaurante" },
];

const STATUSES = [
  { value: "", label: "Todos" },
  { value: "pending", label: "Pendientes" },
  { value: "approved", label: "Aprobadas" },
  { value: "rejected", label: "Rechazadas" },
];

const STAR_PILLS = [0, 5, 4, 3, 2, 1] as const;

function StatTile({
  label,
  value,
  sub,
}: {
  label: string;
  value: string | number;
  sub?: string;
}) {
  return (
    <div className="flex-1 min-w-[120px] rounded-2xl bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)] px-5 py-4">
      <p className="text-xs text-[#8A8580] mb-1">{label}</p>
      <p className="text-2xl font-bold text-[#2D2A26] leading-none">{value}</p>
      {sub && <p className="text-xs text-[#8A8580] mt-1">{sub}</p>}
    </div>
  );
}

function StarDistribution({
  counts,
  total,
}: {
  counts: Record<number, number>;
  total: number;
}) {
  return (
    <div className="rounded-2xl bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)] px-5 py-4">
      <p className="text-xs font-medium text-[#8A8580] mb-3 uppercase tracking-wider">
        Distribución de valoraciones
      </p>
      <div className="space-y-2">
        {[5, 4, 3, 2, 1].map((star) => {
          const count = counts[star] ?? 0;
          const pct = total > 0 ? (count / total) * 100 : 0;
          return (
            <div key={star} className="flex items-center gap-2">
              <span className="text-xs text-[#8A8580] w-4 shrink-0">{star}</span>
              <Star className="h-3 w-3 fill-[#D4A853] text-[#D4A853] shrink-0" />
              <div className="flex-1 h-2 rounded-full bg-[#F2EEE8] overflow-hidden">
                <div
                  className="h-full rounded-full bg-[#D4A853] transition-all duration-300"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="text-xs text-[#8A8580] w-5 text-right shrink-0">
                {count}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function ReviewsPage() {
  const [filterStatus, setFilterStatus] = useState("");
  const [filterEntity, setFilterEntity] = useState("");
  const [search, setSearch] = useState("");
  const [starFilter, setStarFilter] = useState<number>(0);

  const { data, isLoading } = useReviews(
    filterStatus || undefined,
    filterEntity || undefined
  );

  const reviews = data?.reviews ?? [];

  // Derived stats (from all fetched reviews, before client-side filters)
  const total = reviews.length;
  const avgRating =
    total > 0
      ? reviews.reduce((acc, r) => acc + r.rating, 0) / total
      : 0;
  const respondidas = reviews.filter((r) => r.reply).length;
  const pctRespondidas =
    total > 0 ? Math.round((respondidas / total) * 100) : 0;
  const pendingCount = reviews.filter((r) => r.status === "pending").length;

  const starCounts = useMemo(() => {
    const map: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    reviews.forEach((r) => {
      if (r.rating >= 1 && r.rating <= 5) map[r.rating]++;
    });
    return map;
  }, [reviews]);

  // Client-side filters: search + star
  const filtered = useMemo(() => {
    let list = reviews;
    if (starFilter > 0) list = list.filter((r) => r.rating === starFilter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (r) =>
          r.authorName.toLowerCase().includes(q) ||
          (r.body ?? "").toLowerCase().includes(q)
      );
    }
    return list;
  }, [reviews, starFilter, search]);

  if (isLoading) return <PageSkeleton />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#2D2A26]">Reseñas</h1>
          {pendingCount > 0 && (
            <p className="text-sm text-[#D4A853] mt-1">
              {pendingCount} reseña{pendingCount !== 1 ? "s" : ""} pendiente
              {pendingCount !== 1 ? "s" : ""} de moderación
            </p>
          )}
        </div>
      </div>

      {/* Stat tiles */}
      <div className="flex gap-3 flex-wrap">
        <StatTile
          label="Puntuación media"
          value={
            total > 0
              ? `${avgRating.toFixed(1)} ★`
              : "—"
          }
          sub={`de ${total} reseña${total !== 1 ? "s" : ""}`}
        />
        <StatTile
          label="Total reseñas"
          value={total}
        />
        <StatTile
          label="% respondidas"
          value={total > 0 ? `${pctRespondidas}%` : "—"}
          sub={`${respondidas} de ${total}`}
        />
      </div>

      {/* Star distribution */}
      {total > 0 && (
        <StarDistribution counts={starCounts} total={total} />
      )}

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Search */}
        <div className="relative w-56">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#8A8580]" />
          <input
            type="text"
            placeholder="Buscar reseñas..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={inputCls + " pl-8"}
          />
        </div>

        {/* Status */}
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className={inputCls + " w-40"}
        >
          {STATUSES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>

        {/* Entity type */}
        <select
          value={filterEntity}
          onChange={(e) => setFilterEntity(e.target.value)}
          className={inputCls + " w-48"}
        >
          {ENTITY_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>

        {/* Star pills */}
        <div className="flex items-center gap-1.5">
          {STAR_PILLS.map((s) => (
            <button
              key={s}
              onClick={() => setStarFilter(s === starFilter ? 0 : s)}
              className={`rounded-[6px] px-2.5 py-1 text-xs font-medium transition-colors ${
                starFilter === s
                  ? "bg-[#D4A853] text-white"
                  : "bg-[#FAF9F7] border border-[#E8E4DE] text-[#8A8580] hover:border-[#D4A853] hover:text-[#D4A853]"
              }`}
            >
              {s === 0 ? "Todas" : `${s}★`}
            </button>
          ))}
        </div>

        <p className="text-sm text-[#8A8580] ml-auto">
          {filtered.length} reseña{filtered.length !== 1 ? "s" : ""}
        </p>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-12 text-center">
          <Star className="mx-auto h-10 w-10 text-[#8A8580] mb-3" />
          <p className="text-sm text-[#8A8580]">No hay reseñas</p>
          <p className="text-xs text-[#8A8580] mt-1">
            Las reseñas públicas aparecerán aquí para moderación
          </p>
        </div>
      ) : (
        <ReviewsTable reviews={filtered} />
      )}
    </div>
  );
}
