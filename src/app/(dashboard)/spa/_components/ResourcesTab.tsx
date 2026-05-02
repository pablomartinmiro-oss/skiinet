"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, Users, X } from "lucide-react";
import { toast } from "sonner";
import {
  useSpaResources,
  useCreateSpaResource,
  useUpdateSpaResource,
  useDeleteSpaResource,
} from "@/hooks/useSpa";
import type { SpaResource } from "@/hooks/useSpa";
import { PageSkeleton } from "@/components/shared/LoadingSkeleton";

const inputCls =
  "w-full rounded-[10px] border border-[#E8E4DE] px-3 py-2 text-sm text-[#2D2A26] placeholder:text-[#8A8580] focus:border-[#E87B5A] focus:outline-none focus:ring-1 focus:ring-[#E87B5A]";

const TYPE_BADGES: Record<string, { label: string; color: string }> = {
  cabin: { label: "Cabina", color: "bg-blue-50 text-blue-700" },
  therapist: { label: "Terapeuta", color: "bg-purple-50 text-purple-700" },
};

interface ResourceForm {
  name: string;
  type: string;
  active: boolean;
}

function ResourceModal({ resource, isOpen, onClose, onSave }: {
  resource: SpaResource | null; isOpen: boolean;
  onClose: () => void;
  onSave: (d: ResourceForm & { id?: string }) => void;
}) {
  const [form, setForm] = useState<ResourceForm>(() =>
    resource
      ? { name: resource.name, type: resource.type, active: resource.active }
      : { name: "", type: "cabin", active: true }
  );

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ ...(resource && { id: resource.id }), ...form });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-[#E8E4DE] px-6 py-4">
          <h2 className="text-lg font-semibold text-[#2D2A26]">
            {resource ? "Editar Recurso" : "Nuevo Recurso"}
          </h2>
          <button onClick={onClose} className="rounded-[10px] p-1.5 text-[#8A8580] hover:bg-[#FAF9F7] transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          <div>
            <label className="block text-sm font-medium text-[#2D2A26] mb-1">Nombre</label>
            <input type="text" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} className={inputCls} placeholder="Ej: Cabina 1, Maria Garcia" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#2D2A26] mb-1">Tipo</label>
            <select value={form.type} onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))} className={inputCls}>
              <option value="cabin">Cabina</option>
              <option value="therapist">Terapeuta</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="res-active" checked={form.active} onChange={(e) => setForm((p) => ({ ...p, active: e.target.checked }))} className="h-4 w-4 rounded border-[#E8E4DE] text-[#E87B5A] focus:ring-[#E87B5A]" />
            <label htmlFor="res-active" className="text-sm font-medium text-[#2D2A26]">Activo</label>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="rounded-[10px] border border-[#E8E4DE] px-4 py-2 text-sm font-medium text-[#8A8580] hover:bg-[#FAF9F7] transition-colors">
              Cancelar
            </button>
            <button type="submit" className="rounded-[10px] bg-[#E87B5A] px-4 py-2 text-sm font-medium text-white hover:bg-[#D56E4F] transition-colors">
              {resource ? "Guardar Cambios" : "Crear Recurso"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ResourcesTab() {
  const [filterType, setFilterType] = useState("");
  const { data, isLoading } = useSpaResources(filterType || undefined);
  const createRes = useCreateSpaResource();
  const updateRes = useUpdateSpaResource();
  const deleteRes = useDeleteSpaResource();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<SpaResource | null>(null);

  if (isLoading) return <PageSkeleton />;

  const resources = data?.resources ?? [];

  const handleAdd = () => { setEditing(null); setModalOpen(true); };
  const handleEdit = (r: SpaResource) => { setEditing(r); setModalOpen(true); };

  const handleDelete = async (r: SpaResource) => {
    if (!confirm(`Eliminar el recurso "${r.name}"?`)) return;
    try { await deleteRes.mutateAsync(r.id); toast.success("Recurso eliminado"); }
    catch { toast.error("Error al eliminar recurso"); }
  };

  const handleSave = async (d: ResourceForm & { id?: string }) => {
    try {
      if (d.id) {
        await updateRes.mutateAsync({ id: d.id, ...d });
        toast.success("Recurso actualizado");
      } else {
        await createRes.mutateAsync(d);
        toast.success("Recurso creado");
      }
      setModalOpen(false);
    } catch { toast.error("Error al guardar recurso"); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className={inputCls + " w-44"}>
            <option value="">Todos los tipos</option>
            <option value="cabin">Cabinas</option>
            <option value="therapist">Terapeutas</option>
          </select>
          <p className="text-sm text-[#8A8580]">
            {resources.length} recurso{resources.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button onClick={handleAdd} className="flex items-center gap-2 rounded-[10px] bg-[#E87B5A] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#D56E4F] transition-colors">
          <Plus className="h-4 w-4" /> Añadir Recurso
        </button>
      </div>

      {resources.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <Users className="mx-auto h-10 w-10 text-[#8A8580] mb-3" />
          <p className="text-sm text-[#8A8580]">No hay recursos creados</p>
          <p className="text-xs text-[#8A8580] mt-1">Anade cabinas o terapeutas para gestionar los recursos del spa</p>
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#E8E4DE] bg-[#FAF9F7]/50">
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#8A8580] uppercase tracking-wider">Nombre</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-[#8A8580] uppercase tracking-wider">Tipo</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-[#8A8580] uppercase tracking-wider">Estado</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-[#8A8580] uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E4DE]">
                {resources.map((r) => {
                  const badge = TYPE_BADGES[r.type] ?? { label: r.type, color: "bg-gray-100 text-gray-600" };
                  return (
                    <tr key={r.id} className="hover:bg-[#FAF9F7]/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-[#8A8580]" />
                          <span className="font-medium text-sm text-[#2D2A26]">{r.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex rounded-[6px] px-2 py-0.5 text-xs font-medium ${badge.color}`}>
                          {badge.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex rounded-[6px] px-2 py-0.5 text-xs font-medium ${r.active ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>
                          {r.active ? "Activo" : "Inactivo"}
                        </span>
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
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <ResourceModal
        key={editing?.id ?? "new"}
        resource={editing}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
      />
    </div>
  );
}
