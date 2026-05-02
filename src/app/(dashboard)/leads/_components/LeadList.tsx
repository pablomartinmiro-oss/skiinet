"use client";

import { useState } from "react";
import type { Lead } from "@/hooks/useLeads";
import { useDeleteLead, useUpdateLead } from "@/hooks/useLeads";
import {
  LEAD_STAGES,
  LEAD_SOURCES,
  scoreColor,
  statusBadgeClass,
  sourceLabel,
  timeSince,
} from "./constants";
import { Trash2, ChevronUp, ChevronDown } from "lucide-react";
import { toast } from "sonner";

type SortKey = "name" | "score" | "createdAt" | "status";

export function LeadList({
  leads,
  onSelect,
}: {
  leads: Lead[];
  onSelect: (lead: Lead) => void;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [sortKey, setSortKey] = useState<SortKey>("createdAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const deleteLead = useDeleteLead();
  const updateLead = useUpdateLead();

  const sorted = [...leads].sort((a, b) => {
    const dir = sortDir === "asc" ? 1 : -1;
    if (sortKey === "name") return a.name.localeCompare(b.name) * dir;
    if (sortKey === "score") return (a.score - b.score) * dir;
    if (sortKey === "status") return a.status.localeCompare(b.status) * dir;
    return (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) * dir;
  });

  const allSelected = sorted.length > 0 && sorted.every((l) => selected.has(l.id));

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(sorted.map((l) => l.id)));
  }
  function toggleOne(id: string) {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  }
  function setSort(key: SortKey) {
    if (sortKey === key) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  async function bulkDelete() {
    if (selected.size === 0) return;
    if (!confirm(`Eliminar ${selected.size} leads?`)) return;
    await Promise.all(Array.from(selected).map((id) => deleteLead.mutateAsync(id)));
    toast.success(`${selected.size} leads eliminados`);
    setSelected(new Set());
  }

  async function bulkStatus(status: string) {
    if (selected.size === 0) return;
    await Promise.all(
      Array.from(selected).map((id) => updateLead.mutateAsync({ id, status }))
    );
    toast.success(`Estado actualizado en ${selected.size} leads`);
    setSelected(new Set());
  }

  return (
    <div className="rounded-xl border border-border bg-white">
      {selected.size > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-slate-50 px-4 py-2.5">
          <span className="text-sm font-medium text-slate-700">
            {selected.size} seleccionados
          </span>
          <div className="flex flex-wrap items-center gap-2">
            <select
              onChange={(e) => {
                if (e.target.value) bulkStatus(e.target.value);
                e.target.value = "";
              }}
              defaultValue=""
              className="rounded-lg border border-border bg-white px-2 py-1.5 text-sm"
            >
              <option value="" disabled>
                Cambiar estado
              </option>
              {LEAD_STAGES.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
            <button
              onClick={bulkDelete}
              className="flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-sm font-medium text-rose-700 hover:bg-rose-100"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Eliminar
            </button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-3 py-2.5 w-10">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleAll}
                  aria-label="Seleccionar todo"
                />
              </th>
              <SortHeader label="Nombre" k="name" sortKey={sortKey} sortDir={sortDir} onSort={setSort} />
              <th className="px-3 py-2.5 text-left">Email</th>
              <th className="px-3 py-2.5 text-left">Teléfono</th>
              <th className="px-3 py-2.5 text-left">Origen</th>
              <SortHeader label="Estado" k="status" sortKey={sortKey} sortDir={sortDir} onSort={setSort} />
              <SortHeader label="Score" k="score" sortKey={sortKey} sortDir={sortDir} onSort={setSort} align="right" />
              <th className="px-3 py-2.5 text-left">Asignado</th>
              <SortHeader label="Fecha" k="createdAt" sortKey={sortKey} sortDir={sortDir} onSort={setSort} />
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-3 py-12 text-center text-sm text-slate-400">
                  No hay leads que coincidan con los filtros
                </td>
              </tr>
            ) : (
              sorted.map((lead) => (
                <tr
                  key={lead.id}
                  className="border-t border-border hover:bg-slate-50 cursor-pointer"
                  onClick={() => onSelect(lead)}
                >
                  <td
                    className="px-3 py-3"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <input
                      type="checkbox"
                      checked={selected.has(lead.id)}
                      onChange={() => toggleOne(lead.id)}
                      aria-label={`Seleccionar ${lead.name}`}
                    />
                  </td>
                  <td className="px-3 py-3">
                    <div className="font-semibold text-slate-900">{lead.name}</div>
                    {lead.company && (
                      <div className="text-xs text-slate-500">{lead.company}</div>
                    )}
                  </td>
                  <td className="px-3 py-3 text-slate-600">{lead.email ?? "-"}</td>
                  <td className="px-3 py-3 text-slate-600">{lead.phone ?? "-"}</td>
                  <td className="px-3 py-3">
                    <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                      {sourceLabel(lead.source)}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusBadgeClass(
                        lead.status
                      )}`}
                    >
                      {LEAD_STAGES.find((s) => s.id === lead.status)?.label ?? lead.status}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-right">
                    <span
                      className={`inline-flex items-center rounded-md border px-1.5 py-0.5 text-xs font-bold ${scoreColor(
                        lead.score
                      )}`}
                    >
                      {lead.score}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-slate-600">
                    {lead.assignedUser?.name ?? lead.assignedUser?.email ?? "-"}
                  </td>
                  <td className="px-3 py-3 text-xs text-slate-500">
                    {timeSince(lead.createdAt)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SortHeader({
  label,
  k,
  sortKey,
  sortDir,
  onSort,
  align = "left",
}: {
  label: string;
  k: SortKey;
  sortKey: SortKey;
  sortDir: "asc" | "desc";
  onSort: (k: SortKey) => void;
  align?: "left" | "right";
}) {
  const active = sortKey === k;
  return (
    <th className={`px-3 py-2.5 ${align === "right" ? "text-right" : "text-left"}`}>
      <button
        onClick={() => onSort(k)}
        className="inline-flex items-center gap-1 hover:text-slate-900"
      >
        {label}
        {active && (sortDir === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
      </button>
    </th>
  );
}

export function LeadFilterBar({
  filters,
  onChange,
}: {
  filters: { status?: string; source?: string; minScore?: number; search?: string };
  onChange: (f: { status?: string; source?: string; minScore?: number; search?: string }) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <input
        type="search"
        placeholder="Buscar por nombre, email, telefono..."
        value={filters.search ?? ""}
        onChange={(e) => onChange({ ...filters, search: e.target.value || undefined })}
        className="flex-1 min-w-[200px] rounded-lg border border-border bg-white px-3 py-2 text-sm"
      />
      <select
        value={filters.status ?? ""}
        onChange={(e) => onChange({ ...filters, status: e.target.value || undefined })}
        className="rounded-lg border border-border bg-white px-2 py-2 text-sm"
      >
        <option value="">Todos los estados</option>
        {LEAD_STAGES.map((s) => (
          <option key={s.id} value={s.id}>
            {s.label}
          </option>
        ))}
      </select>
      <select
        value={filters.source ?? ""}
        onChange={(e) => onChange({ ...filters, source: e.target.value || undefined })}
        className="rounded-lg border border-border bg-white px-2 py-2 text-sm"
      >
        <option value="">Todos los origenes</option>
        {LEAD_SOURCES.map((s) => (
          <option key={s.id} value={s.id}>
            {s.label}
          </option>
        ))}
      </select>
      <select
        value={filters.minScore?.toString() ?? ""}
        onChange={(e) =>
          onChange({
            ...filters,
            minScore: e.target.value ? Number(e.target.value) : undefined,
          })
        }
        className="rounded-lg border border-border bg-white px-2 py-2 text-sm"
      >
        <option value="">Cualquier score</option>
        <option value="80">Score &ge; 80</option>
        <option value="50">Score &ge; 50</option>
        <option value="20">Score &ge; 20</option>
      </select>
    </div>
  );
}
