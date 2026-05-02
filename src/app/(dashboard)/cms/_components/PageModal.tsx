"use client";

import { useState } from "react";
import { X } from "lucide-react";
import type { StaticPage } from "@/hooks/useCms";

const inputCls =
  "w-full rounded-[10px] border border-[#E8E4DE] px-3 py-2 text-sm text-[#2D2A26] placeholder:text-[#8A8580] focus:border-[#E87B5A] focus:outline-none focus:ring-1 focus:ring-[#E87B5A]";

export interface PageForm {
  title: string;
  slug: string;
  content: string;
  metaDescription: string;
  isPublished: boolean;
}

export default function PageModal({
  page,
  isOpen,
  onClose,
  onSave,
}: {
  page: StaticPage | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (d: PageForm & { id?: string }) => void;
}) {
  const [form, setForm] = useState<PageForm>(() =>
    page
      ? {
          title: page.title,
          slug: page.slug,
          content: page.content,
          metaDescription: page.metaDescription ?? "",
          isPublished: page.isPublished,
        }
      : {
          title: "",
          slug: "",
          content: "",
          metaDescription: "",
          isPublished: false,
        }
  );

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ ...(page && { id: page.id }), ...form });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-[#E8E4DE] px-6 py-4">
          <h2 className="text-lg font-semibold text-[#2D2A26]">
            {page ? "Editar Pagina" : "Nueva Pagina"}
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
              Titulo
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
              className={inputCls}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#2D2A26] mb-1">
              Slug (auto-generado si vacio)
            </label>
            <input
              type="text"
              value={form.slug}
              onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value }))}
              className={inputCls}
              placeholder="mi-pagina"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#2D2A26] mb-1">
              Contenido
            </label>
            <textarea
              value={form.content}
              onChange={(e) => setForm((p) => ({ ...p, content: e.target.value }))}
              className={inputCls + " min-h-[160px] resize-y"}
              placeholder="Escribe el contenido de la pagina..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#2D2A26] mb-1">
              Meta descripcion (SEO)
            </label>
            <input
              type="text"
              value={form.metaDescription}
              onChange={(e) =>
                setForm((p) => ({ ...p, metaDescription: e.target.value }))
              }
              className={inputCls}
              placeholder="Descripción para buscadores"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="page-published"
              checked={form.isPublished}
              onChange={(e) =>
                setForm((p) => ({ ...p, isPublished: e.target.checked }))
              }
              className="h-4 w-4 rounded border-[#E8E4DE] text-[#E87B5A] focus:ring-[#E87B5A]"
            />
            <label htmlFor="page-published" className="text-sm font-medium text-[#2D2A26]">
              Publicada
            </label>
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
              {page ? "Guardar Cambios" : "Crear Pagina"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
