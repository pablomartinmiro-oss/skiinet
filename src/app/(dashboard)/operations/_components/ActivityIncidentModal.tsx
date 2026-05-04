"use client";

import { AlertTriangle } from "lucide-react";

interface IncidentModalProps {
  onClose: () => void;
  onSubmit: () => void;
  notes: string;
  onNotesChange: (v: string) => void;
  isPending: boolean;
}

export function ActivityIncidentModal({
  onClose,
  onSubmit,
  notes,
  onNotesChange,
  isPending,
}: IncidentModalProps) {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start gap-3 mb-4">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#C75D4A]/15">
            <AlertTriangle className="h-4 w-4 text-[#C75D4A]" />
          </div>
          <div>
            <p className="text-sm font-semibold text-[#2D2A26]">
              Registrar incidencia
            </p>
            <p className="mt-0.5 text-xs text-[#8A8580]">
              Describe el incidente. La actividad se marcara con estado incidencia.
            </p>
          </div>
        </div>

        <textarea
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          placeholder="Describe la incidencia..."
          rows={4}
          className="w-full rounded-[10px] border border-[#E8E4DE] bg-white px-3 py-2.5 text-sm text-[#2D2A26] placeholder:text-[#8A8580]/50 focus:border-[#E87B5A] focus:outline-none focus:ring-1 focus:ring-[#E87B5A] resize-none"
          maxLength={2000}
        />

        <div className="mt-3 flex justify-between items-center">
          <span className="text-[10px] text-[#8A8580]">
            {notes.length}/2000
          </span>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="rounded-[10px] px-3 py-1.5 text-sm font-medium text-[#8A8580] hover:bg-[#FAF9F7] transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={onSubmit}
              disabled={!notes.trim() || isPending}
              className="rounded-[10px] bg-[#C75D4A] px-3 py-1.5 text-sm font-medium text-white hover:bg-[#B54D3A] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPending ? "Guardando..." : "Registrar"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
