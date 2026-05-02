"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, Ticket, X, Check } from "lucide-react";
import { toast } from "sonner";
import {
  useVouchers,
  useCreateVoucher,
  useUpdateVoucher,
  useDeleteVoucher,
} from "@/hooks/useStorefront";
import type { CompensationVoucher } from "@/hooks/useStorefront";
import { PageSkeleton } from "@/components/shared/LoadingSkeleton";

const fmt = new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" });
const dateFmt = new Intl.DateTimeFormat("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" });

const inputCls =
  "w-full rounded-[10px] border border-[#E8E4DE] px-3 py-2 text-sm text-[#2D2A26] placeholder:text-[#8A8580] focus:border-[#E87B5A] focus:outline-none focus:ring-1 focus:ring-[#E87B5A]";

const TYPE_LABELS: Record<string, string> = {
  activity: "Actividad",
  monetary: "Monetario",
  service: "Servicio",
};

const TYPE_COLORS: Record<string, string> = {
  activity: "bg-blue-50 text-blue-700",
  monetary: "bg-emerald-50 text-emerald-700",
  service: "bg-purple-50 text-purple-700",
};

interface FormData {
  cancellationId: string;
  type: "activity" | "monetary" | "service";
  value: number;
  expirationDate: string;
  linkedDiscountCodeId: string;
}

