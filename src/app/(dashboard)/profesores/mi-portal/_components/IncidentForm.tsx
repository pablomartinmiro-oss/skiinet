"use client";

import { useState } from "react";
import { X, AlertTriangle } from "lucide-react";
import { useCreateIncident } from "@/hooks/usePlanning";
import { toast } from "sonner";

const INCIDENT_TYPES = [
  { value: "level_mismatch", label: "Alumno no encaja por nivel" },
  { value: "age_mismatch", label: "Alumno no encaja por edad" },
  { value: "danger", label: "Peligro en pista" },
  { value: "medical", label: "Incidencia medica" },
  { value: "general", label: "Incidencia general" },
];

interface Props {
  groupCellId: string;
  onClose: () => void;
}

export default function IncidentForm({ groupCellId, onClose }: Props) {
  const [type, setType] = useState("general");
  const [severity, setSeverity] = useState("normal");
  const [description, setDescription] = useState("");
  const createMutation = useCreateIncident();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) { toast.error("Describe la incidencia"); return; }
    try {
      await createMutation.mutateAsync({ groupCellId, type, severity, description });
      toast.success("Incidencia reportada al administrador");
      onClose();
    } catch { toast.error("Error al reportar"); }
  };

  const inputClass = "w-full rounded-[10px] border border-[#E8E4DE] bg-white px-3 py-2.5 text-sm text-[#2D2A26] focus:border-[#E87B5A] focus:outline-none";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-[#E8E4DE] p-5">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-[#D4A853]" />
            <h2 className="text-lg font-semibold text-[#2D2A26]">Reportar incidencia</h2>
          </div>
          <button onClick={onClose} className="text-[#8A8580] hover:text-[#2D2A26]">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-5">
          <div>
            <label className="block text-sm font-medium text-[#2D2A26] mb-1">Tipo</label>
            <select value={type} onChange={(e) => setType(e.target.value)} className={inputClass}>
              {INCIDENT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#2D2A26] mb-1">Severidad</label>
            <div className="flex gap-2">
              <button type="button" onClick={() => setSeverity("normal")}
                className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${severity === "normal" ? "border-[#D4A853] bg-[#D4A853]/10 text-[#D4A853]" : "border-[#E8E4DE] text-[#8A8580]"}`}>
                Normal
              </button>
              <button type="button" onClick={() => setSeverity("urgent")}
                className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${severity === "urgent" ? "border-[#C75D4A] bg-[#C75D4A]/10 text-[#C75D4A]" : "border-[#E8E4DE] text-[#8A8580]"}`}>
                Urgente
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#2D2A26] mb-1">Descripción *</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)}
              rows={3} className={inputClass} placeholder="Describe la incidencia..." />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="rounded-[10px] border border-[#E8E4DE] px-4 py-2.5 text-sm text-[#8A8580] hover:bg-[#FAF9F7]">
              Cancelar
            </button>
            <button type="submit" disabled={createMutation.isPending}
              className="rounded-[10px] bg-[#D4A853] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#c49a48] disabled:opacity-50">
              {createMutation.isPending ? "Enviando..." : "Reportar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
