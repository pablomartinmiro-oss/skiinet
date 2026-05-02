"use client";

import { useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Menu,
  ChevronRight,
  ArrowUpDown,
} from "lucide-react";
import { toast } from "sonner";
import {
  useCmsMenuItems,
  useCreateCmsMenuItem,
  useUpdateCmsMenuItem,
  useDeleteCmsMenuItem,
} from "@/hooks/useCms";
import type { CmsMenuItem } from "@/hooks/useCms";
import { PageSkeleton } from "@/components/shared/LoadingSkeleton";
import MenuItemModal from "./MenuItemModal";
import type { MenuForm } from "./MenuItemModal";

const inputCls =
  "w-full rounded-[10px] border border-[#E8E4DE] px-3 py-2 text-sm text-[#2D2A26] placeholder:text-[#8A8580] focus:border-[#E87B5A] focus:outline-none focus:ring-1 focus:ring-[#E87B5A]";

function MenuRow({
  item,
  depth,
  onEdit,
  onDelete,
}: {
  item: CmsMenuItem;
  depth: number;
  onEdit: (i: CmsMenuItem) => void;
  onDelete: (i: CmsMenuItem) => void;
}) {
  return (
    <div
      className="flex items-center justify-between px-6 py-3 hover:bg-[#FAF9F7]/30 transition-colors"
      style={{ paddingLeft: `${24 + depth * 24}px` }}
    >
      <div className="flex items-center gap-3 min-w-0">
        {depth > 0 && <ChevronRight className="h-3 w-3 text-[#8A8580]" />}
        <ArrowUpDown className="h-3.5 w-3.5 text-[#8A8580] shrink-0" />
        <span className="text-sm font-medium text-[#2D2A26] truncate">
          {item.label}
        </span>
        <span className="text-xs text-[#8A8580] truncate">{item.url}</span>
        <span
          className={`shrink-0 rounded-[6px] px-2 py-0.5 text-xs font-medium ${
            item.position === "header"
              ? "bg-blue-50 text-blue-700"
              : "bg-purple-50 text-purple-700"
          }`}
        >
          {item.position}
        </span>
        <span
          className={`shrink-0 rounded-[6px] px-2 py-0.5 text-xs font-medium ${
            item.isActive
              ? "bg-emerald-50 text-emerald-700"
              : "bg-gray-100 text-gray-500"
          }`}
        >
          {item.isActive ? "Activo" : "Inactivo"}
        </span>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={() => onEdit(item)}
          className="rounded-[10px] p-1.5 text-[#8A8580] hover:bg-[#FAF9F7] hover:text-[#E87B5A] transition-colors"
          title="Editar"
        >
          <Pencil className="h-4 w-4" />
        </button>
        <button
          onClick={() => onDelete(item)}
          className="rounded-[10px] p-1.5 text-[#8A8580] hover:bg-red-50 hover:text-[#C75D4A] transition-colors"
          title="Eliminar"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export default function MenuTab() {
  const [filterPos, setFilterPos] = useState<string | undefined>(undefined);
  const { data, isLoading } = useCmsMenuItems(filterPos);
  const createItem = useCreateCmsMenuItem();
  const updateItem = useUpdateCmsMenuItem();
  const deleteItem = useDeleteCmsMenuItem();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<CmsMenuItem | null>(null);

  const allItems = data?.items ?? [];
  const rootItems = allItems.filter((i) => !i.parentId);

  const handleAdd = () => {
    setEditing(null);
    setModalOpen(true);
  };
  const handleEdit = (item: CmsMenuItem) => {
    setEditing(item);
    setModalOpen(true);
  };

  const handleDelete = async (item: CmsMenuItem) => {
    if (!confirm(`Eliminar "${item.label}"?`)) return;
    try {
      await deleteItem.mutateAsync(item.id);
      toast.success("Item eliminado");
    } catch {
      toast.error("Error al eliminar item");
    }
  };

  const handleSave = async (d: MenuForm & { id?: string }) => {
    try {
      const payload = { ...d, parentId: d.parentId || null };
      if (d.id) {
        await updateItem.mutateAsync({ id: d.id, ...payload });
        toast.success("Item actualizado");
      } else {
        await createItem.mutateAsync(payload);
        toast.success("Item creado");
      }
      setModalOpen(false);
    } catch {
      toast.error("Error al guardar item");
    }
  };

  if (isLoading) return <PageSkeleton />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <select
            value={filterPos ?? ""}
            onChange={(e) => setFilterPos(e.target.value || undefined)}
            className={inputCls + " w-40"}
          >
            <option value="">Todas</option>
            <option value="header">Header</option>
            <option value="footer">Footer</option>
          </select>
          <p className="text-sm text-[#8A8580]">
            {allItems.length} item{allItems.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={handleAdd}
          className="flex items-center gap-2 rounded-[10px] bg-[#E87B5A] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#D56E4F] transition-colors"
        >
          <Plus className="h-4 w-4" /> Nuevo Item
        </button>
      </div>

      {allItems.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <Menu className="mx-auto h-10 w-10 text-[#8A8580] mb-3" />
          <p className="text-sm text-[#8A8580]">No hay items de menu</p>
          <p className="text-xs text-[#8A8580] mt-1">
            Crea tu primer item de navegacion
          </p>
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          <div className="divide-y divide-[#E8E4DE]">
            {rootItems.map((item) => (
              <div key={item.id}>
                <MenuRow
                  item={item}
                  depth={0}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
                {item.children?.map((child) => (
                  <MenuRow
                    key={child.id}
                    item={child}
                    depth={1}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      <MenuItemModal
        key={editing?.id ?? "new"}
        item={editing}
        allItems={allItems}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
      />
    </div>
  );
}
