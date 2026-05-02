"use client";

import { useState } from "react";
import { X } from "lucide-react";
import type { RoomType } from "@/hooks/useHotel";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export interface RoomTypeFormData {
  title: string;
  slug: string;
  capacity: number;
  basePrice: number;
  description: string | null;
  images: string[];
  active: boolean;
}

interface Props {
  room: RoomType | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: RoomTypeFormData & { id?: string }) => void;
}

const inputCls =
  "w-full rounded-[10px] border border-[#E8E4DE] px-3 py-2 text-sm text-[#2D2A26] placeholder:text-[#8A8580] focus:border-[#E87B5A] focus:outline-none focus:ring-1 focus:ring-[#E87B5A]";

export default function RoomTypeModal({ room, isOpen, onClose, onSave }: Props) {
  const [form, setForm] = useState<RoomTypeFormData>(() =>
    room
      ? { title: room.title, slug: room.slug, capacity: room.capacity, basePrice: room.basePrice, description: room.description, images: room.images, active: room.active }
      : { title: "", slug: "", capacity: 2, basePrice: 0, description: null, images: [], active: true }
  );
  const [imagesText, setImagesText] = useState(room?.images.join("\n") || "");

  if (!isOpen) return null;

  const handleTitleChange = (title: string) => {
    setForm((p) => ({ ...p, title, slug: room ? p.slug : slugify(title) }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const images = imagesText.split("\n").map((u) => u.trim()).filter(Boolean);
    onSave({ ...(room && { id: room.id }), ...form, images });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-[#E8E4DE] px-6 py-4">
          <h2 className="text-lg font-semibold text-[#2D2A26]">
            {room ? "Editar Habitación" : "Nueva Habitación"}
          </h2>
          <button onClick={onClose} className="rounded-[10px] p-1.5 text-[#8A8580] hover:bg-[#FAF9F7] transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          <div>
            <label className="block text-sm font-medium text-[#2D2A26] mb-1">Titulo</label>
            <input type="text" value={form.title} onChange={(e) => handleTitleChange(e.target.value)} className={inputCls} placeholder="Ej: Doble Estandar" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#2D2A26] mb-1">Slug</label>
            <input type="text" value={form.slug} onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value }))} className={inputCls} placeholder="doble-estandar" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#2D2A26] mb-1">Capacidad</label>
              <input type="number" min="1" value={form.capacity} onChange={(e) => setForm((p) => ({ ...p, capacity: parseInt(e.target.value) || 1 }))} className={inputCls} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#2D2A26] mb-1">Precio base (EUR)</label>
              <input type="number" min="0" step="0.01" value={form.basePrice} onChange={(e) => setForm((p) => ({ ...p, basePrice: parseFloat(e.target.value) || 0 }))} className={inputCls} required />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#2D2A26] mb-1">Descripción</label>
            <input type="text" value={form.description ?? ""} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value || null }))} className={inputCls} placeholder="Descripción opcional" />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#2D2A26] mb-1">URLs de imagenes (una por linea)</label>
            <textarea value={imagesText} onChange={(e) => setImagesText(e.target.value)} rows={3} className={inputCls} placeholder="https://ejemplo.com/imagen1.jpg" />
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="room-active" checked={form.active} onChange={(e) => setForm((p) => ({ ...p, active: e.target.checked }))} className="h-4 w-4 rounded border-[#E8E4DE] text-[#E87B5A] focus:ring-[#E87B5A]" />
            <label htmlFor="room-active" className="text-sm font-medium text-[#2D2A26]">Activa</label>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="rounded-[10px] border border-[#E8E4DE] px-4 py-2 text-sm font-medium text-[#8A8580] hover:bg-[#FAF9F7] transition-colors">
              Cancelar
            </button>
            <button type="submit" className="rounded-[10px] bg-[#E87B5A] px-4 py-2 text-sm font-medium text-white hover:bg-[#D56E4F] transition-colors">
              {room ? "Guardar Cambios" : "Crear Habitación"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
