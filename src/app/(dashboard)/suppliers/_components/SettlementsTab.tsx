"use client";

import { useState } from "react";
import { Plus, Trash2, FileText, X, Eye } from "lucide-react";
import { toast } from "sonner";
import {
  useSettlements,
  useCreateSettlement,
  useUpdateSettlement,
  useDeleteSettlement,
  useSuppliers,
} from "@/hooks/useSuppliers";
import type { Settlement } from "@/hooks/useSuppliers";
import { PageSkeleton } from "@/components/shared/LoadingSkeleton";
import SettlementDetailModal from "./SettlementDetailModal";

const inputCls =
  "w-full rounded-[10px] border border-[#E8E4DE] px-3 py-2 text-sm text-[#2D2A26] placeholder:text-[#8A8580] focus:border-[#E87B5A] focus:outline-none focus:ring-1 focus:ring-[#E87B5A]";
const selectCls =
  "w-full rounded-[10px] border border-[#E8E4DE] px-3 py-2 text-sm text-[#2D2A26] focus:border-[#E87B5A] focus:outline-none focus:ring-1 focus:ring-[#E87B5A]";

const statusBadge: Record<string, string> = {
  draft: "bg-gray-100 text-gray-500",
  sent: "bg-blue-50 text-blue-700",
  paid: "bg-emerald-50 text-emerald-700",
};
const statusLabel: Record<string, string> = {
  draft: "Borrador",
  sent: "Enviada",
  paid: "Pagada",
};

const fmt = new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" });

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function isCurrentMonth(dateStr: string | null): boolean {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  const now = new Date();
  return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
}

