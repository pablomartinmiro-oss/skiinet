"use client";

import { useState, Fragment, useMemo } from "react";
import {
  Plus, Trash2, ChevronDown, ChevronRight, Scale, FileText, Search,
} from "lucide-react";
import { toast } from "sonner";
import {
  useReavExpedients, useCreateReavExpedient, useUpdateReavExpedient,
  useDeleteReavExpedient, useAddReavCost, useDeleteReavCost,
  useAddReavDocument, useDeleteReavDocument,
} from "@/hooks/useReav";
import type { ReavExpedient } from "@/hooks/useReav";
import { useInvoices } from "@/hooks/useFinance";
import { PageSkeleton } from "@/components/shared/LoadingSkeleton";
import ExpedientModal from "./ExpedientModal";
import ExpedientDetail from "./ExpedientDetail";

const fmt = new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" });
const OP_LABELS: Record<string, string> = {
  standard: "Estándar", intra_eu: "Intra-UE", extra_eu: "Extra-UE", mixed: "Mixta",
};
const PAGE_SIZE = 15;
const TH = "px-4 py-3 text-xs font-medium text-[#8A8580] uppercase tracking-wider";
const BTN_PAGE = "rounded-[10px] px-3 py-1.5 text-xs font-medium text-[#2D2A26] border border-[#E8E4DE] hover:bg-[#FAF9F7] disabled:opacity-40 disabled:cursor-not-allowed transition-colors";

// Generic mutation wrapper — avoids repeating try/catch
async function mutate<T>(fn: () => Promise<T>, ok: string, err: string) {
  try { await fn(); toast.success(ok); }
  catch { toast.error(err); }
}

// Paginator helper (kept in-file per spec)
function Paginator({ page, totalPages, from, to, total, onPrev, onNext }: {
  page: number; totalPages: number; from: number; to: number;
  total: number; onPrev: () => void; onNext: () => void;
}) {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-[#E8E4DE]">
      <span className="text-xs text-[#8A8580]">Mostrando {from}–{to} de {total}</span>
      <div className="flex gap-2">
        <button onClick={onPrev} disabled={page === 1} className={BTN_PAGE}>Anterior</button>
        <button onClick={onNext} disabled={page === totalPages} className={BTN_PAGE}>Siguiente</button>
      </div>
    </div>
  );
}

