"use client";

import { useState } from "react";
import { Plus, Trash2, CalendarDays, X } from "lucide-react";
import { toast } from "sonner";
import {
  useSpaScheduleTemplates,
  useCreateSpaScheduleTemplate,
  useDeleteSpaScheduleTemplate,
  useSpaTreatments,
  useSpaResources,
} from "@/hooks/useSpa";
import type { SpaScheduleTemplate } from "@/hooks/useSpa";
import { PageSkeleton } from "@/components/shared/LoadingSkeleton";

const inputCls =
  "w-full rounded-[10px] border border-[#E8E4DE] px-3 py-2 text-sm text-[#2D2A26] placeholder:text-[#8A8580] focus:border-[#E87B5A] focus:outline-none focus:ring-1 focus:ring-[#E87B5A]";

const DAYS = [
  { value: 1, label: "Lunes" },
  { value: 2, label: "Martes" },
  { value: 3, label: "Miercoles" },
  { value: 4, label: "Jueves" },
  { value: 5, label: "Viernes" },
  { value: 6, label: "Sabado" },
  { value: 0, label: "Domingo" },
];

interface TemplateForm {
  startTime: string; endTime: string;
  treatmentId: string; capacity: number;
  resourceIds: string[];
}

function TemplateModal({ treatments, resources, dayOfWeek, isOpen, onClose, onSave }: {
  treatments: { id: string; title: string }[];
  resources: { id: string; name: string }[];
  dayOfWeek: number; isOpen: boolean; onClose: () => void;
  onSave: (d: TemplateForm) => void;
}) {
  const [form, setForm] = useState<TemplateForm>({
    startTime: "09:00", endTime: "10:00",
    treatmentId: "", capacity: 1, resourceIds: [],
  });

  if (!isOpen) return null;

  const toggleResource = (id: string) => {
    setForm((p) => ({
      ...p,
      resourceIds: p.resourceIds.includes(id)
        ? p.resourceIds.filter((r) => r !== id)
        : [...p.resourceIds, id],
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(form);
  };

  const dayLabel = DAYS.find((d) => d.value === dayOfWeek)?.label ?? "";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-[#E8E4DE] px-6 py-4">
          <h2 className="text-lg font-semibold text-[#2D2A26]">
            Nueva Plantilla - {dayLabel}
          </h2>
          <button onClick={onClose} className="rounded-[10px] p-1.5 text-[#8A8580] hover:bg-[#FAF9F7] transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#2D2A26] mb-1">Hora inicio</label>
              <input type="time" value={form.startTime} onChange={(e) => setForm((p) => ({ ...p, startTime: e.target.value }))} className={inputCls} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#2D2A26] mb-1">Hora fin</label>
              <input type="time" value={form.endTime} onChange={(e) => setForm((p) => ({ ...p, endTime: e.target.value }))} className={inputCls} required />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#2D2A26] mb-1">Tratamiento (opcional)</label>
            <select value={form.treatmentId} onChange={(e) => setForm((p) => ({ ...p, treatmentId: e.target.value }))} className={inputCls}>
              <option value="">Cualquier tratamiento</option>
              {treatments.map((t) => (<option key={t.id} value={t.id}>{t.title}</option>))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#2D2A26] mb-1">Capacidad</label>
            <input type="number" min="1" value={form.capacity} onChange={(e) => setForm((p) => ({ ...p, capacity: parseInt(e.target.value) || 1 }))} className={inputCls} required />
          </div>
          {resources.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-[#2D2A26] mb-2">Recursos asignados</label>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {resources.map((r) => (
                  <label key={r.id} className="flex items-center gap-2 text-sm text-[#2D2A26] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.resourceIds.includes(r.id)}
                      onChange={() => toggleResource(r.id)}
                      className="h-4 w-4 rounded border-[#E8E4DE] text-[#E87B5A] focus:ring-[#E87B5A]"
                    />
                    {r.name}
                  </label>
                ))}
              </div>
            </div>
          )}
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="rounded-[10px] border border-[#E8E4DE] px-4 py-2 text-sm font-medium text-[#8A8580] hover:bg-[#FAF9F7] transition-colors">
              Cancelar
            </button>
            <button type="submit" className="rounded-[10px] bg-[#E87B5A] px-4 py-2 text-sm font-medium text-white hover:bg-[#D56E4F] transition-colors">
              Crear Plantilla
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ScheduleTab() {
  const [selectedDay, setSelectedDay] = useState(1);
  const { data, isLoading } = useSpaScheduleTemplates(selectedDay);
  const { data: treatData } = useSpaTreatments(undefined, true);
  const { data: resData } = useSpaResources();
  const createTemplate = useCreateSpaScheduleTemplate();
  const deleteTemplate = useDeleteSpaScheduleTemplate();
  const [modalOpen, setModalOpen] = useState(false);

  const treatments = treatData?.treatments ?? [];
  const resources = resData?.resources ?? [];
  const templates = data?.templates ?? [];

  const treatmentName = (id: string | null) => {
    if (!id) return "Cualquier tratamiento";
    return treatments.find((t) => t.id === id)?.title ?? "—";
  };

  const resourceNames = (ids: string[]) => {
    if (!ids.length) return "Sin recursos";
    return ids
      .map((id) => resources.find((r) => r.id === id)?.name ?? "—")
      .join(", ");
  };

  const handleDelete = async (t: SpaScheduleTemplate) => {
    if (!confirm("Eliminar esta plantilla?")) return;
    try { await deleteTemplate.mutateAsync(t.id); toast.success("Plantilla eliminada"); }
    catch { toast.error("Error al eliminar plantilla"); }
  };

  const handleSave = async (d: TemplateForm) => {
    try {
      await createTemplate.mutateAsync({
        dayOfWeek: selectedDay,
        startTime: d.startTime,
        endTime: d.endTime,
        treatmentId: d.treatmentId || null,
        capacity: d.capacity,
        resourceIds: d.resourceIds,
      });
      toast.success("Plantilla creada");
      setModalOpen(false);
    } catch { toast.error("Error al crear plantilla"); }
  };

  return (
    <div className="space-y-4">
      {/* Day selector tabs */}
      <div className="flex gap-1 border-b border-[#E8E4DE]">
        {DAYS.map((day) => (
          <button
            key={day.value}
            onClick={() => setSelectedDay(day.value)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              selectedDay === day.value
                ? "border-[#E87B5A] text-[#E87B5A]"
                : "border-transparent text-[#8A8580] hover:text-[#2D2A26] hover:border-[#E8E4DE]"
            }`}
          >
            {day.label}
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-[#8A8580]">
          {templates.length} plantilla{templates.length !== 1 ? "s" : ""} para {DAYS.find((d) => d.value === selectedDay)?.label}
        </p>
        <button onClick={() => setModalOpen(true)} className="flex items-center gap-2 rounded-[10px] bg-[#E87B5A] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#D56E4F] transition-colors">
          <Plus className="h-4 w-4" /> Añadir Plantilla
        </button>
      </div>

      {isLoading ? (
        <PageSkeleton />
      ) : templates.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <CalendarDays className="mx-auto h-10 w-10 text-[#8A8580] mb-3" />
          <p className="text-sm text-[#8A8580]">No hay plantillas para este dia</p>
          <p className="text-xs text-[#8A8580] mt-1">Crea plantillas de horario para generar slots automaticamente</p>
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#E8E4DE] bg-[#FAF9F7]/50">
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#8A8580] uppercase tracking-wider">Horario</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#8A8580] uppercase tracking-wider">Tratamiento</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-[#8A8580] uppercase tracking-wider">Capacidad</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#8A8580] uppercase tracking-wider">Recursos</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-[#8A8580] uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E4DE]">
                {templates.map((t) => (
                  <tr key={t.id} className="hover:bg-[#FAF9F7]/30 transition-colors">
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-[#2D2A26]">
                        {t.startTime} - {t.endTime}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-[#8A8580]">
                      {treatmentName(t.treatmentId)}
                    </td>
                    <td className="px-6 py-4 text-center text-sm text-[#8A8580]">{t.capacity}</td>
                    <td className="px-6 py-4 text-sm text-[#8A8580]">
                      {resourceNames(t.resourceIds)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => handleDelete(t)} className="rounded-[10px] p-1.5 text-[#8A8580] hover:bg-red-50 hover:text-[#C75D4A] transition-colors" title="Eliminar">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <TemplateModal
        treatments={treatments.map((t) => ({ id: t.id, title: t.title }))}
        resources={resources.map((r) => ({ id: r.id, name: r.name }))}
        dayOfWeek={selectedDay}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
      />
    </div>
  );
}