export default function SettlementsTab() {
  const [filterSupplier, setFilterSupplier] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [detailId, setDetailId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [newForm, setNewForm] = useState({ supplierId: "", startDate: "", endDate: "" });

  const { data: supData } = useSuppliers();
  const { data, isLoading } = useSettlements(filterSupplier || undefined, filterStatus || undefined);
  const { data: allData } = useSettlements(); // unfiltered, for stats
  const createSet = useCreateSettlement();
  const updateSet = useUpdateSettlement();
  const deleteSet = useDeleteSettlement();

  if (isLoading) return <PageSkeleton />;

  const settlements = data?.settlements || [];
  const allSettlements = allData?.settlements || [];
  const suppliers = supData?.suppliers || [];

  const totalPendiente = allSettlements
    .filter((s) => s.status !== "paid")
    .reduce((acc, s) => acc + s.netAmount, 0);
  const pagadoEsteMes = allSettlements
    .filter((s) => s.status === "paid" && isCurrentMonth(s.paidAt))
    .reduce((acc, s) => acc + s.netAmount, 0);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newForm.supplierId || !newForm.startDate || !newForm.endDate) {
      toast.error("Completa todos los campos");
      return;
    }
    try {
      await createSet.mutateAsync(newForm);
      toast.success("Liquidación creada");
      setModalOpen(false);
    } catch {
      toast.error("Error al crear liquidación");
    }
  };

  const handleStatusChange = async (s: Settlement, newStatus: string) => {
    try {
      await updateSet.mutateAsync({ id: s.id, status: newStatus });
      toast.success(`Liquidación marcada como ${statusLabel[newStatus]}`);
    } catch {
      toast.error("Error al actualizar estado");
    }
  };

  const handleDelete = async (s: Settlement) => {
    if (s.status !== "draft") {
      toast.error("Solo se pueden eliminar liquidaciones en borrador");
      return;
    }
    if (!confirm(`Eliminar liquidación "${s.number}"?`)) return;
    try {
      await deleteSet.mutateAsync(s.id);
      toast.success("Liquidación eliminada");
    } catch {
      toast.error("Error al eliminar liquidación");
    }
  };

  return (
    <div className="space-y-4">
      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-2xl bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-4">
          <p className="text-xs text-[#8A8580] mb-1">Total pendiente</p>
          <p className="text-xl font-semibold text-[#D4A853]">{fmt.format(totalPendiente)}</p>
        </div>
        <div className="rounded-2xl bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-4">
          <p className="text-xs text-[#8A8580] mb-1">Pagado este mes</p>
          <p className="text-xl font-semibold text-[#5B8C6D]">{fmt.format(pagadoEsteMes)}</p>
        </div>
        <div className="rounded-2xl bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-4">
          <p className="text-xs text-[#8A8580] mb-1">Total liquidaciones</p>
          <p className="text-xl font-semibold text-[#2D2A26]">{allSettlements.length}</p>
        </div>
      </div>

      {/* Filters + add button */}
      <div className="flex flex-wrap items-center gap-3">
        <select value={filterSupplier} onChange={(e) => setFilterSupplier(e.target.value)} className={`${selectCls} max-w-[220px]`}>
          <option value="">Todos los proveedores</option>
          {suppliers.map((s) => <option key={s.id} value={s.id}>{s.fiscalName}</option>)}
        </select>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className={`${selectCls} max-w-[180px]`}>
          <option value="">Todos los estados</option>
          <option value="draft">Borrador</option>
          <option value="sent">Enviada</option>
          <option value="paid">Pagada</option>
        </select>
        <button
          onClick={() => { setNewForm({ supplierId: "", startDate: "", endDate: "" }); setModalOpen(true); }}
          className="ml-auto flex items-center gap-2 rounded-[10px] bg-[#E87B5A] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#D56E4F] transition-colors"
        >
          <Plus className="h-4 w-4" />
          Nueva Liquidación
        </button>
      </div>

      <p className="text-sm text-[#8A8580]">
        {settlements.length} liquidación{settlements.length !== 1 ? "es" : ""}
      </p>

      {settlements.length === 0 ? (
        <div className="rounded-2xl bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-12 text-center">
          <FileText className="mx-auto h-10 w-10 text-[#8A8580] mb-3" />
          <p className="text-sm text-[#8A8580]">No hay liquidaciones creadas</p>
          <p className="text-xs text-[#8A8580] mt-1">
            Crea tu primera liquidación para gestionar pagos a proveedores
          </p>
        </div>
      ) : (
        <div className="rounded-2xl bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#E8E4DE] bg-[#FAF9F7]/50">
                  {["Número", "Proveedor", "Periodo"].map((h) => (
                    <th key={h} className="px-6 py-3 text-left text-xs font-medium text-[#8A8580] uppercase tracking-wider">{h}</th>
                  ))}
                  {["Bruto", "Comisión", "Neto"].map((h) => (
                    <th key={h} className="px-6 py-3 text-right text-xs font-medium text-[#8A8580] uppercase tracking-wider">{h}</th>
                  ))}
                  <th className="px-6 py-3 text-center text-xs font-medium text-[#8A8580] uppercase tracking-wider">Estado</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-[#8A8580] uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E4DE]">
                {settlements.map((s) => (
                  <tr key={s.id} className="hover:bg-[#FAF9F7]/30 transition-colors">
                    <td className="px-6 py-4">
                      <span className="rounded-[6px] bg-[#FAF9F7] px-2 py-0.5 text-xs font-mono text-[#8A8580]">
                        {s.number}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-[#2D2A26]">{s.supplier?.fiscalName ?? "—"}</td>
                    <td className="px-6 py-4 text-sm text-[#8A8580]">
                      {fmtDate(s.startDate)} - {fmtDate(s.endDate)}
                    </td>
                    <td className="px-6 py-4 text-right text-sm text-[#2D2A26]">{fmt.format(s.grossAmount)}</td>
                    <td className="px-6 py-4 text-right text-sm text-[#E87B5A]">{fmt.format(s.commissionAmount)}</td>
                    <td className="px-6 py-4 text-right text-sm font-medium text-[#2D2A26]">{fmt.format(s.netAmount)}</td>
                    <td className="px-6 py-4 text-center">
                      <select
                        value={s.status}
                        onChange={(e) => handleStatusChange(s, e.target.value)}
                        className={`inline-flex rounded-[6px] px-2 py-0.5 text-xs font-medium border-0 cursor-pointer ${statusBadge[s.status] || "bg-gray-100 text-gray-500"}`}
                      >
                        <option value="draft">Borrador</option>
                        <option value="sent">Enviada</option>
                        <option value="paid">Pagada</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setDetailId(s.id)}
                          className="rounded-[10px] p-1.5 text-[#8A8580] hover:bg-[#FAF9F7] hover:text-[#E87B5A] transition-colors"
                          title="Ver detalle"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(s)}
                          disabled={s.status !== "draft"}
                          className="rounded-[10px] p-1.5 text-[#8A8580] hover:bg-red-50 hover:text-[#C75D4A] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Eliminar"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setModalOpen(false)}>
          <div className="w-full max-w-md rounded-2xl bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-[#E8E4DE] px-6 py-4">
              <h2 className="text-lg font-semibold text-[#2D2A26]">Nueva Liquidación</h2>
              <button
                onClick={() => setModalOpen(false)}
                className="rounded-[10px] p-1.5 text-[#8A8580] hover:bg-[#FAF9F7] transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4 p-6">
              <div>
                <label className="block text-sm font-medium text-[#2D2A26] mb-1">Proveedor *</label>
                <select value={newForm.supplierId} onChange={(e) => setNewForm((p) => ({ ...p, supplierId: e.target.value }))} className={selectCls} required>
                  <option value="">Seleccionar proveedor</option>
                  {suppliers.map((s) => <option key={s.id} value={s.id}>{s.fiscalName}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#2D2A26] mb-1">Fecha inicio *</label>
                  <input type="date" value={newForm.startDate} onChange={(e) => setNewForm((p) => ({ ...p, startDate: e.target.value }))} className={inputCls} required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#2D2A26] mb-1">Fecha fin *</label>
                  <input type="date" value={newForm.endDate} onChange={(e) => setNewForm((p) => ({ ...p, endDate: e.target.value }))} className={inputCls} required />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setModalOpen(false)} className="rounded-[10px] border border-[#E8E4DE] px-4 py-2 text-sm font-medium text-[#8A8580] hover:bg-[#FAF9F7] transition-colors">
                  Cancelar
                </button>
                <button type="submit" className="rounded-[10px] bg-[#E87B5A] px-4 py-2 text-sm font-medium text-white hover:bg-[#D56E4F] transition-colors">
                  Crear Liquidación
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {detailId && (
        <SettlementDetailModal id={detailId} onClose={() => setDetailId(null)} />
      )}
    </div>
  );
}
