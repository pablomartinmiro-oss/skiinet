"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Mail, Eye, X } from "lucide-react";

interface EmailTemplate {
  id: string;
  name: string;
  category: string;
  active: boolean;
}

function fetchTemplates(): Promise<{ templates: EmailTemplate[] }> {
  return fetch("/api/settings/email-templates").then((r) => {
    if (!r.ok) throw new Error(`${r.status}`);
    return r.json();
  });
}

const CATEGORY_COLORS: Record<string, string> = {
  Reservas: "bg-[#5B8C6D]/15 text-[#5B8C6D]",
  Finanzas: "bg-[#D4A853]/15 text-[#D4A853]",
  Proveedores: "bg-[#8A8580]/15 text-[#8A8580]",
  Tienda: "bg-[#E87B5A]/15 text-[#E87B5A]",
  Presupuestos: "bg-blue-100 text-blue-700",
  Cancelaciónes: "bg-[#C75D4A]/15 text-[#C75D4A]",
  Bonos: "bg-purple-100 text-purple-700",
};

export function EmailTemplatesCard() {
  const { data, isLoading } = useQuery({
    queryKey: ["email-templates"],
    queryFn: fetchTemplates,
  });
  const [previewId, setPreviewId] = useState<string | null>(null);

  const grouped = useMemo(() => {
    if (!data?.templates) return [];
    const map = new Map<string, EmailTemplate[]>();
    for (const t of data.templates) {
      const arr = map.get(t.category) ?? [];
      arr.push(t);
      map.set(t.category, arr);
    }
    return Array.from(map.entries()).map(([category, templates]) => ({
      category,
      templates,
    }));
  }, [data]);

  const previewTemplate = data?.templates.find((t) => t.id === previewId);

  const closePreview = useCallback(() => setPreviewId(null), []);

  // Close on Escape + lock body scroll while open
  useEffect(() => {
    if (!previewId) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closePreview();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [previewId, closePreview]);

  if (isLoading) {
    return (
      <div className="glass-card p-5">
        <Skeleton className="h-5 w-48 mb-4" />
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full mb-2" />
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="glass-card p-5">
        <div className="flex items-center gap-2 mb-1">
          <Mail className="h-4 w-4 text-[#E87B5A]" />
          <h3 className="text-base font-semibold text-[#2D2A26]">
            Plantillas de email
          </h3>
        </div>
        <p className="mb-5 text-sm text-[#8A8580]">
          Gestiona las plantillas de correo automatico de la plataforma
        </p>

        <div className="space-y-5">
          {grouped.map(({ category, templates }) => (
            <div key={category}>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#8A8580] mb-2">
                {category}
              </p>
              <div className="space-y-1">
                {templates.map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-[#FAF9F7] transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#2D2A26]">
                        {t.name}
                      </p>
                    </div>

                    <span
                      className={`shrink-0 rounded-md px-2 py-0.5 text-[10px] font-medium ${CATEGORY_COLORS[t.category] ?? "bg-[#E8E4DE] text-[#8A8580]"}`}
                    >
                      {t.category}
                    </span>

                    {/* Active indicator */}
                    <span
                      className={`shrink-0 h-2 w-2 rounded-full ${t.active ? "bg-[#5B8C6D]" : "bg-[#E8E4DE]"}`}
                      title={t.active ? "Activa" : "Inactiva"}
                    />

                    <button
                      onClick={() => setPreviewId(t.id)}
                      className="shrink-0 flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-[#8A8580] hover:text-[#E87B5A] hover:bg-[#E87B5A]/5 transition-colors"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      Vista previa
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Preview modal */}
      {previewTemplate && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Vista previa: ${previewTemplate.name}`}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4"
          onClick={closePreview}
        >
          <div
            className="relative w-full max-w-md rounded-xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h4 className="text-sm font-semibold text-[#2D2A26]">
                  {previewTemplate.name}
                </h4>
                <span
                  className={`mt-1 inline-block rounded-md px-2 py-0.5 text-[10px] font-medium ${CATEGORY_COLORS[previewTemplate.category] ?? "bg-[#E8E4DE] text-[#8A8580]"}`}
                >
                  {previewTemplate.category}
                </span>
              </div>
              <button
                type="button"
                onClick={closePreview}
                aria-label="Cerrar"
                className="rounded-lg p-2 text-[#8A8580] hover:bg-[#FAF9F7] hover:text-[#2D2A26] transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="rounded-xl border border-[#E8E4DE] bg-[#FAF9F7] p-8 text-center">
              <Mail className="mx-auto h-8 w-8 text-[#E8E4DE] mb-3" />
              <p className="text-sm text-[#8A8580]">Vista previa del email</p>
              <p className="mt-1 text-xs text-[#8A8580]/70">
                El editor visual de plantillas estara disponible proximamente
              </p>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={closePreview}
                className="rounded-[10px] border border-[#E8E4DE] px-4 py-2 text-sm font-medium text-[#2D2A26] hover:bg-[#FAF9F7] transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
