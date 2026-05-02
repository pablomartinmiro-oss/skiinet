"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, Sparkles, X } from "lucide-react";
import { toast } from "sonner";
import {
  useSpaTreatments,
  useCreateSpaTreatment,
  useUpdateSpaTreatment,
  useDeleteSpaTreatment,
  useSpaCategories,
} from "@/hooks/useSpa";
import type { SpaTreatment } from "@/hooks/useSpa";
import { PageSkeleton } from "@/components/shared/LoadingSkeleton";

const inputCls =
  "w-full rounded-[10px] border border-[#E8E4DE] px-3 py-2 text-sm text-[#2D2A26] placeholder:text-[#8A8580] focus:border-[#E87B5A] focus:outline-none focus:ring-1 focus:ring-[#E87B5A]";

const fmt = new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" });

interface TreatmentForm {
  categoryId: string; title: string; duration: number; capacity: number;
  price: number; description: string; fiscalRegime: string; active: boolean;
}

function TreatmentModal({ treatment, categories, isOpen, onClose, onSave }: {
  treatment: SpaTreatment | null;
  categories: { id: string; name: string }[];
  isOpen: boolean; onClose: () => void;
  onSave: (d: TreatmentForm & { id?: string }) => void;
}) {
  const [form, setForm] = useState<TreatmentForm>(() =>
    treatment
      ? {
          categoryId: treatment.categoryId, title: treatment.title,
          duration: treatment.duration, capacity: treatment.capacity,
          price: treatment.price, description: treatment.description ?? "",
          fiscalRegime: treatment.fiscalRegime, active: treatment.active,
        }
      : {
          categoryId: categories[0]?.id ?? "", title: "",
          duration: 60, capacity: 1, price: 0, description: "",
          fiscalRegime: "general", active: true,
        }
  );

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ ...(treatment && { id: treatment.id }), ...form });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-[#E8E4DE] px-6 py-4">
          <h2 className="text-lg font-semibold text-[#2D2A26]">
            {treatment ? "Editar Tratamiento" : "Nuevo Tratamiento"}
          </h2>
          <button onClick={onClose} className="rounded-[10px] p-1.5 text-[#8A8580] hover:bg-[#FAF9F7] transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          <div>
            <label className="block text-sm font-medium text-[#2D2A26] mb-1">Titulo</label>
            <input type="text" value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} className={inputCls} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#2D2A26] mb-1">Categoria</label>
            <select value={form.categoryId} onChange={(e) => setForm((p) => ({ ...p, categoryId: e.target.value }))} className={inputCls} required>
              {categories.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
            </select>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#2D2A26] mb-1">Duracion (min)</label>
              <input type="number" min="5" value={form.duration} onChange={(e) => setForm((p) => ({ ...p, duration: parseInt(e.target.value) || 5 }))} className={inputCls} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#2D2A26] mb-1">Capacidad</label>
              <input type="number" min="1" value={form.capacity} onChange={(e) => setForm((p) => ({ ...p, capacity: parseInt(e.target.value) || 1 }))} className={inputCls} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#2D2A26] mb-1">Precio (EUR)</label>
              <input type="number" min="0" step="0.01" value={form.price} onChange={(e) => setForm((p) => ({ ...p, price: parseFloat(e.target.value) || 0 }))} className={inputCls} required />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#2D2A26] mb-1">Descripción</label>
            <input type="text" value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} className={inputCls} placeholder="Descripción opcional" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#2D2A26] mb-1">Regimen fiscal</label>
              <select value={form.fiscalRegime} onChange={(e) => setForm((p) => ({ ...p, fiscalRegime: e.target.value }))} className={inputCls}>
                <option value="general">General</option>
                <option value="reav">REAV</option>
              </select>
            </div>
            <div className="flex items-end pb-1">
              <div className="flex items-center gap-2">
                <input type="checkbox" id="treat-active" checked={form.active} onChange={(e) => setForm((p) => ({ ...p, active: e.target.checked }))} className="h-4 w-4 rounded border-[#E8E4DE] text-[#E87B5A] focus:ring-[#E87B5A]" />
                <label htmlFor="treat-active" className="text-sm font-medium text-[#2D2A26]">Activo</label>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="rounded-[10px] border border-[#E8E4DE] px-4 py-2 text-sm font-medium text-[#8A8580] hover:bg-[#FAF9F7] transition-colors">
              Cancelar
            </button>
            <button type="submit" className="rounded-[10px] bg-[#E87B5A] px-4 py-2 text-sm font-medium text-white hover:bg-[#D56E4F] transition-colors">
              {treatment ? "Guardar Cambios" : "Crear Tratamiento"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function TreatmentsTab() {
  const [filterCat, setFilterCat] = useState("");
  const [filterActive, setFilterActive] = useState<boolean | undefined>(undefined);
  const { data: catData } = useSpaCategories();
  const { data, isLoading } = useSpaTreatments(
    filterCat || undefined, filterActive
  );
  const createTreat = useCreateSpaTreatment();
  const updateTreat = useUpdateSpaTreatment();
  const deleteTreat = useDeleteSpaTreatment();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<SpaTreatment | null>(null);

  const categories = catData?.categories ?? [];
  const treatments = data?.treatments ?? [];

  const handleAdd = () => { setEditing(null); setModalOpen(true); };
  const handleEdit = (t: SpaTreatment) => { setEditing(t); setModalOpen(true); };

  const handleDelete = async (t: SpaTreatment) => {
    if (!confirm(`Eliminar el tratamiento "${t.title}"?`)) return;
    try { await deleteTreat.mutateAsync(t.id); toast.success("Tratamiento eliminado"); }
    catch { toast.error("Error al eliminar tratamiento"); }
  };

  const handleSave = async (d: TreatmentForm & { id?: string }) => {
    try {
      if (d.id) {
        await updateTreat.mutateAsync({ id: d.id, ...d });
        toast.success("Tratamiento actualizado");
      } else {
        await createTreat.mutateAsync(d);
        toast.success("Tratamiento creado");
      }
      setModalOpen(false);
    } catch { toast.error("Error al guardar tratamiento"); }
  };

  if (isLoading) return <PageSkeleton />;

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <select value={filterCat} onChange={(e) => setFilterCat(e.target.value)} className={inputCls + " w-48"}>
            <option value="">Todas las categorias</option>
            {categories.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
          </select>
          <select value={filterActive === undefined ? "" : String(filterActive)} onChange={(e) => setFilterActive(e.target.value === "" ? undefined : e.target.value === "true")} className={inputCls + " w-36"}>
            <option value="">Todos</option>
            <option value="true">Activos</option>
            <option value="false">Inactivos</option>
          </select>
          <p className="text-sm text-[#8A8580]">{treatments.length} tratamiento{treatments.length !== 1 ? "s" : ""}</p>
        </div>
        <button onClick={handleAdd} className="flex items-center gap-2 rounded-[10px] bg-[#E87B5A] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#D56E4F] transition-colors">
          <Plus className="h-4 w-4" /> Añadir Tratamiento
        </button>
      </div>

      {treatments.length === 0 ? (
        <div className="rounded-2xl bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-12 text-center">
          <Sparkles className="mx-auto h-10 w-10 text-[#8A8580] mb-3" />
          <p className="text-sm text-[#8A8580]">No hay tratamientos creados</p>
          <p className="text-xs text-[#8A8580] mt-1">Crea tu primer tratamiento para gestionar el spa</p>
        </div>
      ) : (
        <div className="rounded-2xl bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#E8E4DE] bg-[#FAF9F7]/50">
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#8A8580] uppercase tracking-wider">Titulo</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#8A8580] uppercase tracking-wider">Categoria</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-[#8A8580] uppercase tracking-wider">Duracion</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-[#8A8580] uppercase tracking-wider">Capacidad</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-[#8A8580] uppercase tracking-wider">Precio</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-[#8A8580] uppercase tracking-wider">Regimen</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-[#8A8580] uppercase tracking-wider">Estado</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-[#8A8580] uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E4DE]">
                {treatments.map((t) => (
                  <tr key={t.id} className="hover:bg-[#FAF9F7]/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-[#8A8580]" />
                        <span className="font-medium text-sm text-[#2D2A26]">{t.title}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-[#8A8580]">{t.category?.name ?? "—"}</td>
                    <td className="px-6 py-4 text-center text-sm text-[#8A8580]">{t.duration}min</td>
                    <td className="px-6 py-4 text-center text-sm text-[#8A8580]">{t.capacity}</td>
                    <td className="px-6 py-4 text-right text-sm text-[#2D2A26]">{fmt.format(t.price)}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex rounded-[6px] px-2 py-0.5 text-xs font-medium ${t.fiscalRegime === "reav" ? "bg-blue-50 text-blue-700" : "bg-gray-100 text-gray-600"}`}>
                        {t.fiscalRegime === "reav" ? "REAV" : "General"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex rounded-[6px] px-2 py-0.5 text-xs font-medium ${t.active ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>
                        {t.active ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => handleEdit(t)} className="rounded-[10px] p-1.5 text-[#8A8580] hover:bg-[#FAF9F7] hover:text-[#E87B5A] transition-colors" title="Editar">
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleDelete(t)} className="rounded-[10px] p-1.5 text-[#8A8580] hover:bg-red-50 hover:text-[#C75D4A] transition-colors" title="Eliminar">
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

      <TreatmentModal
        key={editing?.id ?? "new"}
        treatment={editing}
        categories={categories}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
      />
    </div>
  );
}
