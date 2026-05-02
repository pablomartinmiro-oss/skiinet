"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, RotateCcw, X, Layers, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import {
  useRedemptions,
  useCreateRedemption,
  useUpdateRedemption,
  useDeleteRedemption,
} from "@/hooks/useTicketing";
import type { CouponRedemption } from "@/hooks/useTicketing";
import { PageSkeleton } from "@/components/shared/LoadingSkeleton";
import BatchRedemptionModal from "./BatchRedemptionModal";

const inputCls =
  "w-full rounded-[10px] border border-[#E8E4DE] px-3 py-2 text-sm text-[#2D2A26] placeholder:text-[#8A8580] focus:border-[#E87B5A] focus:outline-none focus:ring-1 focus:ring-[#E87B5A]";

const STATUS_LABELS: Record<string, string> = {
  received: "Recibido",
  pending: "Pendiente",
  reservation_generated: "Reserva generada",
};
const STATUS_COLORS: Record<string, string> = {
  received: "bg-blue-50 text-blue-700",
  pending: "bg-amber-50 text-amber-700",
  reservation_generated: "bg-emerald-50 text-emerald-700",
};
const FIN_LABELS: Record<string, string> = {
  pending: "Pendiente",
  redeemed: "Canjeado",
  incident: "Incidencia",
};
const FIN_COLORS: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700",
  redeemed: "bg-emerald-50 text-emerald-700",
  incident: "bg-red-50 text-red-700",
};
const OCR_BADGE: Record<string, { label: string; cls: string }> = {
  alta: { label: "Alta", cls: "bg-emerald-50 text-emerald-700" },
  media: { label: "Media", cls: "bg-amber-50 text-amber-700" },
  baja: { label: "Baja", cls: "bg-red-50 text-red-700" },
  conflicto: { label: "Conflicto", cls: "bg-purple-50 text-purple-700" },
};

interface RedemptionForm {
  code: string;
  email: string;
  phone: string;
  status: string;
  financialStatus: string;
  reservationId: string;
}