function VoucherModal({
  editing,
  isOpen,
  onClose,
  onSave,
}: {
  editing: CompensationVoucher | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: FormData & { id?: string }) => void;
}) {
  const [form, setForm] = useState<FormData>(() =>
    editing
      ? {
          cancellationId: editing.cancellationId ?? "",
          type: editing.type,
          value: editing.value,
          expirationDate: editing.expirationDate
            ? editing.expirationDate.slice(0, 10)
            : "",
          linkedDiscountCodeId: editing.linkedDiscountCodeId ?? "",
        }
      : { cancellationId: "", type: "monetary", value: 0, expirationDate: "", linkedDiscountCodeId: "" }
  );

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ ...(editing && { id: editing.id }), ...form });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-[#E8E4DE] px-6 py-4">
          <h2 className="text-lg font-semibold text-[#2D2A26]">
            {editing ? "Editar Bono" : "Nuevo Bono de Compensacion"}
          </h2>
          <button onClick={onClose} className="rounded-[10px] p-1.5 text-[#8A8580] hover:bg-[#FAF9F7] transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#2D2A26] mb-1">Tipo</label>
              <select
                value={form.type}
                onChange={(e) => setForm((p) => ({ ...p, type: e.target.value as FormData["type"] }))}
                className={inputCls}
              >
                <option value="monetary">Monetario</option>
                <option value="activity">Actividad</option>
                <option value="service">Servicio</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#2D2A26] mb-1">Valor (EUR)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.value}
                onChange={(e) => setForm((p) => ({ ...p, value: parseFloat(e.target.value) || 0 }))}
                className={inputCls}
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#2D2A26] mb-1">Caducidad</label>
            <input
              type="date"
              value={form.expirationDate}
              onChange={(e) => setForm((p) => ({ ...p, expirationDate: e.target.value }))}
              className={inputCls}
            />
            <p className="text-xs text-[#8A8580] mt-1">Dejar vacio para sin caducidad</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#2D2A26] mb-1">ID Cancelación (opcional)</label>
            <input
              type="text"
              value={form.cancellationId}
              onChange={(e) => setForm((p) => ({ ...p, cancellationId: e.target.value }))}
              className={inputCls}
              placeholder="ID de la reserva cancelada"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#2D2A26] mb-1">Codigo descuento vinculado (opcional)</label>
            <input
              type="text"
              value={form.linkedDiscountCodeId}
              onChange={(e) => setForm((p) => ({ ...p, linkedDiscountCodeId: e.target.value }))}
              className={inputCls}
              placeholder="ID del codigo de descuento"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="rounded-[10px] border border-[#E8E4DE] px-4 py-2 text-sm font-medium text-[#8A8580] hover:bg-[#FAF9F7] transition-colors">
              Cancelar
            </button>
            <button type="submit" className="rounded-[10px] bg-[#E87B5A] px-4 py-2 text-sm font-medium text-white hover:bg-[#D56E4F] transition-colors">
              {editing ? "Guardar Cambios" : "Crear Bono"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function VouchersTab() {
  const { data, isLoading } = useVouchers();
  const createVoucher = useCreateVoucher();
  const updateVoucher = useUpdateVoucher();
  const deleteVoucher = useDeleteVoucher();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<CompensationVoucher | null>(null);

  if (isLoading) return <PageSkeleton />;

  const vouchers = data?.vouchers || [];

  const handleAdd = () => { setEditing(null); setModalOpen(true); };
  const handleEdit = (v: CompensationVoucher) => { setEditing(v); setModalOpen(true); };

  const handleDelete = async (v: CompensationVoucher) => {
    if (!confirm(`Eliminar el bono "${v.code}"?`)) return;
    try {
      await deleteVoucher.mutateAsync(v.id);
      toast.success("Bono eliminado");
    } catch {
      toast.error("Error al eliminar bono");
    }
  };

  const handleMarkUsed = async (v: CompensationVoucher) => {
    try {
      await updateVoucher.mutateAsync({ id: v.id, isUsed: true });
      toast.success("Bono marcado como usado");
    } catch {
      toast.error("Error al actualizar bono");
    }
  };

  const handleSave = async (data: FormData & { id?: string }) => {
    try {
      const payload = {
        ...data,
        cancellationId: data.cancellationId || null,
        expirationDate: data.expirationDate || null,
        linkedDiscountCodeId: data.linkedDiscountCodeId || null,
      };
      if (data.id) {
        await updateVoucher.mutateAsync({ id: data.id, ...payload });
        toast.success("Bono actualizado");
      } else {
        await createVoucher.mutateAsync(payload);
        toast.success("Bono creado");
      }
      setModalOpen(false);
    } catch {
      toast.error("Error al guardar bono");
    }
  };

  const isExpired = (d: string | null) => d && new Date(d) < new Date();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-[#8A8580]">
          {vouchers.length} bono{vouchers.length !== 1 ? "s" : ""} de compensacion
        </p>
        <button onClick={handleAdd} className="flex items-center gap-2 rounded-[10px] bg-[#E87B5A] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#D56E4F] transition-colors">
          <Plus className="h-4 w-4" />
          Nuevo Bono
        </button>
      </div>

      {vouchers.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <Ticket className="mx-auto h-10 w-10 text-[#8A8580] mb-3" />
          <p className="text-sm text-[#8A8580]">No hay bonos de compensacion</p>
          <p className="text-xs text-[#8A8580] mt-1">Crea un bono cuando necesites compensar una cancelación</p>
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#E8E4DE] bg-[#FAF9F7]/50">
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#8A8580] uppercase tracking-wider">Codigo</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-[#8A8580] uppercase tracking-wider">Tipo</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-[#8A8580] uppercase tracking-wider">Valor</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-[#8A8580] uppercase tracking-wider">Caducidad</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-[#8A8580] uppercase tracking-wider">Usado</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-[#8A8580] uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E4DE]">
                {vouchers.map((v) => (
                  <tr key={v.id} className="hover:bg-[#FAF9F7]/30 transition-colors">
                    <td className="px-6 py-4">
                      <span className="rounded-[6px] bg-[#FAF9F7] px-2 py-0.5 text-xs font-mono font-semibold text-[#2D2A26]">
                        {v.code}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex rounded-[6px] px-2 py-0.5 text-xs font-medium ${TYPE_COLORS[v.type] ?? "bg-gray-100 text-gray-500"}`}>
                        {TYPE_LABELS[v.type] ?? v.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-medium text-[#2D2A26]">
                      {fmt.format(v.value)}
                    </td>
                    <td className="px-6 py-4 text-center text-sm">
                      {v.expirationDate ? (
                        <span className={isExpired(v.expirationDate) ? "text-[#C75D4A]" : "text-[#8A8580]"}>
                          {dateFmt.format(new Date(v.expirationDate))}
                        </span>
                      ) : (
                        <span className="text-[#8A8580]">Sin limite</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex rounded-[6px] px-2 py-0.5 text-xs font-medium ${
                        v.isUsed
                          ? "bg-gray-100 text-gray-500"
                          : "bg-emerald-50 text-emerald-700"
                      }`}>
                        {v.isUsed ? "Usado" : "Disponible"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {!v.isUsed && (
                          <button onClick={() => handleMarkUsed(v)} className="rounded-[10px] p-1.5 text-[#8A8580] hover:bg-emerald-50 hover:text-emerald-700 transition-colors" title="Marcar usado">
                            <Check className="h-4 w-4" />
                          </button>
                        )}
                        <button onClick={() => handleEdit(v)} className="rounded-[10px] p-1.5 text-[#8A8580] hover:bg-[#FAF9F7] hover:text-[#E87B5A] transition-colors" title="Editar">
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleDelete(v)} className="rounded-[10px] p-1.5 text-[#8A8580] hover:bg-red-50 hover:text-[#C75D4A] transition-colors" title="Eliminar">
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

      <VoucherModal
        key={editing?.id ?? "new"}
        editing={editing}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
      />
    </div>
  );
}
