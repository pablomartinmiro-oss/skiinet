"use client";

import { HardDrive, Check, X, ExternalLink } from "lucide-react";
import { useStorageFeature } from "@/hooks/useCmsExtended";
import { ComingSoonBadge } from "@/components/shared/ComingSoonBadge";

export function StorageCard() {
  const { data, isLoading } = useStorageFeature();
  const configured = data?.uploadEnabled ?? false;

  if (isLoading) {
    return (
      <div className="glass-card p-6">
        <div className="animate-pulse h-6 w-48 bg-[#FAF9F7] rounded" />
      </div>
    );
  }

  return (
    <div className="glass-card p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FAF9F7]">
            <HardDrive className="h-5 w-5 text-[#8A8580]" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[#2D2A26]">Almacenamiento</h3>
            <p className="text-xs text-[#8A8580]">S3/R2 para subida de archivos</p>
          </div>
        </div>
        {configured ? (
          <span className="inline-flex items-center gap-1 rounded-[6px] bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700">
            <Check className="h-3 w-3" /> Configurado
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-[6px] bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700">
            <X className="h-3 w-3" /> No configurado
          </span>
        )}
      </div>

      {!configured && (
        <div className="space-y-3">
          <ComingSoonBadge variant="banner" message="Configura S3 o Cloudflare R2 para activar la subida de archivos en el Media Manager. Mientras tanto, puedes añadir imágenes por URL." />
          <a href="https://github.com/pablomartinmiro-oss/OpenClaw/blob/main/docs/SETUP-S3.md" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-[#E87B5A] hover:text-[#D56E4F] transition-colors">
            <ExternalLink className="h-3.5 w-3.5" /> Ver guía de configuración
          </a>
        </div>
      )}

      {configured && (
        <p className="text-xs text-[#8A8580]">
          El almacenamiento está activo. Los archivos subidos desde el Media Manager se guardan en el bucket configurado.
        </p>
      )}
    </div>
  );
}