function RedemptionModal({ redemption, isOpen, onClose, onSave }: {
  redemption: CouponRedemption | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (d: RedemptionForm & { id?: string }) => void;
}) {
  const [form, setForm] = useState<RedemptionForm>(() =>
    redemption
      ? {
          code: redemption.code,
          email: redemption.email ?? "",
          phone: redemption.phone ?? "",
          status: redemption.status,
          financialStatus: redemption.financialStatus,
          reservationId: redemption.reservationId ?? "",
        }
      : { code: "", email: "", phone: "", status: "received", financialStatus: "pending", reservationId: "" }
  );
  if (!isOpen) return null;
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ ...(redemption && { id: redemption.id }), ...form });
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-[#E8E4DE] px-6 py-4">
          <h2 className="text-lg font-semibold text-[#2D2A26]">
            {redemption ? "Editar Canje" : "Nuevo Canje"}
          </h2>
          <button onClick={onClose} className="rounded-[10px] p-1.5 text-[#8A8580] hover:bg-[#FAF9F7] transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          <div>
            <label className="block text-sm font-medium text-[#2D2A26] mb-1">Codigo</label>
            <input type="text" value={form.code} onChange={(e) => setForm((p) => ({ ...p, code: e.target.value }))} className={inputCls} required placeholder="ABC-123-XYZ" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#2D2A26] mb-1">Email</label>
              <input type="email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} className={inputCls} placeholder="cliente@email.com" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#2D2A26] mb-1">Teléfono</label>
              <input type="text" value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} className={inputCls} placeholder="+34 600..." />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#2D2A26] mb-1">Estado</label>
              <select value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))} className={inputCls}>
                <option value="received">Recibido</option>
                <option value="pending">Pendiente</option>
                <option value="reservation_generated">Reserva generada</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#2D2A26] mb-1">Estado financiero</label>
              <select value={form.financialStatus} onChange={(e) => setForm((p) => ({ ...p, financialStatus: e.target.value }))} className={inputCls}>
                <option value="pending">Pendiente</option>
                <option value="redeemed">Canjeado</option>
                <option value="incident">Incidencia</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#2D2A26] mb-1">ID de reserva (opcional)</label>
            <input type="text" value={form.reservationId} onChange={(e) => setForm((p) => ({ ...p, reservationId: e.target.value }))} className={inputCls} placeholder="ID de reserva vinculada" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="rounded-[10px] border border-[#E8E4DE] px-4 py-2 text-sm font-medium text-[#8A8580] hover:bg-[#FAF9F7] transition-colors">Cancelar</button>
            <button type="submit" className="rounded-[10px] bg-[#E87B5A] px-4 py-2 text-sm font-medium text-white hover:bg-[#D56E4F] transition-colors">
              {redemption ? "Guardar Cambios" : "Crear Canje"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function CanjesTab() {
  const [filterStatus, setFilterStatus] = useState("");
  const [filterFinancial, setFilterFinancial] = useState("");
  const [searchCode, setSearchCode] = useState("");

  const { data, isLoading } = useRedemptions({
    status: filterStatus || undefined,
    financialStatus: filterFinancial || undefined,
    code: searchCode || undefined,
  });
  const createRed = useCreateRedemption();
  const updateRed = useUpdateRedemption();
  const deleteRed = useDeleteRedemption();

  const [modalOpen, setModalOpen] = useState(false);
  const [batchOpen, setBatchOpen] = useState(false);
  const [editing, setEditing] = useState<CouponRedemption | null>(null);

  const redemptions = data?.redemptions ?? [];

  const handleAdd = () => { setEditing(null); setModalOpen(true); };
  const handleEdit = (r: CouponRedemption) => { setEditing(r); setModalOpen(true); };

  const handleDelete = async (r: CouponRedemption) => {
    if (!confirm(`Eliminar el canje "${r.code}"?`)) return;
    try { await deleteRed.mutateAsync(r.id); toast.success("Canje eliminado"); }
    catch { toast.error("Error al eliminar canje"); }
  };

  const handleSave = async (d: RedemptionForm & { id?: string }) => {
    try {
      const payload = {
        ...d,
        email: d.email || null,
        phone: d.phone || null,
        reservationId: d.reservationId || null,
      };
      if (d.id) {
        await updateRed.mutateAsync({ id: d.id, ...payload });
        toast.success("Canje actualizado");
      } else {
        await createRed.mutateAsync(payload);
        toast.success("Canje creado");
      }
      setModalOpen(false);
    } catch { toast.error("Error al guardar canje"); }
  };

  if (isLoading) return <PageSkeleton />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3 flex-wrap">
          <input type="text" value={searchCode} onChange={(e) => setSearchCode(e.target.value)} className={inputCls + " w-48"} placeholder="Buscar codigo..." />
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className={inputCls + " w-44"}>
            <option value="">Todos los estados</option>
            <option value="received">Recibido</option>
            <option value="pending">Pendiente</option>
            <option value="reservation_generated">Reserva generada</option>
          </select>
          <select value={filterFinancial} onChange={(e) => setFilterFinancial(e.target.value)} className={inputCls + " w-44"}>
            <option value="">Estado financiero</option>
            <option value="pending">Pendiente</option>
            <option value="redeemed">Canjeado</option>
            <option value="incident">Incidencia</option>
          </select>
          <p className="text-sm text-[#8A8580]">{redemptions.length} canje{redemptions.length !== 1 ? "s" : ""}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setBatchOpen(true)} className="flex items-center gap-2 rounded-[10px] border border-[#E8E4DE] px-4 py-2.5 text-sm font-medium text-[#2D2A26] hover:bg-[#FAF9F7] transition-colors">
            <Layers className="h-4 w-4" /> Canjear lote
          </button>
          <button onClick={handleAdd} className="flex items-center gap-2 rounded-[10px] bg-[#E87B5A] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#D56E4F] transition-colors">
            <Plus className="h-4 w-4" /> Nuevo Canje
          </button>
        </div>
      </div>

      {redemptions.length === 0 ? (
        <div className="rounded-2xl bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-12 text-center">
          <RotateCcw className="mx-auto h-10 w-10 text-[#8A8580] mb-3" />
          <p className="text-sm text-[#8A8580]">No hay canjes registrados</p>
          <p className="text-xs text-[#8A8580] mt-1">Los canjes de cupones apareceran aqui</p>
        </div>
      ) : (
        <div className="rounded-2xl bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#E8E4DE] bg-[#FAF9F7]/50">
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#8A8580] uppercase tracking-wider">Codigo</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#8A8580] uppercase tracking-wider">Contacto</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-[#8A8580] uppercase tracking-wider">Estado</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-[#8A8580] uppercase tracking-wider">Financiero</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-[#8A8580] uppercase tracking-wider">OCR</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#8A8580] uppercase tracking-wider">Fecha</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-[#8A8580] uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E4DE]">
                {redemptions.map((r) => (
                  <tr key={r.id} className="hover:bg-[#FAF9F7]/30 transition-colors">
                    <td className="px-6 py-4">
                      <span className="font-mono text-sm font-medium text-[#2D2A26]">{r.code}</span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-[#2D2A26]">{r.email || "—"}</p>
                      <p className="text-xs text-[#8A8580]">{r.phone || ""}</p>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex rounded-[6px] px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[r.status] ?? "bg-gray-100 text-gray-500"}`}>
                        {STATUS_LABELS[r.status] ?? r.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex rounded-[6px] px-2 py-0.5 text-xs font-medium ${FIN_COLORS[r.financialStatus] ?? "bg-gray-100 text-gray-500"}`}>
                        {FIN_LABELS[r.financialStatus] ?? r.financialStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {(() => {
                        const ocr = r.ocrExtraction as Record<string, unknown> | null;
                        const conf = ocr?.confidence as string | undefined;
                        if (!conf) return <span className="text-xs text-[#8A8580]">—</span>;
                        const badge = OCR_BADGE[conf];
                        return (
                          <div className="flex items-center justify-center gap-1">
                            <span className={`inline-flex rounded-[6px] px-2 py-0.5 text-xs font-medium ${badge?.cls ?? "bg-gray-100 text-gray-500"}`}>
                              {badge?.label ?? conf}
                            </span>
                            {Boolean(ocr?.softDuplicate) && (
                              <span className="text-[#D4A853]" role="img" aria-label="Posible duplicado">
                                <AlertTriangle className="h-3.5 w-3.5" />
                              </span>
                            )}
                          </div>
                        );
                      })()}
                    </td>
                    <td className="px-6 py-4 text-sm text-[#8A8580]">
                      {new Date(r.createdAt).toLocaleDateString("es-ES")}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => handleEdit(r)} className="rounded-[10px] p-1.5 text-[#8A8580] hover:bg-[#FAF9F7] hover:text-[#E87B5A] transition-colors" title="Editar">
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleDelete(r)} className="rounded-[10px] p-1.5 text-[#8A8580] hover:bg-red-50 hover:text-[#C75D4A] transition-colors" title="Eliminar">
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

      <RedemptionModal
        key={editing?.id ?? "new"}
        redemption={editing}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
      />

      <BatchRedemptionModal
        isOpen={batchOpen}
        onClose={() => setBatchOpen(false)}
      />
    </div>
  );
}
