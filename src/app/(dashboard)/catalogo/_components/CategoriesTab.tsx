"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, X, FolderTree } from "lucide-react";
import { toast } from "sonner";
import {
  useCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
} from "@/hooks/useCatalog";
import type { Category } from "@/hooks/useCatalog";
import { PageSkeleton } from "@/components/shared/LoadingSkeleton";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

interface CategoryFormData {
  name: string;
  slug: string;
  parentId: string | null;
  sortOrder: number;
  image: string | null;
}

function getInitialForm(category: Category | null): CategoryFormData {
  if (category) {
    return {
      name: category.name,
      slug: category.slug,
      parentId: category.parentId,
      sortOrder: category.sortOrder,
      image: category.image,
    };
  }
  return {
    name: "",
    slug: "",
    parentId: null,
    sortOrder: 0,
    image: null,
  };
}

interface CategoryModalProps {
  category: Category | null;
  categories: Category[];
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CategoryFormData & { id?: string }) => void;
}

function CategoryModal({
  category,
  categories,
  isOpen,
  onClose,
  onSave,
}: CategoryModalProps) {
  const [form, setForm] = useState(getInitialForm(category));

  if (!isOpen) return null;

  const handleNameChange = (name: string) => {
    setForm((prev) => ({
      ...prev,
      name,
      slug: category ? prev.slug : slugify(name),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...(category && { id: category.id }),
      ...form,
    });
  };

  const parentOptions = categories.filter(
    (c) => c.id !== category?.id && !c.parentId
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-[#E8E4DE] px-6 py-4">
          <h2 className="text-lg font-semibold text-[#2D2A26]">
            {category ? "Editar Categoría" : "Nueva Categoría"}
          </h2>
          <button
            onClick={onClose}
            className="rounded-[10px] p-1.5 text-[#8A8580] hover:bg-[#FAF9F7] transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          <div>
            <label className="block text-sm font-medium text-[#2D2A26] mb-1">
              Nombre
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => handleNameChange(e.target.value)}
              className="w-full rounded-[10px] border border-[#E8E4DE] px-3 py-2 text-sm text-[#2D2A26] placeholder:text-[#8A8580] focus:border-[#E87B5A] focus:outline-none focus:ring-1 focus:ring-[#E87B5A]"
              placeholder="Ej: Alquiler Material"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#2D2A26] mb-1">
              Slug
            </label>
            <input
              type="text"
              value={form.slug}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, slug: e.target.value }))
              }
              className="w-full rounded-[10px] border border-[#E8E4DE] px-3 py-2 text-sm text-[#2D2A26] placeholder:text-[#8A8580] focus:border-[#E87B5A] focus:outline-none focus:ring-1 focus:ring-[#E87B5A]"
              placeholder="alquiler-material"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#2D2A26] mb-1">
                Categoría padre
              </label>
              <select
                value={form.parentId || ""}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    parentId: e.target.value || null,
                  }))
                }
                className="w-full rounded-[10px] border border-[#E8E4DE] px-3 py-2 text-sm text-[#2D2A26] focus:border-[#E87B5A] focus:outline-none focus:ring-1 focus:ring-[#E87B5A]"
              >
                <option value="">Ninguna (raíz)</option>
                {parentOptions.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#2D2A26] mb-1">
                Orden
              </label>
              <input
                type="number"
                min="0"
                value={form.sortOrder}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    sortOrder: parseInt(e.target.value) || 0,
                  }))
                }
                className="w-full rounded-[10px] border border-[#E8E4DE] px-3 py-2 text-sm text-[#2D2A26] focus:border-[#E87B5A] focus:outline-none focus:ring-1 focus:ring-[#E87B5A]"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-[10px] border border-[#E8E4DE] px-4 py-2 text-sm font-medium text-[#8A8580] hover:bg-[#FAF9F7] transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="rounded-[10px] bg-[#E87B5A] px-4 py-2 text-sm font-medium text-white hover:bg-[#D56E4F] transition-colors"
            >
              {category ? "Guardar Cambios" : "Crear Categoría"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function CategoriesTab() {
  const { data, isLoading } = useCategories();
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);

  if (isLoading) return <PageSkeleton />;

  const categories = data?.categories || [];

  const handleAdd = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const handleEdit = (category: Category) => {
    setEditing(category);
    setModalOpen(true);
  };

  const handleDelete = async (category: Category) => {
    if (!confirm(`¿Eliminar la categoría "${category.name}"?`)) return;
    try {
      await deleteCategory.mutateAsync(category.id);
      toast.success("Categoría eliminada");
    } catch {
      toast.error("Error al eliminar categoría");
    }
  };

  const handleSave = async (
    data: CategoryFormData & { id?: string }
  ) => {
    try {
      if (data.id) {
        await updateCategory.mutateAsync({
          id: data.id,
          name: data.name,
          slug: data.slug,
          parentId: data.parentId,
          sortOrder: data.sortOrder,
          image: data.image,
        });
        toast.success("Categoría actualizada");
      } else {
        await createCategory.mutateAsync({
          name: data.name,
          slug: data.slug,
          parentId: data.parentId,
          sortOrder: data.sortOrder,
          image: data.image,
        });
        toast.success("Categoría creada");
      }
      setModalOpen(false);
    } catch {
      toast.error("Error al guardar categoría");
    }
  };

  const parentName = (parentId: string | null) => {
    if (!parentId) return "—";
    const parent = categories.find((c) => c.id === parentId);
    return parent?.name || "—";
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-[#8A8580]">
          {categories.length} categoría{categories.length !== 1 ? "s" : ""} en
          el catálogo
        </p>
        <button
          onClick={handleAdd}
          className="flex items-center gap-2 rounded-[10px] bg-[#E87B5A] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#D56E4F] transition-colors"
        >
          <Plus className="h-4 w-4" />
          Añadir Categoría
        </button>
      </div>

      {/* Table */}
      {categories.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <FolderTree className="mx-auto h-10 w-10 text-[#8A8580] mb-3" />
          <p className="text-sm text-[#8A8580]">
            No hay categorías creadas
          </p>
          <p className="text-xs text-[#8A8580] mt-1">
            Crea tu primera categoría para organizar el catálogo
          </p>
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#E8E4DE] bg-[#FAF9F7]/50">
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#8A8580] uppercase tracking-wider">
                    Nombre
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#8A8580] uppercase tracking-wider">
                    Slug
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-[#8A8580] uppercase tracking-wider">
                    Orden
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#8A8580] uppercase tracking-wider">
                    Categoría padre
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-[#8A8580] uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E4DE]">
                {categories.map((category) => (
                  <tr
                    key={category.id}
                    className="hover:bg-[#FAF9F7]/30 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <FolderTree className="h-4 w-4 text-[#8A8580]" />
                        <span className="font-medium text-sm text-[#2D2A26]">
                          {category.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="rounded-[6px] bg-[#FAF9F7] px-2 py-0.5 text-xs font-mono text-[#8A8580]">
                        {category.slug}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center text-sm text-[#8A8580]">
                      {category.sortOrder}
                    </td>
                    <td className="px-6 py-4 text-sm text-[#8A8580]">
                      {parentName(category.parentId)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEdit(category)}
                          className="rounded-[10px] p-1.5 text-[#8A8580] hover:bg-[#FAF9F7] hover:text-[#E87B5A] transition-colors"
                          title="Editar"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(category)}
                          className="rounded-[10px] p-1.5 text-[#8A8580] hover:bg-red-50 hover:text-[#C75D4A] transition-colors"
                          title="Eliminar"
                        >
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

      {/* Modal */}
      <CategoryModal
        key={editing?.id ?? "new"}
        category={editing}
        categories={categories}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
      />
    </div>
  );
}
