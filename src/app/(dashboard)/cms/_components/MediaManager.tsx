"use client";

import { useState } from "react";
import { Plus, Trash2, Upload, Link2 } from "lucide-react";
import { toast } from "sonner";
import { useMediaFiles, useCreateMediaFile, useDeleteMediaFile, useStorageFeature } from "@/hooks/useCmsExtended";
import type { MediaFile } from "@/hooks/useCmsExtended";
import { PageSkeleton } from "@/components/shared/LoadingSkeleton";
import { ComingSoonBadge } from "@/components/shared/ComingSoonBadge";
import { ImagePlaceholder } from "@/components/shared/ImagePlaceholder";
import MediaUrlModal from "./MediaUrlModal";

const inputCls = "w-full rounded-[10px] border border-[#E8E4DE] px-3 py-2 text-sm text-[#2D2A26] placeholder:text-[#8A8580] focus:border-[#E87B5A] focus:outline-none focus:ring-1 focus:ring-[#E87B5A]";

function inferType(url: string): "image" | "video" | "document" {
  const ext = url.split(".").pop()?.toLowerCase() ?? "";
  if (["jpg", "jpeg", "png", "webp", "gif", "svg"].includes(ext)) return "image";
  if (["mp4", "webm", "mov", "avi"].includes(ext)) return "video";
  return "document";
}

export { inferType };

export default function MediaManager() {
  const [typeFilter, setTypeFilter] = useState<string>("");
  const { data, isLoading } = useMediaFiles(typeFilter || undefined);
  const { data: storageData } = useStorageFeature();
  const createFile = useCreateMediaFile();
  const deleteFile = useDeleteMediaFile();
  const [urlModalOpen, setUrlModalOpen] = useState(false);

  const uploadEnabled = storageData?.uploadEnabled ?? false;
  const files = data?.files ?? [];

  const handleUrlSave = async (d: { url: string; filename: string; altText: string }) => {
    const type = inferType(d.url);
    const ext = d.url.split(".").pop()?.toLowerCase() ?? "";
    const mimeMap: Record<string, string> = { jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp", gif: "image/gif", pdf: "application/pdf", mp4: "video/mp4" };
    try {
      await createFile.mutateAsync({
        url: d.url, filename: d.filename || d.url.split("/").pop() || "file",
        originalName: d.filename || d.url.split("/").pop() || "file",
        mimeType: mimeMap[ext] || "application/octet-stream",
        type, altText: d.altText || null, fileKey: null, size: null,
      });
      toast.success("Archivo registrado");
      setUrlModalOpen(false);
    } catch { toast.error("Error al registrar archivo"); }
  };

  const handleDelete = async (file: MediaFile) => {
    if (!confirm("Esta imagen puede estar en uso en otros módulos. ¿Continuar?")) return;
    try {
      await deleteFile.mutateAsync(file.id);
      toast.success("Archivo eliminado");
    } catch { toast.error("Error al eliminar"); }
  };

  if (isLoading) return <PageSkeleton />;

  return (
    <div className="space-y-4">
      {!uploadEnabled && (
        <ComingSoonBadge variant="banner" message="Upload de archivos desde tu ordenador pendiente de configuración. Mientras tanto, añade imágenes pegando una URL." />
      )}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className={inputCls + " w-40"}>
            <option value="">Todos</option>
            <option value="image">Imágenes</option>
            <option value="video">Videos</option>
            <option value="document">Documentos</option>
          </select>
          <p className="text-sm text-[#8A8580]">{files.length} archivo{files.length !== 1 ? "s" : ""}</p>
        </div>
        <div className="flex items-center gap-2">
          <button disabled={!uploadEnabled} className="flex items-center gap-2 rounded-[10px] border border-[#E8E4DE] px-4 py-2.5 text-sm font-medium text-[#8A8580] transition-colors disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#FAF9F7]" title={!uploadEnabled ? "Configurar almacenamiento en Ajustes para activar" : "Subir archivo"}>
            <Upload className="h-4 w-4" /> <span className="hidden sm:inline">Subir</span>
            {!uploadEnabled && <ComingSoonBadge variant="tooltip" message="Configurar almacenamiento en Ajustes para activar" />}
          </button>
          <button onClick={() => setUrlModalOpen(true)} className="flex items-center gap-2 rounded-[10px] bg-[#E87B5A] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#D56E4F] transition-colors">
            <Link2 className="h-4 w-4" /> <span className="hidden sm:inline">Añadir por URL</span>
          </button>
        </div>
      </div>

      {files.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <Upload className="mx-auto h-10 w-10 text-[#8A8580] mb-3" />
          <p className="text-sm text-[#8A8580]">No hay archivos multimedia</p>
          <p className="text-xs text-[#8A8580] mt-1">Añade el primero por URL</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {files.map((f) => (
            <div key={f.id} className="glass-card overflow-hidden">
              <div className="relative h-28 bg-[#FAF9F7] flex items-center justify-center">
                {f.type === "image" ? (
                  <img src={f.url} alt={f.altText ?? f.filename} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).replaceWith(document.createElement("div")); }} />
                ) : (
                  <ImagePlaceholder type={f.type as "video" | "document"} filename={f.filename} size="md" className="w-full h-full" />
                )}
                <span className="absolute top-2 left-2 rounded-[6px] bg-black/60 px-2 py-0.5 text-xs text-white">{f.type}</span>
              </div>
              <div className="p-3 space-y-1">
                <p className="text-sm font-medium text-[#2D2A26] truncate">{f.filename}</p>
                {f.size && <p className="text-xs text-[#8A8580]">{(f.size / 1024).toFixed(0)} KB</p>}
                <div className="flex justify-end">
                  <button onClick={() => handleDelete(f)} className="rounded-[10px] p-1.5 text-[#8A8580] hover:bg-red-50 hover:text-[#C75D4A] transition-colors" aria-label="Eliminar">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <MediaUrlModal isOpen={urlModalOpen} onClose={() => setUrlModalOpen(false)} onSave={handleUrlSave} />
    </div>
  );
}
