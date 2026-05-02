"use client";

import { useState } from "react";
import { Trash2, Clock, Ban } from "lucide-react";
import { toast } from "sonner";
import {
  useShifts, useCreateShift, useDeleteShift,
  useClosures, useCreateClosure, useDeleteClosure,
} from "@/hooks/useRestaurant";
import type { Restaurant, Shift } from "@/hooks/useRestaurant";

const inputCls =
  "w-full rounded-[10px] border border-[#E8E4DE] px-3 py-2 text-sm text-[#2D2A26] focus:border-[#E87B5A] focus:outline-none focus:ring-1 focus:ring-[#E87B5A]";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" });
}

export default function ShiftsClosuresPanel({ restaurant }: { restaurant: Restaurant }) {
  const { data: shiftsData } = useShifts(restaurant.id);
  const createShift = useCreateShift();
  const deleteShift = useDeleteShift();
  const { data: closuresData } = useClosures(restaurant.id);
  const createClosure = useCreateClosure();
  const deleteClosure = useDeleteClosure();

  const [showShiftForm, setShowShiftForm] = useState(false);
  const [showClosureForm, setShowClosureForm] = useState(false);
  const [shiftForm, setShiftForm] = useState({ name: "", startTime: "12:00", endTime: "16:00", maxCapacity: 30, slotDuration: 90 });
  const [closureForm, setClosureForm] = useState({ date: "", reason: "" });

  const shifts = shiftsData?.shifts || [];
  const closures = closuresData?.closures || [];

  const handleAddShift = async () => {
    try {
      await createShift.mutateAsync({ restaurantId: restaurant.id, ...shiftForm });
      toast.success("Turno creado");
      setShowShiftForm(false);
      setShiftForm({ name: "", startTime: "12:00", endTime: "16:00", maxCapacity: 30, slotDuration: 90 });
    } catch { toast.error("Error al crear turno"); }
  };

  const handleDeleteShift = async (s: Shift) => {
    if (!confirm(`Eliminar turno "${s.name}"?`)) return;
    try { await deleteShift.mutateAsync(s.id); toast.success("Turno eliminado"); }
    catch { toast.error("Error al eliminar turno"); }
  };

  const handleAddClosure = async () => {
    try {
      await createClosure.mutateAsync({ restaurantId: restaurant.id, ...closureForm });
      toast.success("Cierre creado");
      setShowClosureForm(false);
      setClosureForm({ date: "", reason: "" });
    } catch { toast.error("Error al crear cierre"); }
  };

  return (
    <div className="bg-[#FAF9F7] border-t border-[#E8E4DE] px-6 py-4 space-y-4">
      {/* Shifts */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-semibold text-[#2D2A26] flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" /> Turnos
          </h4>
          <button onClick={() => setShowShiftForm(!showShiftForm)} className="text-xs text-[#E87B5A] hover:text-[#D56E4F] font-medium">
            {showShiftForm ? "Cancelar" : "+ Añadir turno"}
          </button>
        </div>
        {shifts.length > 0 && (
          <table className="w-full text-xs mb-2">
            <thead>
              <tr className="text-[#8A8580]">
                <th className="text-left py-1 font-medium">Turno</th>
                <th className="text-left py-1 font-medium">Inicio</th>
                <th className="text-left py-1 font-medium">Fin</th>
                <th className="text-center py-1 font-medium">Cap. max</th>
                <th className="text-center py-1 font-medium">Duracion</th>
                <th className="text-right py-1 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8E4DE]">
              {shifts.map((s) => (
                <tr key={s.id}>
                  <td className="py-1.5 text-[#2D2A26] font-medium">{s.name}</td>
                  <td className="py-1.5 text-[#8A8580]">{s.startTime}</td>
                  <td className="py-1.5 text-[#8A8580]">{s.endTime}</td>
                  <td className="py-1.5 text-center text-[#8A8580]">{s.maxCapacity}</td>
                  <td className="py-1.5 text-center text-[#8A8580]">{s.slotDuration} min</td>
                  <td className="py-1.5 text-right">
                    <button onClick={() => handleDeleteShift(s)} className="text-[#8A8580] hover:text-[#C75D4A]">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {shifts.length === 0 && !showShiftForm && (
          <p className="text-xs text-[#8A8580]">Sin turnos configurados</p>
        )}
        {showShiftForm && (
          <div className="grid grid-cols-5 gap-2 items-end">
            <div>
              <label className="block text-xs text-[#8A8580] mb-0.5">Nombre</label>
              <input type="text" value={shiftForm.name} onChange={(e) => setShiftForm((p) => ({ ...p, name: e.target.value }))} className={inputCls} placeholder="Comida" required />
            </div>
            <div>
              <label className="block text-xs text-[#8A8580] mb-0.5">Inicio</label>
              <input type="time" value={shiftForm.startTime} onChange={(e) => setShiftForm((p) => ({ ...p, startTime: e.target.value }))} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs text-[#8A8580] mb-0.5">Fin</label>
              <input type="time" value={shiftForm.endTime} onChange={(e) => setShiftForm((p) => ({ ...p, endTime: e.target.value }))} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs text-[#8A8580] mb-0.5">Cap. max</label>
              <input type="number" min="1" value={shiftForm.maxCapacity} onChange={(e) => setShiftForm((p) => ({ ...p, maxCapacity: parseInt(e.target.value) || 1 }))} className={inputCls} />
            </div>
            <button onClick={handleAddShift} className="rounded-[10px] bg-[#E87B5A] px-3 py-2 text-xs font-medium text-white hover:bg-[#D56E4F] transition-colors">
              Crear
            </button>
          </div>
        )}
      </div>

      {/* Closures */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-semibold text-[#2D2A26] flex items-center gap-1.5">
            <Ban className="h-3.5 w-3.5" /> Cierres programados
          </h4>
          <button onClick={() => setShowClosureForm(!showClosureForm)} className="text-xs text-[#E87B5A] hover:text-[#D56E4F] font-medium">
            {showClosureForm ? "Cancelar" : "+ Añadir cierre"}
          </button>
        </div>
        {closures.length > 0 ? (
          <div className="space-y-1">
            {closures.map((c) => (
              <div key={c.id} className="flex items-center justify-between text-xs bg-white rounded-[10px] px-3 py-2 border border-[#E8E4DE]">
                <div>
                  <span className="text-[#2D2A26] font-medium">{formatDate(c.date)}</span>
                  <span className="text-[#8A8580] ml-2">{c.reason}</span>
                </div>
                <button onClick={async () => {
                  if (!confirm("Eliminar este cierre?")) return;
                  try { await deleteClosure.mutateAsync(c.id); toast.success("Cierre eliminado"); }
                  catch { toast.error("Error al eliminar cierre"); }
                }} className="text-[#8A8580] hover:text-[#C75D4A]">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        ) : !showClosureForm ? (
          <p className="text-xs text-[#8A8580]">Sin cierres programados</p>
        ) : null}
        {showClosureForm && (
          <div className="grid grid-cols-3 gap-2 items-end mt-2">
            <div>
              <label className="block text-xs text-[#8A8580] mb-0.5">Fecha</label>
              <input type="date" value={closureForm.date} onChange={(e) => setClosureForm((p) => ({ ...p, date: e.target.value }))} className={inputCls} required />
            </div>
            <div>
              <label className="block text-xs text-[#8A8580] mb-0.5">Motivo</label>
              <input type="text" value={closureForm.reason} onChange={(e) => setClosureForm((p) => ({ ...p, reason: e.target.value }))} className={inputCls} placeholder="Ej: Festivo" required />
            </div>
            <button onClick={handleAddClosure} className="rounded-[10px] bg-[#E87B5A] px-3 py-2 text-xs font-medium text-white hover:bg-[#D56E4F] transition-colors">
              Crear
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
