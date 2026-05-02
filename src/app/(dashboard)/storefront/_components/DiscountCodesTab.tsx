"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, Tag, X } from "lucide-react";
import { toast } from "sonner";
import {
  useDiscountCodes,
  useCreateDiscountCode,
  useUpdateDiscountCode,
  useDeleteDiscountCode,
} from "@/hooks/useStorefront";
import type { DiscountCode } from "@/hooks/useStorefront";
import { PageSkeleton } from "@/components/shared/LoadingSkeleton";

const fmt = new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" });
const dateFmt = new Intl.DateTimeFormat("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" });

const inputCls =
  "w-full rounded-[10px] border border-[#E8E4DE] px-3 py-2 text-sm text-[#2D2A26] placeholder:text-[#8A8580] focus:border-[#E87B5A] focus:outline-none focus:ring-1 focus:ring-[#E87B5A]";

interface FormData {
  code: string;
  type: "percentage" | "fixed";
  value: number;
  expirationDate: string;
  maxUses: number;
  isActive: boolean;
}

function DiscountCodeModal({
  editing,
  isOpen,
  onClose,
  onSave,
}: {
  editing: DiscountCode | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: FormData & { id?: string }) => void;
}) {
  const [form, setForm] = useState<FormData>(() =>
    editing
      ? {
          code: editing.code,
          type: editing.type,
          value: editing.value,
          expirationDate: editing.expirationDate
            ? editing.expirationDate.slice(0, 10)
            : "",
          maxUses: editing.maxUses,
          isActive: editing.isActive,
        }
      : { code: "", type: "percentage", value: 10, expirationDate: "", maxUses: 0, isActive: true }
  );

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...(editing && { id: editing.id }),
      ...form,
      expirationDate: form.expirationDate || "",
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-[#E8E4DE] px-6 py-4">
          <h2 className="text-lg font-semibold text-[#2D2A26]">
            {editing ? "Editar Codigo" : "Nuevo Codigo de Descuento"}
          </h2>
          <button onClick={onClose} className="rounded-[10px] p-1.5 text-[#8A8580] hover:bg-[#FAF9F7] transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          <div>
            <label className="block text-sm font-medium text-[#2D2A26] mb-1">Codigo</label>
            <input
              type="text"
              value={form.code}
              onChange={(e) => setForm((p) => ({ ...p, code: e.target.value.toUpperCase() }))}
              className={inputCls}
              placeholder="Ej: VERANO20"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#2D2A26] mb-1">Tipo</label>
              <select
                value={form.type}
                onChange={(e) => setForm((p) => ({ ...p, type: e.target.value as "percentage" | "fixed" }))}
                className={inputCls}
              >
                <option value="percentage">Porcentaje (%)</option>
                <option value="fixed">Importe fijo (EUR)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#2D2A26] mb-1">
                Valor {form.type === "percentage" ? "(%)" : "(EUR)"}
              </label>
              <input
                type="number"
                min="0"
                step={form.type === "percentage" ? "1" : "0.01"}
                max={form.type === "percentage" ? "100" : undefined}
                value={form.value}
                onChange={(e) => setForm((p) => ({ ...p, value: parseFloat(e.target.value) || 0 }))}
                className={inputCls}
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
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
              <label className="block text-sm font-medium text-[#2D2A26] mb-1">Usos maximos</label>
              <input
                type="number"
                min="0"
                value={form.maxUses}
                onChange={(e) => setForm((p) => ({ ...p, maxUses: parseInt(e.target.value) || 0 }))}
                className={inputCls}
              />
              <p className="text-xs text-[#8A8580] mt-1">0 = ilimitado</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="dc-active"
              checked={form.isActive}
              onChange={(e) => setForm((p) => ({ ...p, isActive: e.target.checked }))}
              className="h-4 w-4 rounded border-[#E8E4DE] text-[#E87B5A] focus:ring-[#E87B5A]"
            />
            <label htmlFor="dc-active" className="text-sm font-medium text-[#2D2A26]">Activo</label>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="rounded-[10px] border border-[#E8E4DE] px-4 py-2 text-sm font-medium text-[#8A8580] hover:bg-[#FAF9F7] transition-colors">
              Cancelar
            </button>
            <button type="submit" className="rounded-[10px] bg-[#E87B5A] px-4 py-2 text-sm font-medium text-white hover:bg-[#D56E4F] transition-colors">
              {editing ? "Guardar Cambios" : "Crear Codigo"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function DiscountCodesTab() {
  const { data, isLoading } = useDiscountCodes();
  const createCode = useCreateDiscountCode();
  const updateCode = useUpdateDiscountCode();
  const deleteCode = useDeleteDiscountCode();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<DiscountCode | null>(null);

  if (isLoading) return <PageSkeleton />;

  const codes = data?.codes || [];

  const handleAdd = () => { setEditing(null); setModalOpen(true); };
  const handleEdit = (code: DiscountCode) => { setEditing(code); setModalOpen(true); };

  const handleDelete = async (code: DiscountCode) => {
    if (!confirm(`Eliminar el codigo "${code.code}"?`)) return;
    try {
      await deleteCode.mutateAsync(code.id);
      toast.success("Codigo eliminado");
    } catch {
      toast.error("Error al eliminar codigo");
    }
  };

  const handleSave = async (data: FormData & { id?: string }) => {
    try {
      const payload = {
        ...data,
        expirationDate: data.expirationDate || null,
      };
      if (data.id) {
        await updateCode.mutateAsync({ id: data.id, ...payload });
        toast.success("Codigo actualizado");
      } else {
        await createCode.mutateAsync(payload);
        toast.success("Codigo creado");
      }
      setModalOpen(false);
    } catch {
      toast.error("Error al guardar codigo");
    }
  };

  const isExpired = (d: string | null) => d && new Date(d) < new Date();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-[#8A8580]">
          {codes.length} codigo{codes.length !== 1 ? "s" : ""} de descuento
        </p>
        <button onClick={handleAdd} className="flex items-center gap-2 rounded-[10px] bg-[#E87B5A] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#D56E4F] transition-colors">
          <Plus className="h-4 w-4" />
          Nuevo Codigo
        </button>
      </div>

      {codes.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <Tag className="mx-auto h-10 w-10 text-[#8A8580] mb-3" />
          <p className="text-sm text-[#8A8580]">No hay codigos de descuento</p>
          <p className="text-xs text-[#8A8580] mt-1">Crea tu primer codigo para ofrecer descuentos</p>
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
                  <th className="px-6 py-3 text-center text-xs font-medium text-[#8A8580] uppercase tracking-wider">Usos</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-[#8A8580] uppercase tracking-wider">Caduca</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-[#8A8580] uppercase tracking-wider">Estado</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-[#8A8580] uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E4DE]">
                {codes.map((code) => (
                  <tr key={code.id} className="hover:bg-[#FAF9F7]/30 transition-colors">
                    <td className="px-6 py-4">
                      <span className="rounded-[6px] bg-[#FAF9F7] px-2 py-0.5 text-xs font-mono font-semibold text-[#2D2A26]">
                        {code.code}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex rounded-[6px] px-2 py-0.5 text-xs font-medium ${
                        code.type === "percentage"
                          ? "bg-blue-50 text-blue-700"
                          : "bg-emerald-50 text-emerald-700"
                      }`}>
                        {code.type === "percentage" ? "Porcentaje" : "Fijo"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-medium text-[#2D2A26]">
                      {code.type === "percentage"
                        ? `${code.value}%`
                        : fmt.format(code.value)}
                    </td>
                    <td className="px-6 py-4 text-center text-sm text-[#8A8580]">
                      {code.usedCount}{code.maxUses > 0 ? `/${code.maxUses}` : " / ilim."}
                    </td>
                    <td className="px-6 py-4 text-center text-sm">
                      {code.expirationDate ? (
                        <span className={isExpired(code.expirationDate) ? "text-[#C75D4A]" : "text-[#8A8580]"}>
                          {dateFmt.format(new Date(code.expirationDate))}
                        </span>
                      ) : (
                        <span className="text-[#8A8580]">Sin limite</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex rounded-[6px] px-2 py-0.5 text-xs font-medium ${
                        code.isActive && !isExpired(code.expirationDate)
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-gray-100 text-gray-500"
                      }`}>
                        {!code.isActive ? "Inactivo" : isExpired(code.expirationDate) ? "Caducado" : "Activo"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => handleEdit(code)} className="rounded-[10px] p-1.5 text-[#8A8580] hover:bg-[#FAF9F7] hover:text-[#E87B5A] transition-colors" title="Editar">
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleDelete(code)} className="rounded-[10px] p-1.5 text-[#8A8580] hover:bg-red-50 hover:text-[#C75D4A] transition-colors" title="Eliminar">
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

      <DiscountCodeModal
        key={editing?.id ?? "new"}
        editing={editing}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
      />
    </div>
  );
}
