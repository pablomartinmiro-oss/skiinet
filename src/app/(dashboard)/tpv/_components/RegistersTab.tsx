"use client";

import { useState, useMemo } from "react";
import { Plus, Pencil, Trash2, Monitor, X } from "lucide-react";
import { toast } from "sonner";
import {
  useRegisters,
  useSessions,
  useCreateRegister,
  useUpdateRegister,
  useDeleteRegister,
} from "@/hooks/useTpv";
import type { CashRegister } from "@/hooks/useTpv";
import { PageSkeleton } from "@/components/shared/LoadingSkeleton";

const dtf = new Intl.DateTimeFormat("es-ES", {
  dateStyle: "short",
  timeStyle: "short",
});

interface FormState {
  name: string;
  location: string;
  active: boolean;
}

const emptyForm: FormState = { name: "", location: "", active: true };

export default function RegistersTab() {
  const { data, isLoading } = useRegisters();
  const { data: sessData } = useSessions(undefined, "open");
  const createReg = useCreateRegister();
  const updateReg = useUpdateRegister();
  const deleteReg = useDeleteRegister();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<CashRegister | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);

  const openByRegister = useMemo(() => {
    const map = new Map<string, { openedAt: string; openedBy?: { name: string } }>();
    for (const s of sessData?.sessions ?? []) {
      map.set(s.registerId, { openedAt: s.openedAt, openedBy: s.openedBy });
    }
    return map;
  }, [sessData]);

  if (isLoading) return <PageSkeleton />;

  const registers = data?.registers || [];

  const handleAdd = () => {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const handleEdit = (reg: CashRegister) => {
    setEditing(reg);
    setForm({ name: reg.name, location: reg.location ?? "", active: reg.active });
    setModalOpen(true);
  };

  const handleDelete = async (reg: CashRegister) => {
    if (!confirm(`Eliminar la caja "${reg.name}"?`)) return;
    try {
      await deleteReg.mutateAsync(reg.id);
      toast.success("Caja eliminada");
    } catch {
      toast.error("Error al eliminar caja");
    }
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error("El nombre es obligatorio");
      return;
    }
    try {
      if (editing) {
        await updateReg.mutateAsync({
          id: editing.id,
          name: form.name,
          location: form.location || null,
          active: form.active,
        });
        toast.success("Caja actualizada");
      } else {
        await createReg.mutateAsync({
          name: form.name,
          location: form.location || null,
          active: form.active,
        });
        toast.success("Caja creada");
      }
      setModalOpen(false);
    } catch {
      toast.error("Error al guardar caja");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-[#8A8580]">
          {registers.length} caja{registers.length !== 1 ? "s" : ""} registradora{registers.length !== 1 ? "s" : ""}
        </p>
        <button
          onClick={handleAdd}
          className="flex items-center gap-2 rounded-[10px] bg-[#E87B5A] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#D56E4F] transition-colors"
        >
          <Plus className="h-4 w-4" />
          Añadir Caja
        </button>
      </div>

      {registers.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <Monitor className="mx-auto h-10 w-10 text-[#8A8580] mb-3" />
          <p className="text-sm text-[#8A8580]">No hay cajas registradoras</p>
          <p className="text-xs text-[#8A8580] mt-1">
            Crea tu primera caja para gestionar sesiones y ventas
          </p>
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#E8E4DE] bg-[#FAF9F7]/50">
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#8A8580] uppercase tracking-wider">Nombre</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#8A8580] uppercase tracking-wider">Ubicacion</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-[#8A8580] uppercase tracking-wider">Sesiónes</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#8A8580] uppercase tracking-wider">Sesión abierta</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-[#8A8580] uppercase tracking-wider">Estado</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-[#8A8580] uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E4DE]">
                {registers.map((reg) => (
                  <tr key={reg.id} className="hover:bg-[#FAF9F7]/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Monitor className="h-4 w-4 text-[#8A8580]" />
                        <span className="font-medium text-sm text-[#2D2A26]">{reg.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-[#8A8580]">{reg.location || "—"}</td>
                    <td className="px-6 py-4 text-center text-sm text-[#8A8580]">{reg._count?.sessions ?? 0}</td>
                    <td className="px-6 py-4 text-sm">
                      {(() => {
                        const open = openByRegister.get(reg.id);
                        if (!open) {
                          return <span className="text-xs text-[#8A8580]">Sin sesión abierta</span>;
                        }
                        return (
                          <div className="flex flex-col gap-0.5">
                            <span className="inline-flex w-fit items-center gap-1.5 rounded-[6px] bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              Abierta
                            </span>
                            <span className="text-xs text-[#8A8580]">
                              {open.openedBy?.name ?? "—"} · {dtf.format(new Date(open.openedAt))}
                            </span>
                          </div>
                        );
                      })()}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex rounded-[6px] px-2 py-0.5 text-xs font-medium ${reg.active ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>
                        {reg.active ? "Activa" : "Inactiva"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => handleEdit(reg)} className="rounded-[10px] p-1.5 text-[#8A8580] hover:bg-[#FAF9F7] hover:text-[#E87B5A] transition-colors" title="Editar">
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleDelete(reg)} className="rounded-[10px] p-1.5 text-[#8A8580] hover:bg-red-50 hover:text-[#C75D4A] transition-colors" title="Eliminar">
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

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-[#2D2A26]">
                {editing ? "Editar Caja" : "Nueva Caja"}
              </h2>
              <button onClick={() => setModalOpen(false)} className="text-[#8A8580] hover:text-[#2D2A26]">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#2D2A26] mb-1">Nombre *</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full rounded-[10px] border border-[#E8E4DE] px-3 py-2 text-sm focus:border-[#E87B5A] focus:outline-none"
                  placeholder="Caja principal"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#2D2A26] mb-1">Ubicacion</label>
                <input
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  className="w-full rounded-[10px] border border-[#E8E4DE] px-3 py-2 text-sm focus:border-[#E87B5A] focus:outline-none"
                  placeholder="Recepcion"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={(e) => setForm({ ...form, active: e.target.checked })}
                  className="h-4 w-4 rounded accent-[#E87B5A]"
                />
                <label className="text-sm text-[#2D2A26]">Activa</label>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setModalOpen(false)}
                className="rounded-[10px] border border-[#E8E4DE] px-4 py-2 text-sm font-medium text-[#8A8580] hover:bg-[#FAF9F7] transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={createReg.isPending || updateReg.isPending}
                className="rounded-[10px] bg-[#E87B5A] px-4 py-2 text-sm font-medium text-white hover:bg-[#D56E4F] transition-colors disabled:opacity-50"
              >
                {editing ? "Guardar" : "Crear"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
