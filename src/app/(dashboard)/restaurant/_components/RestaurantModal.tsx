"use client";

import { useState } from "react";
import { X } from "lucide-react";
import type { Restaurant } from "@/hooks/useRestaurant";

const DAY_LABELS = ["D", "L", "M", "X", "J", "V", "S"];
const DAY_OPTIONS = [
  { value: 1, label: "Lunes" }, { value: 2, label: "Martes" },
  { value: 3, label: "Miercoles" }, { value: 4, label: "Jueves" },
  { value: 5, label: "Viernes" }, { value: 6, label: "Sabado" },
  { value: 0, label: "Domingo" },
];

const inputCls =
  "w-full rounded-[10px] border border-[#E8E4DE] px-3 py-2 text-sm text-[#2D2A26] placeholder:text-[#8A8580] focus:border-[#E87B5A] focus:outline-none focus:ring-1 focus:ring-[#E87B5A]";

export interface RestaurantFormData {
  title: string;
  capacity: number;
  depositPerGuest: number;
  operatingDays: number[];
  description: string | null;
  active: boolean;
}

interface Props {
  restaurant: Restaurant | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (d: RestaurantFormData & { id?: string }) => void;
}

export default function RestaurantModal({ restaurant, isOpen, onClose, onSave }: Props) {
  const [form, setForm] = useState<RestaurantFormData>(() =>
    restaurant
      ? { title: restaurant.title, capacity: restaurant.capacity, depositPerGuest: restaurant.depositPerGuest, operatingDays: restaurant.operatingDays, description: restaurant.description, active: restaurant.active }
      : { title: "", capacity: 40, depositPerGuest: 0, operatingDays: [1, 2, 3, 4, 5, 6, 0], description: null, active: true }
  );

  if (!isOpen) return null;

  const toggleDay = (day: number) => {
    setForm((p) => ({
      ...p,
      operatingDays: p.operatingDays.includes(day)
        ? p.operatingDays.filter((d) => d !== day)
        : [...p.operatingDays, day].sort(),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ ...(restaurant && { id: restaurant.id }), ...form });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-[#E8E4DE] px-6 py-4">
          <h2 className="text-lg font-semibold text-[#2D2A26]">
            {restaurant ? "Editar Restaurante" : "Nuevo Restaurante"}
          </h2>
          <button onClick={onClose} className="rounded-[10px] p-1.5 text-[#8A8580] hover:bg-[#FAF9F7] transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          <div>
            <label className="block text-sm font-medium text-[#2D2A26] mb-1">Nombre</label>
            <input type="text" value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} className={inputCls} placeholder="Ej: Restaurante La Montaña" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#2D2A26] mb-1">Capacidad</label>
              <input type="number" min="1" value={form.capacity} onChange={(e) => setForm((p) => ({ ...p, capacity: parseInt(e.target.value) || 1 }))} className={inputCls} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#2D2A26] mb-1">Depósito/persona (EUR)</label>
              <input type="number" min="0" step="0.01" value={form.depositPerGuest} onChange={(e) => setForm((p) => ({ ...p, depositPerGuest: parseFloat(e.target.value) || 0 }))} className={inputCls} required />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#2D2A26] mb-1">Dias de operacion</label>
            <div className="flex gap-2">
              {DAY_OPTIONS.map((d) => (
                <button key={d.value} type="button" onClick={() => toggleDay(d.value)}
                  className={`h-9 w-9 rounded-[10px] text-xs font-medium transition-colors ${form.operatingDays.includes(d.value) ? "bg-[#E87B5A] text-white" : "border border-[#E8E4DE] text-[#8A8580] hover:bg-[#FAF9F7]"}`}>
                  {DAY_LABELS[d.value]}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#2D2A26] mb-1">Descripción</label>
            <input type="text" value={form.description ?? ""} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value || null }))} className={inputCls} placeholder="Descripción opcional" />
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="rest-active" checked={form.active} onChange={(e) => setForm((p) => ({ ...p, active: e.target.checked }))} className="h-4 w-4 rounded border-[#E8E4DE] text-[#E87B5A] focus:ring-[#E87B5A]" />
            <label htmlFor="rest-active" className="text-sm font-medium text-[#2D2A26]">Activo</label>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="rounded-[10px] border border-[#E8E4DE] px-4 py-2 text-sm font-medium text-[#8A8580] hover:bg-[#FAF9F7] transition-colors">Cancelar</button>
            <button type="submit" className="rounded-[10px] bg-[#E87B5A] px-4 py-2 text-sm font-medium text-white hover:bg-[#D56E4F] transition-colors">
              {restaurant ? "Guardar Cambios" : "Crear Restaurante"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
