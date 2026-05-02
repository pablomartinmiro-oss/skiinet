"use client";

import { useState } from "react";
import { X } from "lucide-react";
import type { RoomType } from "@/hooks/useHotel";

const REASONS = [
  { value: "closure", label: "Cierre" },
  { value: "reduced_capacity", label: "Capacidad reducida" },
  { value: "maintenance", label: "Mantenimiento" },
  { value: "other", label: "Otro" },
];

export interface BlockFormData {
  roomTypeId: string;
  date: string;
  unitCount: number;
  reason: string;
}

interface Props {
  rooms: RoomType[];
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: BlockFormData) => void;
}

const inputCls =
  "w-full rounded-[10px] border border-[#E8E4DE] px-3 py-2 text-sm text-[#2D2A26] focus:border-[#E87B5A] focus:outline-none focus:ring-1 focus:ring-[#E87B5A]";

export default function BlockModal({ rooms, isOpen, onClose, onSave }: Props) {
  const [form, setForm] = useState<BlockFormData>({
    roomTypeId: "",
    date: "",
    unitCount: 1,
    reason: "closure",
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-[#E8E4DE] px-6 py-4">
          <h2 className="text-lg font-semibold text-[#2D2A26]">Nuevo Bloqueo</h2>
          <button onClick={onClose} className="rounded-[10px] p-1.5 text-[#8A8580] hover:bg-[#FAF9F7] transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          <div>
            <label className="block text-sm font-medium text-[#2D2A26] mb-1">Tipo de habitación</label>
            <select value={form.roomTypeId} onChange={(e) => setForm((p) => ({ ...p, roomTypeId: e.target.value }))} className={inputCls} required>
              <option value="">Seleccionar habitación...</option>
              {rooms.map((r) => (
                <option key={r.id} value={r.id}>{r.title}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#2D2A26] mb-1">Fecha</label>
              <input type="date" value={form.date} onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))} className={inputCls} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#2D2A26] mb-1">Unidades bloqueadas</label>
              <input type="number" min="1" value={form.unitCount} onChange={(e) => setForm((p) => ({ ...p, unitCount: parseInt(e.target.value) || 1 }))} className={inputCls} required />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#2D2A26] mb-1">Motivo</label>
            <select value={form.reason} onChange={(e) => setForm((p) => ({ ...p, reason: e.target.value }))} className={inputCls}>
              {REASONS.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="rounded-[10px] border border-[#E8E4DE] px-4 py-2 text-sm font-medium text-[#8A8580] hover:bg-[#FAF9F7] transition-colors">
              Cancelar
            </button>
            <button type="submit" className="rounded-[10px] bg-[#E87B5A] px-4 py-2 text-sm font-medium text-white hover:bg-[#D56E4F] transition-colors">
              Crear Bloqueo
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
