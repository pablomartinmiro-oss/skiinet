"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, X, CalendarRange } from "lucide-react";
import { toast } from "sonner";
import {
  useRoomSeasons, useCreateRoomSeason, useUpdateRoomSeason, useDeleteRoomSeason,
} from "@/hooks/useHotel";
import type { RoomRateSeason } from "@/hooks/useHotel";
import { PageSkeleton } from "@/components/shared/LoadingSkeleton";

interface SeasonFormData { name: string; startDate: string; endDate: string }

const inputCls =
  "w-full rounded-[10px] border border-[#E8E4DE] px-3 py-2 text-sm text-[#2D2A26] focus:border-[#E87B5A] focus:outline-none focus:ring-1 focus:ring-[#E87B5A]";

function SeasonModal({ season, isOpen, onClose, onSave }: {
  season: RoomRateSeason | null; isOpen: boolean;
  onClose: () => void; onSave: (d: SeasonFormData & { id?: string }) => void;
}) {
  const [form, setForm] = useState<SeasonFormData>(() =>
    season
      ? { name: season.name, startDate: season.startDate.slice(0, 10), endDate: season.endDate.slice(0, 10) }
      : { name: "", startDate: "", endDate: "" }
  );

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ ...(season && { id: season.id }), ...form });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-[#E8E4DE] px-6 py-4">
          <h2 className="text-lg font-semibold text-[#2D2A26]">
            {season ? "Editar Temporada" : "Nueva Temporada"}
          </h2>
          <button onClick={onClose} className="rounded-[10px] p-1.5 text-[#8A8580] hover:bg-[#FAF9F7] transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          <div>
            <label className="block text-sm font-medium text-[#2D2A26] mb-1">Nombre</label>
            <input type="text" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} className={inputCls} placeholder="Ej: Temporada Alta Navidad" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#2D2A26] mb-1">Fecha inicio</label>
              <input type="date" value={form.startDate} onChange={(e) => setForm((p) => ({ ...p, startDate: e.target.value }))} className={inputCls} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#2D2A26] mb-1">Fecha fin</label>
              <input type="date" value={form.endDate} onChange={(e) => setForm((p) => ({ ...p, endDate: e.target.value }))} className={inputCls} required />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="rounded-[10px] border border-[#E8E4DE] px-4 py-2 text-sm font-medium text-[#8A8580] hover:bg-[#FAF9F7] transition-colors">
              Cancelar
            </button>
            <button type="submit" className="rounded-[10px] bg-[#E87B5A] px-4 py-2 text-sm font-medium text-white hover:bg-[#D56E4F] transition-colors">
              {season ? "Guardar Cambios" : "Crear Temporada"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" });
}

export default function SeasonsTab() {
  const { data, isLoading } = useRoomSeasons();
  const createSeason = useCreateRoomSeason();
  const updateSeason = useUpdateRoomSeason();
  const deleteSeason = useDeleteRoomSeason();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<RoomRateSeason | null>(null);

  if (isLoading) return <PageSkeleton />;
  const seasons = data?.seasons || [];

  const handleAdd = () => { setEditing(null); setModalOpen(true); };
  const handleEdit = (s: RoomRateSeason) => { setEditing(s); setModalOpen(true); };

  const handleDelete = async (s: RoomRateSeason) => {
    if (!confirm(`Eliminar la temporada "${s.name}"?`)) return;
    try { await deleteSeason.mutateAsync(s.id); toast.success("Temporada eliminada"); }
    catch { toast.error("Error al eliminar temporada"); }
  };

  const handleSave = async (d: SeasonFormData & { id?: string }) => {
    try {
      if (d.id) {
        await updateSeason.mutateAsync({ id: d.id, name: d.name, startDate: d.startDate, endDate: d.endDate });
        toast.success("Temporada actualizada");
      } else {
        await createSeason.mutateAsync({ name: d.name, startDate: d.startDate, endDate: d.endDate });
        toast.success("Temporada creada");
      }
      setModalOpen(false);
    } catch { toast.error("Error al guardar temporada"); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-[#8A8580]">{seasons.length} temporada{seasons.length !== 1 ? "s" : ""}</p>
        <button onClick={handleAdd} className="flex items-center gap-2 rounded-[10px] bg-[#E87B5A] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#D56E4F] transition-colors">
          <Plus className="h-4 w-4" />
          Añadir Temporada
        </button>
      </div>

      {seasons.length === 0 ? (
        <div className="rounded-2xl bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-12 text-center">
          <CalendarRange className="mx-auto h-10 w-10 text-[#8A8580] mb-3" />
          <p className="text-sm text-[#8A8580]">No hay temporadas creadas</p>
          <p className="text-xs text-[#8A8580] mt-1">Crea temporadas para definir las tarifas por periodo</p>
        </div>
      ) : (
        <div className="rounded-2xl bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#E8E4DE] bg-[#FAF9F7]/50">
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#8A8580] uppercase tracking-wider">Nombre</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#8A8580] uppercase tracking-wider">Fecha inicio</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#8A8580] uppercase tracking-wider">Fecha fin</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-[#8A8580] uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E4DE]">
                {seasons.map((s) => (
                  <tr key={s.id} className="hover:bg-[#FAF9F7]/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <CalendarRange className="h-4 w-4 text-[#8A8580]" />
                        <span className="font-medium text-sm text-[#2D2A26]">{s.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-[#8A8580]">{formatDate(s.startDate)}</td>
                    <td className="px-6 py-4 text-sm text-[#8A8580]">{formatDate(s.endDate)}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => handleEdit(s)} className="rounded-[10px] p-1.5 text-[#8A8580] hover:bg-[#FAF9F7] hover:text-[#E87B5A] transition-colors" title="Editar">
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleDelete(s)} className="rounded-[10px] p-1.5 text-[#8A8580] hover:bg-red-50 hover:text-[#C75D4A] transition-colors" title="Eliminar">
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

      <SeasonModal key={editing?.id ?? "new"} season={editing} isOpen={modalOpen} onClose={() => setModalOpen(false)} onSave={handleSave} />
    </div>
  );
}
