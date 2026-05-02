"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, Image, GripVertical } from "lucide-react";
import { toast } from "sonner";
import {
  useSlideshowItems,
  useCreateSlideshowItem,
  useUpdateSlideshowItem,
  useDeleteSlideshowItem,
} from "@/hooks/useCms";
import type { SlideshowItem } from "@/hooks/useCms";
import { PageSkeleton } from "@/components/shared/LoadingSkeleton";
import SlideModal from "./SlideModal";
import type { SlideForm } from "./SlideModal";

export default function SlideshowTab() {
  const { data, isLoading } = useSlideshowItems();
  const createSlide = useCreateSlideshowItem();
  const updateSlide = useUpdateSlideshowItem();
  const deleteSlide = useDeleteSlideshowItem();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<SlideshowItem | null>(null);

  const items = data?.items ?? [];

  const handleAdd = () => {
    setEditing(null);
    setModalOpen(true);
  };
  const handleEdit = (s: SlideshowItem) => {
    setEditing(s);
    setModalOpen(true);
  };

  const handleDelete = async (s: SlideshowItem) => {
    if (!confirm("Eliminar este slide?")) return;
    try {
      await deleteSlide.mutateAsync(s.id);
      toast.success("Slide eliminado");
    } catch {
      toast.error("Error al eliminar slide");
    }
  };

  const handleSave = async (d: SlideForm & { id?: string }) => {
    try {
      if (d.id) {
        await updateSlide.mutateAsync({ id: d.id, ...d });
        toast.success("Slide actualizado");
      } else {
        await createSlide.mutateAsync(d);
        toast.success("Slide creado");
      }
      setModalOpen(false);
    } catch {
      toast.error("Error al guardar slide");
    }
  };

  if (isLoading) return <PageSkeleton />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-[#8A8580]">
          {items.length} slide{items.length !== 1 ? "s" : ""}
        </p>
        <button
          onClick={handleAdd}
          className="flex items-center gap-2 rounded-[10px] bg-[#E87B5A] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#D56E4F] transition-colors"
        >
          <Plus className="h-4 w-4" /> Nuevo Slide
        </button>
      </div>

      {items.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <Image className="mx-auto h-10 w-10 text-[#8A8580] mb-3" />
          <p className="text-sm text-[#8A8580]">No hay slides creados</p>
          <p className="text-xs text-[#8A8580] mt-1">
            Crea tu primer slide para el carrusel
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((s) => (
            <div
              key={s.id}
              className="glass-card overflow-hidden"
            >
              <div className="relative h-40 bg-[#FAF9F7]">
                <img
                  src={s.imageUrl}
                  alt={s.caption ?? "Slide"}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
                <div className="absolute top-2 left-2 flex items-center gap-1">
                  <span className="rounded-[6px] bg-black/60 px-2 py-0.5 text-xs text-white">
                    <GripVertical className="inline h-3 w-3 mr-0.5" />
                    {s.sortOrder}
                  </span>
                  <span
                    className={`rounded-[6px] px-2 py-0.5 text-xs font-medium ${
                      s.isActive
                        ? "bg-emerald-500/90 text-white"
                        : "bg-gray-500/80 text-white"
                    }`}
                  >
                    {s.isActive ? "Activo" : "Inactivo"}
                  </span>
                </div>
              </div>
              <div className="p-4 space-y-2">
                <p className="text-sm font-medium text-[#2D2A26] truncate">
                  {s.caption || "Sin texto"}
                </p>
                {s.linkUrl && (
                  <p className="text-xs text-[#8A8580] truncate">{s.linkUrl}</p>
                )}
                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    onClick={() => handleEdit(s)}
                    className="rounded-[10px] p-1.5 text-[#8A8580] hover:bg-[#FAF9F7] hover:text-[#E87B5A] transition-colors"
                    title="Editar"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(s)}
                    className="rounded-[10px] p-1.5 text-[#8A8580] hover:bg-red-50 hover:text-[#C75D4A] transition-colors"
                    title="Eliminar"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <SlideModal
        key={editing?.id ?? "new"}
        slide={editing}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
      />
    </div>
  );
}
