"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, FileText, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import {
  useCmsPages,
  useCreateCmsPage,
  useUpdateCmsPage,
  useDeleteCmsPage,
} from "@/hooks/useCms";
import type { StaticPage } from "@/hooks/useCms";
import { PageSkeleton } from "@/components/shared/LoadingSkeleton";
import PageModal from "./PageModal";
import type { PageForm } from "./PageModal";

const inputCls =
  "w-full rounded-[10px] border border-[#E8E4DE] px-3 py-2 text-sm text-[#2D2A26] placeholder:text-[#8A8580] focus:border-[#E87B5A] focus:outline-none focus:ring-1 focus:ring-[#E87B5A]";

export default function PagesTab() {
  const [filterPublished, setFilterPublished] = useState<boolean | undefined>(
    undefined
  );
  const { data, isLoading } = useCmsPages(filterPublished);
  const createPage = useCreateCmsPage();
  const updatePage = useUpdateCmsPage();
  const deletePage = useDeleteCmsPage();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<StaticPage | null>(null);

  const pages = data?.pages ?? [];

  const handleAdd = () => {
    setEditing(null);
    setModalOpen(true);
  };
  const handleEdit = (p: StaticPage) => {
    setEditing(p);
    setModalOpen(true);
  };

  const handleDelete = async (p: StaticPage) => {
    if (!confirm(`Eliminar la pagina "${p.title}"?`)) return;
    try {
      await deletePage.mutateAsync(p.id);
      toast.success("Pagina eliminada");
    } catch {
      toast.error("Error al eliminar pagina");
    }
  };

  const handleSave = async (d: PageForm & { id?: string }) => {
    try {
      if (d.id) {
        await updatePage.mutateAsync({ id: d.id, ...d });
        toast.success("Pagina actualizada");
      } else {
        await createPage.mutateAsync(d);
        toast.success("Pagina creada");
      }
      setModalOpen(false);
    } catch {
      toast.error("Error al guardar pagina");
    }
  };

  if (isLoading) return <PageSkeleton />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <select
            value={filterPublished === undefined ? "" : String(filterPublished)}
            onChange={(e) =>
              setFilterPublished(
                e.target.value === "" ? undefined : e.target.value === "true"
              )
            }
            className={inputCls + " w-44"}
          >
            <option value="">Todas</option>
            <option value="true">Publicadas</option>
            <option value="false">Borradores</option>
          </select>
          <p className="text-sm text-[#8A8580]">
            {pages.length} pagina{pages.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={handleAdd}
          className="flex items-center gap-2 rounded-[10px] bg-[#E87B5A] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#D56E4F] transition-colors"
        >
          <Plus className="h-4 w-4" /> Nueva Pagina
        </button>
      </div>

      {pages.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <FileText className="mx-auto h-10 w-10 text-[#8A8580] mb-3" />
          <p className="text-sm text-[#8A8580]">No hay paginas creadas</p>
          <p className="text-xs text-[#8A8580] mt-1">
            Crea tu primera pagina estatica
          </p>
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#E8E4DE] bg-[#FAF9F7]/50">
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#8A8580] uppercase tracking-wider">
                    Titulo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#8A8580] uppercase tracking-wider">
                    Slug
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-[#8A8580] uppercase tracking-wider">
                    Bloques
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-[#8A8580] uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-[#8A8580] uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E4DE]">
                {pages.map((p) => (
                  <tr key={p.id} className="hover:bg-[#FAF9F7]/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-[#8A8580]" />
                        <span className="font-medium text-sm text-[#2D2A26]">{p.title}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-[#8A8580]">/{p.slug}</td>
                    <td className="px-6 py-4 text-center text-sm text-[#8A8580]">
                      {p._count?.blocks ?? 0}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`inline-flex items-center gap-1 rounded-[6px] px-2 py-0.5 text-xs font-medium ${
                          p.isPublished
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-amber-50 text-amber-700"
                        }`}
                      >
                        {p.isPublished ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                        {p.isPublished ? "Publicada" : "Borrador"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEdit(p)}
                          className="rounded-[10px] p-1.5 text-[#8A8580] hover:bg-[#FAF9F7] hover:text-[#E87B5A] transition-colors"
                          title="Editar"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(p)}
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

      <PageModal
        key={editing?.id ?? "new"}
        page={editing}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
      />
    </div>
  );
}
