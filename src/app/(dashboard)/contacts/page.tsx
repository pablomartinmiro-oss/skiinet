"use client";

import { useState, useMemo } from "react";
import { Users, ChevronLeft, ChevronRight } from "lucide-react";
import { useContacts } from "@/hooks/useGHL";
import { TableSkeleton } from "@/components/shared/LoadingSkeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { GHLEmptyState } from "@/components/shared/GHLEmptyState";
import { ContactsTable } from "./_components/ContactsTable";
import { ContactsSearch } from "./_components/ContactsSearch";
import { SourceFilter } from "./_components/SourceFilter";
import { AdvancedFilters, DEFAULT_FILTERS, countActiveFilters } from "./_components/AdvancedFilters";
import type { ContactFilters } from "./_components/AdvancedFilters";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { exportToCSV } from "@/lib/utils/export";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 50;

function getPageNumbers(current: number, total: number): (number | "ellipsis")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | "ellipsis")[] = [1];
  if (current > 3) pages.push("ellipsis");
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  for (let i = start; i <= end; i++) pages.push(i);
  if (current < total - 2) pages.push("ellipsis");
  if (total > 1) pages.push(total);
  return pages;
}

export default function ContactsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState<string | null>(null);
  const [advFilters, setAdvFilters] = useState<ContactFilters>(DEFAULT_FILTERS);

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
    clearTimeout((globalThis as unknown as { __searchTimeout?: ReturnType<typeof setTimeout> }).__searchTimeout);
    (globalThis as unknown as { __searchTimeout?: ReturnType<typeof setTimeout> }).__searchTimeout = setTimeout(() => {
      setDebouncedSearch(value);
    }, 300);
  };

  const { data, isLoading, isFetching } = useContacts({
    page,
    limit: PAGE_SIZE,
    query: debouncedSearch,
  });

  const contacts = useMemo(() => data?.contacts ?? [], [data]);
  const total = data?.meta?.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  const sources = useMemo(() => {
    const set = new Set<string>();
    for (const c of contacts) {
      if (c.source) set.add(c.source);
    }
    return Array.from(set).sort();
  }, [contacts]);

  const availableTags = useMemo(() => {
    const set = new Set<string>();
    for (const c of contacts) {
      if (c.tags) {
        for (const tag of c.tags) set.add(tag);
      }
    }
    return Array.from(set).sort();
  }, [contacts]);

  const filtered = useMemo(() => {
    let result = contacts;
    if (sourceFilter) {
      result = result.filter((c) => c.source === sourceFilter);
    }
    // Date range filter
    if (advFilters.dateRange) {
      const now = Date.now();
      let cutoff: number | null = null;
      if (advFilters.dateRange === "7d") cutoff = now - 7 * 86400000;
      else if (advFilters.dateRange === "30d") cutoff = now - 30 * 86400000;
      else if (advFilters.dateRange === "90d") cutoff = now - 90 * 86400000;
      else if (advFilters.dateRange === "custom") {
        const from = advFilters.customDateFrom ? new Date(advFilters.customDateFrom).getTime() : null;
        const to = advFilters.customDateTo ? new Date(advFilters.customDateTo).getTime() + 86400000 : null;
        result = result.filter((c) => {
          const added = new Date(c.dateAdded).getTime();
          if (from && added < from) return false;
          if (to && added > to) return false;
          return true;
        });
        cutoff = null; // handled above
      }
      if (cutoff !== null) {
        result = result.filter((c) => new Date(c.dateAdded).getTime() >= cutoff!);
      }
    }
    // Has email
    if (advFilters.hasEmail === true) result = result.filter((c) => !!c.email);
    if (advFilters.hasEmail === false) result = result.filter((c) => !c.email);
    // Has phone
    if (advFilters.hasPhone === true) result = result.filter((c) => !!c.phone);
    if (advFilters.hasPhone === false) result = result.filter((c) => !c.phone);
    // Tags (multi-select: contact must have ALL selected tags)
    if (advFilters.tags.length > 0) {
      result = result.filter((c) =>
        advFilters.tags.every((tag) => c.tags?.includes(tag))
      );
    }
    return result;
  }, [contacts, sourceFilter, advFilters]);

  const pageNumbers = getPageNumbers(page, totalPages);

  return (
    <GHLEmptyState message="No hay contactos. Conecta GoHighLevel para importar tus contactos.">
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Contactos</h1>
          <p className="text-sm text-slate-500">Gestiona tu base de datos de contactos</p>
        </div>
        <span className="text-sm text-slate-500">
          {total.toLocaleString("es-ES")} contactos
          {isFetching && !isLoading && <span className="ml-2 text-xs text-coral">cargando...</span>}
        </span>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <ContactsSearch value={search} onChange={handleSearch} />
          <AdvancedFilters
            filters={advFilters}
            onChange={(f) => { setAdvFilters(f); setPage(1); }}
            availableTags={availableTags}
          />
        </div>
        {sources.length > 0 && (
          <SourceFilter
            sources={sources}
            selected={sourceFilter}
            onSelect={setSourceFilter}
          />
        )}
      </div>

      {isLoading ? (
        <TableSkeleton rows={8} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No se encontraron contactos"
          description={
            search || sourceFilter || countActiveFilters(advFilters) > 0
              ? "Prueba ajustando tu busqueda o filtros"
              : "Los contactos apareceran aqui una vez sincronizados con GHL"
          }
        />
      ) : (
        <div className="overflow-x-auto glass-card">
          <ContactsTable contacts={filtered} />
        </div>
      )}

      {/* Pagination with page numbers */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500">
            Mostrando {((page - 1) * PAGE_SIZE) + 1}-{Math.min(page * PAGE_SIZE, total)} de {total.toLocaleString("es-ES")}
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            {pageNumbers.map((p, idx) =>
              p === "ellipsis" ? (
                <span key={`ellipsis-${idx}`} className="px-1 text-xs text-slate-500">
                  ...
                </span>
              ) : (
                <Button
                  key={p}
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p)}
                  className={cn(
                    "h-8 w-8 p-0 text-xs",
                    page === p && "bg-coral text-white border-blue-500 hover:bg-blue-600-hover hover:text-white"
                  )}
                >
                  {p}
                </Button>
              )
            )}

            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
    </GHLEmptyState>
  );
}