export default function ExpedientsTable() {
  const { data, isLoading }                         = useReavExpedients();
  const { data: invoiceData, isLoading: invLoading } = useInvoices();
  const createExp = useCreateReavExpedient();
  const updateExp = useUpdateReavExpedient();
  const deleteExp = useDeleteReavExpedient();
  const addCost   = useAddReavCost();
  const delCost   = useDeleteReavCost();
  const addDoc    = useAddReavDocument();
  const delDoc    = useDeleteReavDocument();

  const [modalOpen,  setModalOpen]  = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [search,     setSearch]     = useState("");
  const [opFilter,   setOpFilter]   = useState("todos");
  const [page,       setPage]       = useState(1);

  // All hooks must run on every render — derive `filtered` from `data`
  // directly so the useMemo never sits behind a conditional return below
  // (was the source of the React #310 crash).
  const filtered = useMemo(() => {
    const all = data?.expedients ?? [];
    const q = search.trim().toLowerCase();
    return all.filter((e) => {
      if (opFilter !== "todos" && e.operationType !== opFilter) return false;
      if (!q) return true;
      return (e.invoice?.number ?? "").toLowerCase().includes(q)
          || (OP_LABELS[e.operationType] ?? e.operationType).toLowerCase().includes(q);
    });
  }, [data?.expedients, search, opFilter]);

  if (isLoading || invLoading) return <PageSkeleton />;

  const expedients = data?.expedients     ?? [];
  const invoices   = invoiceData?.invoices ?? [];
  const resetPage = () => setPage(1);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage   = Math.min(page, totalPages);
  const from       = filtered.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1;
  const to         = Math.min(safePage * PAGE_SIZE, filtered.length);
  const pageSlice  = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const handleCreate = async (d: {
    invoiceId: string; operationType: string; costPercentage: number;
    marginPercentage: number; marginAmount: number; taxableBase: number; vat: number;
  }) => {
    await mutate(() => createExp.mutateAsync(d), "Expediente REAV creado", "Error al crear expediente");
    setModalOpen(false);
  };

  const handleUpdate = (id: string, d: Partial<{
    operationType: string; costPercentage: number; marginPercentage: number;
    marginAmount: number; taxableBase: number; vat: number;
  }>) => mutate(() => updateExp.mutateAsync({ id, ...d }), "Expediente actualizado", "Error al actualizar expediente");

  const handleDelete = async (e: ReavExpedient) => {
    if (!confirm("¿Eliminar este expediente REAV?")) return;
    await mutate(() => deleteExp.mutateAsync(e.id), "Expediente eliminado", "Error al eliminar expediente");
    if (expandedId === e.id) setExpandedId(null);
  };

  const handleAddCost = (expId: string, d: { description: string; cost: number; notes?: string | null }) =>
    mutate(() => addCost.mutateAsync({ expedientId: expId, ...d }), "Coste añadido", "Error al añadir coste");

  const handleDelCost = (expId: string, costId: string) =>
    mutate(() => delCost.mutateAsync({ expedientId: expId, costId }), "Coste eliminado", "Error al eliminar coste");

  const handleAddDoc = (expId: string, d: { type: string; url: string }) =>
    mutate(() => addDoc.mutateAsync({ expedientId: expId, ...d }), "Documento añadido", "Error al añadir documento");

  const handleDelDoc = (expId: string, docId: string) =>
    mutate(() => delDoc.mutateAsync({ expedientId: expId, docId }), "Documento eliminado", "Error al eliminar documento");

  return (
    <div className="space-y-4">
      {/* toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8A8580]" />
          <input
            type="text"
            placeholder="Buscar por nº factura o tipo…"
            value={search}
            onChange={(ev) => { setSearch(ev.target.value); resetPage(); }}
            className="w-full rounded-[10px] border border-[#E8E4DE] bg-white pl-9 pr-4 py-2 text-sm text-[#2D2A26] placeholder:text-[#8A8580] focus:outline-none focus:ring-2 focus:ring-[#E87B5A]/30 focus:border-[#E87B5A] transition-colors"
          />
        </div>
        <select
          value={opFilter}
          onChange={(ev) => { setOpFilter(ev.target.value); resetPage(); }}
          className="rounded-[10px] border border-[#E8E4DE] bg-white px-3 py-2 text-sm text-[#2D2A26] focus:outline-none focus:ring-2 focus:ring-[#E87B5A]/30 focus:border-[#E87B5A] transition-colors"
        >
          <option value="todos">Todos los tipos</option>
          <option value="standard">Estándar</option>
          <option value="intra_eu">Intra-UE</option>
          <option value="extra_eu">Extra-UE</option>
          <option value="mixed">Mixta</option>
        </select>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 rounded-[10px] bg-[#E87B5A] px-4 py-2 text-sm font-medium text-white hover:bg-[#D56E4F] transition-colors whitespace-nowrap"
        >
          <Plus className="h-4 w-4" /> Nuevo Expediente
        </button>
      </div>

      <p className="text-xs text-[#8A8580]">
        {filtered.length} expediente{filtered.length !== 1 ? "s" : ""}
        {filtered.length !== expedients.length && ` (de ${expedients.length} total)`}
      </p>

      {/* content */}
      {expedients.length === 0 ? (
        <div className="rounded-2xl bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-12 text-center">
          <Scale className="mx-auto h-10 w-10 text-[#8A8580] mb-3" />
          <p className="text-sm text-[#8A8580]">No hay expedientes REAV creados</p>
          <p className="text-xs text-[#8A8580] mt-1">Crea tu primer expediente vinculado a una factura</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-10 text-center">
          <Search className="mx-auto h-8 w-8 text-[#8A8580] mb-3" />
          <p className="text-sm text-[#8A8580]">Sin resultados para los filtros aplicados</p>
        </div>
      ) : (
        <div className="rounded-2xl bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#E8E4DE] bg-[#FAF9F7]/50">
                  <th className="px-4 py-3 w-8" />
                  <th className={`${TH} text-left`}>Nº Factura</th>
                  <th className={`${TH} text-left`}>Tipo operación</th>
                  <th className={`${TH} text-right`}>Coste %</th>
                  <th className={`${TH} text-right`}>Margen %</th>
                  <th className={`${TH} text-right`}>Base imponible</th>
                  <th className={`${TH} text-right`}>IVA</th>
                  <th className={`${TH} text-center`}>Costes</th>
                  <th className={`${TH} text-right`}>Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E4DE]">
                {pageSlice.map((e) => (
                  <Fragment key={e.id}>
                    <tr className="hover:bg-[#FAF9F7]/30 transition-colors">
                      <td className="px-4 py-4">
                        <button onClick={() => setExpandedId(expandedId === e.id ? null : e.id)}
                          className="text-[#8A8580] hover:text-[#2D2A26]">
                          {expandedId === e.id
                            ? <ChevronDown className="h-4 w-4" />
                            : <ChevronRight className="h-4 w-4" />}
                        </button>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-[#8A8580]" />
                          <span className="font-medium text-sm text-[#2D2A26]">{e.invoice?.number || "—"}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className="inline-flex rounded-[6px] bg-[#FAF9F7] px-2 py-0.5 text-xs font-medium text-[#8A8580]">
                          {OP_LABELS[e.operationType] ?? e.operationType}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right text-sm text-[#2D2A26]">{e.costPercentage.toFixed(2)}%</td>
                      <td className="px-4 py-4 text-right text-sm text-[#2D2A26]">{e.marginPercentage.toFixed(2)}%</td>
                      <td className="px-4 py-4 text-right text-sm text-[#2D2A26]">{fmt.format(e.taxableBase)}</td>
                      <td className="px-4 py-4 text-right text-sm text-[#2D2A26]">{e.vat.toFixed(2)}%</td>
                      <td className="px-4 py-4 text-center text-sm text-[#8A8580]">{e._count?.costs ?? 0}</td>
                      <td className="px-4 py-4 text-right">
                        <button onClick={() => handleDelete(e)} title="Eliminar"
                          className="rounded-[10px] p-1.5 text-[#8A8580] hover:bg-red-50 hover:text-[#C75D4A] transition-colors">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                    {expandedId === e.id && (
                      <tr><td colSpan={9} className="p-0">
                        <ExpedientDetail
                          expedient={e}
                          onUpdate={(d) => handleUpdate(e.id, d)}
                          onAddCost={(d) => handleAddCost(e.id, d)}
                          onDeleteCost={(cId) => handleDelCost(e.id, cId)}
                          onAddDocument={(d) => handleAddDoc(e.id, d)}
                          onDeleteDocument={(dId) => handleDelDoc(e.id, dId)}
                        />
                      </td></tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length > PAGE_SIZE && (
            <Paginator page={safePage} totalPages={totalPages} from={from} to={to} total={filtered.length}
              onPrev={() => setPage((p) => Math.max(1, p - 1))}
              onNext={() => setPage((p) => Math.min(totalPages, p + 1))}
            />
          )}
        </div>
      )}

      <ExpedientModal invoices={invoices} isOpen={modalOpen}
        onClose={() => setModalOpen(false)} onSave={handleCreate} />
    </div>
  );
}
