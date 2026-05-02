"use client";

import { useState } from "react";
import { Plus, Trash2, Clock, X } from "lucide-react";
import { toast } from "sonner";
import {
  useSpaSlots,
  useCreateSpaSlot,
  useUpdateSpaSlot,
  useDeleteSpaSlot,
  useSpaTreatments,
  useSpaResources,
} from "@/hooks/useSpa";
import type { SpaSlot } from "@/hooks/useSpa";
import { PageSkeleton } from "@/components/shared/LoadingSkeleton";

const inputCls =
  "w-full rounded-[10px] border border-[#E8E4DE] px-3 py-2 text-sm text-[#2D2A26] placeholder:text-[#8A8580] focus:border-[#E87B5A] focus:outline-none focus:ring-1 focus:ring-[#E87B5A]";

const STATUS_BADGES: Record<string, { label: string; color: string }> = {
  available: { label: "Disponible", color: "bg-emerald-50 text-emerald-700" },
  blocked: { label: "Bloqueado", color: "bg-red-50 text-red-700" },
  full: { label: "Completo", color: "bg-amber-50 text-amber-700" },
};

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

interface SlotForm {
  date: string; time: string; treatmentId: string;
  resourceId: string; capacity: number;
}

function SlotModal({ treatments, resources, isOpen, onClose, onSave }: {
  treatments: { id: string; title: string }[];
  resources: { id: string; name: string }[];
  isOpen: boolean; onClose: () => void;
  onSave: (d: SlotForm) => void;
}) {
  const [form, setForm] = useState<SlotForm>({
    date: todayStr(), time: "09:00",
    treatmentId: treatments[0]?.id ?? "",
    resourceId: "", capacity: 1,
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-[#E8E4DE] px-6 py-4">
          <h2 className="text-lg font-semibold text-[#2D2A26]">Nuevo Horario</h2>
          <button onClick={onClose} className="rounded-[10px] p-1.5 text-[#8A8580] hover:bg-[#FAF9F7] transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#2D2A26] mb-1">Fecha</label>
              <input type="date" value={form.date} onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))} className={inputCls} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#2D2A26] mb-1">Hora</label>
              <input type="time" value={form.time} onChange={(e) => setForm((p) => ({ ...p, time: e.target.value }))} className={inputCls} required />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#2D2A26] mb-1">Tratamiento</label>
            <select value={form.treatmentId} onChange={(e) => setForm((p) => ({ ...p, treatmentId: e.target.value }))} className={inputCls} required>
              <option value="" disabled>Seleccionar tratamiento</option>
              {treatments.map((t) => (<option key={t.id} value={t.id}>{t.title}</option>))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#2D2A26] mb-1">Recurso (opcional)</label>
            <select value={form.resourceId} onChange={(e) => setForm((p) => ({ ...p, resourceId: e.target.value }))} className={inputCls}>
              <option value="">Sin asignar</option>
              {resources.map((r) => (<option key={r.id} value={r.id}>{r.name}</option>))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#2D2A26] mb-1">Capacidad</label>
            <input type="number" min="1" value={form.capacity} onChange={(e) => setForm((p) => ({ ...p, capacity: parseInt(e.target.value) || 1 }))} className={inputCls} required />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="rounded-[10px] border border-[#E8E4DE] px-4 py-2 text-sm font-medium text-[#8A8580] hover:bg-[#FAF9F7] transition-colors">
              Cancelar
            </button>
            <button type="submit" className="rounded-[10px] bg-[#E87B5A] px-4 py-2 text-sm font-medium text-white hover:bg-[#D56E4F] transition-colors">
              Crear Horario
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function SlotsTab() {
  const [filterDate, setFilterDate] = useState(todayStr());
  const [filterTreatment, setFilterTreatment] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const { data: treatData } = useSpaTreatments(undefined, true);
  const { data: resData } = useSpaResources();
  const { data, isLoading } = useSpaSlots(
    filterDate || undefined,
    filterTreatment || undefined,
    filterStatus || undefined
  );
  const createSlot = useCreateSpaSlot();
  const updateSlot = useUpdateSpaSlot();
  const deleteSlot = useDeleteSpaSlot();

  const [modalOpen, setModalOpen] = useState(false);

  const treatments = treatData?.treatments ?? [];
  const resources = resData?.resources ?? [];
  const slots = data?.slots ?? [];

  const handleDelete = async (s: SpaSlot) => {
    if (!confirm("Eliminar este horario?")) return;
    try { await deleteSlot.mutateAsync(s.id); toast.success("Horario eliminado"); }
    catch { toast.error("Error al eliminar horario"); }
  };

  const handleStatusChange = async (s: SpaSlot, status: string) => {
    try {
      await updateSlot.mutateAsync({ id: s.id, status });
      toast.success("Estado actualizado");
    } catch { toast.error("Error al actualizar estado"); }
  };

  const handleSave = async (d: SlotForm) => {
    try {
      await createSlot.mutateAsync({
        date: d.date,
        time: d.time,
        treatmentId: d.treatmentId,
        resourceId: d.resourceId || null,
        capacity: d.capacity,
      });
      toast.success("Horario creado");
      setModalOpen(false);
    } catch { toast.error("Error al crear horario"); }
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <div>
          <label className="block text-sm font-medium text-[#2D2A26] mb-1">Fecha</label>
          <input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} className={inputCls} />
        </div>
        <div>
          <label className="block text-sm font-medium text-[#2D2A26] mb-1">Tratamiento</label>
          <select value={filterTreatment} onChange={(e) => setFilterTreatment(e.target.value)} className={inputCls}>
            <option value="">Todos</option>
            {treatments.map((t) => (<option key={t.id} value={t.id}>{t.title}</option>))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-[#2D2A26] mb-1">Estado</label>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className={inputCls}>
            <option value="">Todos</option>
            <option value="available">Disponible</option>
            <option value="blocked">Bloqueado</option>
            <option value="full">Completo</option>
          </select>
        </div>
        <div className="flex items-end">
          <button onClick={() => setModalOpen(true)} className="flex items-center gap-2 rounded-[10px] bg-[#E87B5A] px-4 py-2 text-sm font-medium text-white hover:bg-[#D56E4F] transition-colors w-full justify-center">
            <Plus className="h-4 w-4" /> Añadir Horario
          </button>
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <PageSkeleton />
      ) : slots.length === 0 ? (
        <div className="rounded-2xl bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-12 text-center">
          <Clock className="mx-auto h-10 w-10 text-[#8A8580] mb-3" />
          <p className="text-sm text-[#8A8580]">No hay horarios para esta fecha</p>
          <p className="text-xs text-[#8A8580] mt-1">Crea un horario para gestionar las citas del spa</p>
        </div>
      ) : (
        <div className="rounded-2xl bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#E8E4DE] bg-[#FAF9F7]/50">
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#8A8580] uppercase tracking-wider">Hora</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#8A8580] uppercase tracking-wider">Tratamiento</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#8A8580] uppercase tracking-wider">Recurso</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-[#8A8580] uppercase tracking-wider">Capacidad</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-[#8A8580] uppercase tracking-wider">Reservados</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-[#8A8580] uppercase tracking-wider">Estado</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-[#8A8580] uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E4DE]">
                {slots.map((s) => {
                  const badge = STATUS_BADGES[s.status] ?? { label: s.status, color: "bg-gray-100 text-gray-600" };
                  return (
                    <tr key={s.id} className="hover:bg-[#FAF9F7]/30 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-[#2D2A26]">{s.time}</td>
                      <td className="px-6 py-4 text-sm text-[#2D2A26]">{s.treatment?.title ?? "—"}</td>
                      <td className="px-6 py-4 text-sm text-[#8A8580]">{s.resource?.name ?? "Sin asignar"}</td>
                      <td className="px-6 py-4 text-center text-sm text-[#8A8580]">{s.capacity}</td>
                      <td className="px-6 py-4 text-center text-sm text-[#8A8580]">{s.booked}</td>
                      <td className="px-6 py-4 text-center">
                        <select
                          value={s.status}
                          onChange={(e) => handleStatusChange(s, e.target.value)}
                          className={`inline-flex rounded-[6px] px-2 py-0.5 text-xs font-medium border-0 cursor-pointer ${badge.color}`}
                        >
                          <option value="available">Disponible</option>
                          <option value="blocked">Bloqueado</option>
                          <option value="full">Completo</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button onClick={() => handleDelete(s)} className="rounded-[10px] p-1.5 text-[#8A8580] hover:bg-red-50 hover:text-[#C75D4A] transition-colors" title="Eliminar">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <SlotModal
        treatments={treatments.map((t) => ({ id: t.id, title: t.title }))}
        resources={resources.map((r) => ({ id: r.id, name: r.name }))}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
      />
    </div>
  );
}
