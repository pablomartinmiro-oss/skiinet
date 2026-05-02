"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, Image, ChevronUp, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { useGalleryItems, useCreateGalleryItem, useUpdateGalleryItem, useDeleteGalleryItem, useReorder } from "@/hooks/useCmsExtended";
import type { GalleryItem } from "@/hooks/useCmsExtended";
import { PageSkeleton } from "@/components/shared/LoadingSkeleton";
import GalleryItemModal from "./GalleryItemModal";

const inputCls = "w-full rounded-[10px] border border-[#E8E4DE] px-3 py-2 text-sm text-[#2D2A26] placeholder:text-[#8A8580] focus:border-[#E87B5A] focus:outline-none focus:ring-1 focus:ring-[#E87B5A]";

export default function GalleryManager() {
  const [category, setCategory] = useState<string>("");
  const { data, isLoading } = useGalleryItems(category || undefined);
  const createItem = useCreateGalleryItem();
  const updateItem = useUpdateGalleryItem();
  const deleteItem = useDeleteGalleryItem();
  const reorder = useReorder("/api/cms/gallery", [["cmsGallery"]]);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<GalleryItem | null>(null);

  const items = data?.items ?? [];
  const categories = [...new Set(items.map((i) => i.category).filter(Boolean))] as string[];

  const handleSave = async (d: { imageUrl: string; title: string; category: string; sortOrder: number; isActive: boolean; id?: string }) => {
    try {
      if (d.id) {
        await updateItem.mutateAsync(d as { id: string } & Partial<GalleryItem>);
        toast.success("Item actualizado");
      } else {
        await createItem.mutateAsync(d as Partial<GalleryItem>);
        toast.success("Item creado");
      }
      setModalOpen(false);
    } catch { toast.error("Error al guardar item"); }
  };

  const handleDelete = async (item: GalleryItem) => {
    if (!confirm("Eliminar este item de galería?")) return;
    try {
      await deleteItem.mutateAsync(item.id);
      toast.success("Item eliminado");
    } catch { toast.error("Error al eliminar"); }
  };

  const handleReorder = async (idx: number, direction: "up" | "down") => {
    const newItems = [...items];
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    [newItems[idx], newItems[swapIdx]] = [newItems[swapIdx], newItems[idx]];
    try {
      await reorder.mutateAsync(newItems.map((i) => i.id));
    } catch { toast.error("Error al reordenar"); }
  };

  if (isLoading) return <PageSkeleton />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <select value={category} onChange={(e) => setCategory(e.target.value)} className={inputCls + " w-48"}>
            <option value="">Todas las categorías</option>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <p className="text-sm text-[#8A8580]">{items.length} item{items.length !== 1 ? "s" : ""}</p>
          {items.length > 100 && <p className="text-xs text-[#D4A853]">Muchos items pueden afectar rendimiento</p>}
        </div>
        <button onClick={() => { setEditing(null); setModalOpen(true); }} className="flex items-center gap-2 rounded-[10px] bg-[#E87B5A] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#D56E4F] transition-colors">
          <Plus className="h-4 w-4" /> Nuevo Item
        </button>
      </div>

      {items.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <Image className="mx-auto h-10 w-10 text-[#8A8580] mb-3" />
          <p className="text-sm text-[#8A8580]">No hay items en la galería</p>
          <p className="text-xs text-[#8A8580] mt-1">Añade el primero para empezar</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item, idx) => (
            <div key={item.id} className="glass-card overflow-hidden">
              <div className="relative h-40 bg-[#FAF9F7]">
                <img src={item.imageUrl} alt={item.title ?? "Galería"} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                <div className="absolute top-2 left-2 flex items-center gap-1">
                  <span className={`rounded-[6px] px-2 py-0.5 text-xs font-medium ${item.isActive ? "bg-emerald-500/90 text-white" : "bg-gray-500/80 text-white"}`}>
                    {item.isActive ? "Activo" : "Inactivo"}
                  </span>
                  {item.category && <span className="rounded-[6px] bg-black/60 px-2 py-0.5 text-xs text-white">{item.category}</span>}
                </div>
              </div>
              <div className="p-4 space-y-2">
                <p className="text-sm font-medium text-[#2D2A26] truncate">{item.title || "Sin título"}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <button onClick={() => handleReorder(idx, "up")} disabled={idx === 0} className="rounded-[10px] p-1 text-[#8A8580] hover:bg-[#FAF9F7] disabled:opacity-30 disabled:cursor-not-allowed transition-colors" aria-label="Subir">
                      <ChevronUp className="h-4 w-4" />
                    </button>
                    <button onClick={() => handleReorder(idx, "down")} disabled={idx === items.length - 1} className="rounded-[10px] p-1 text-[#8A8580] hover:bg-[#FAF9F7] disabled:opacity-30 disabled:cursor-not-allowed transition-colors" aria-label="Bajar">
                      <ChevronDown className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => { setEditing(item); setModalOpen(true); }} className="rounded-[10px] p-1.5 text-[#8A8580] hover:bg-[#FAF9F7] hover:text-[#E87B5A] transition-colors" aria-label="Editar">
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button onClick={() => handleDelete(item)} className="rounded-[10px] p-1.5 text-[#8A8580] hover:bg-red-50 hover:text-[#C75D4A] transition-colors" aria-label="Eliminar">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <GalleryItemModal key={editing?.id ?? "new"} item={editing} isOpen={modalOpen} onClose={() => setModalOpen(false)} onSave={handleSave} />
    </div>
  );
}
