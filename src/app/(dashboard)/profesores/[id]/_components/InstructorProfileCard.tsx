"use client";

import { useState } from "react";
import Link from "next/link";
import { GraduationCap, Pencil, Check, X, MessageSquare } from "lucide-react";
import type { Instructor } from "@/hooks/useInstructors";
import { useUpdateInstructor } from "@/hooks/useInstructors";
import { toast } from "sonner";

const TD_COLORS: Record<string, string> = {
  TD1: "bg-[#D4A853]/15 text-[#D4A853]",
  TD2: "bg-[#5B8C6D]/15 text-[#5B8C6D]",
  TD3: "bg-[#E87B5A]/15 text-[#E87B5A]",
};

const LANG_LABELS: Record<string, string> = {
  es: "Espanol", en: "Ingles", fr: "Frances", de: "Aleman", pt: "Portugues",
};

const CONTRACT_LABELS: Record<string, string> = {
  fijo_discontinuo: "Fijo discontinuo",
  temporal: "Temporal",
  autonomo: "Autonomo",
};

interface Props {
  instructor: Instructor;
}

export default function InstructorProfileCard({ instructor }: Props) {
  const [editing, setEditing] = useState(false);
  const [hourlyRate, setHourlyRate] = useState(String(instructor.hourlyRate));
  const [bonus, setBonus] = useState(String(instructor.perStudentBonus));
  const updateMutation = useUpdateInstructor();

  const handleSave = async () => {
    try {
      await updateMutation.mutateAsync({
        id: instructor.id,
        hourlyRate: parseFloat(hourlyRate) || 0,
        perStudentBonus: parseFloat(bonus) || 0,
      });
      toast.success("Tarifas actualizadas");
      setEditing(false);
    } catch {
      toast.error("Error al actualizar");
    }
  };

  const inputClass =
    "w-20 rounded-lg border border-[#E8E4DE] px-2 py-1 text-sm text-[#2D2A26] focus:border-[#E87B5A] focus:outline-none";

  return (
    <div className="rounded-2xl border border-[#E8E4DE] bg-white p-6">
      <div className="flex items-start gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#E87B5A]/10">
          <GraduationCap className="h-7 w-7 text-[#E87B5A]" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-[#2D2A26]">
              {instructor.user.name ?? instructor.user.email}
            </h2>
            <span className={`rounded-lg px-2.5 py-1 text-xs font-bold ${TD_COLORS[instructor.tdLevel] ?? ""}`}>
              {instructor.tdLevel}
            </span>
            <span className={`rounded-lg px-2.5 py-1 text-xs font-medium ${instructor.isActive ? "bg-[#5B8C6D]/15 text-[#5B8C6D]" : "bg-[#8A8580]/15 text-[#8A8580]"}`}>
              {instructor.isActive ? "Activo" : "Inactivo"}
            </span>
          </div>
          <p className="mt-1 text-sm text-[#8A8580]">{instructor.user.email}</p>
        </div>
        <Link
          href={`/profesores/mensajes?to=${instructor.user.id}`}
          className="flex items-center gap-1.5 rounded-xl border border-[#E87B5A] bg-white px-3 py-2 text-sm font-medium text-[#E87B5A] hover:bg-[#E87B5A]/5 transition-colors"
        >
          <MessageSquare className="h-4 w-4" />
          <span className="hidden sm:inline">Enviar mensaje</span>
        </Link>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <InfoBlock label="Estacion" value={instructor.station.replace(/_/g, " ")} />
        <InfoBlock label="Contrato" value={CONTRACT_LABELS[instructor.contractType] ?? instructor.contractType} />
        <InfoBlock label="Titulacion" value={instructor.certNumber ?? "—"} />
        <InfoBlock
          label="Caducidad cert."
          value={instructor.certExpiry ? new Date(instructor.certExpiry).toLocaleDateString("es-ES") : "—"}
        />
      </div>

      {/* Disciplines & Languages */}
      <div className="mt-4 grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs font-medium text-[#8A8580] mb-1.5">Disciplinas</p>
          <div className="flex flex-wrap gap-1.5">
            {instructor.disciplines.map((d) => (
              <span key={d} className="rounded-lg bg-[#FAF9F7] border border-[#E8E4DE] px-2 py-0.5 text-xs capitalize text-[#2D2A26]">
                {d}
              </span>
            ))}
          </div>
        </div>
        <div>
          <p className="text-xs font-medium text-[#8A8580] mb-1.5">Idiomas</p>
          <div className="flex flex-wrap gap-1.5">
            {instructor.languages.map((l) => (
              <span key={l} className="rounded-lg bg-[#FAF9F7] border border-[#E8E4DE] px-2 py-0.5 text-xs text-[#2D2A26]">
                {LANG_LABELS[l] ?? l}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Rates (editable inline) */}
      <div className="mt-4 flex items-center gap-6 rounded-xl bg-[#FAF9F7] border border-[#E8E4DE] px-4 py-3">
        {editing ? (
          <>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-[#8A8580]">EUR/hora:</span>
              <input type="number" step="0.01" min="0" value={hourlyRate} onChange={(e) => setHourlyRate(e.target.value)} className={inputClass} />
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-[#8A8580]">Bonus/alumno:</span>
              <input type="number" step="0.01" min="0" value={bonus} onChange={(e) => setBonus(e.target.value)} className={inputClass} />
            </div>
            <button onClick={handleSave} className="text-[#5B8C6D] hover:text-[#4a7359]"><Check className="h-4 w-4" /></button>
            <button onClick={() => setEditing(false)} className="text-[#8A8580] hover:text-[#2D2A26]"><X className="h-4 w-4" /></button>
          </>
        ) : (
          <>
            <div className="text-sm">
              <span className="text-[#8A8580]">EUR/hora: </span>
              <span className="font-semibold text-[#2D2A26]">{instructor.hourlyRate.toLocaleString("es-ES", { style: "currency", currency: "EUR" })}</span>
            </div>
            <div className="text-sm">
              <span className="text-[#8A8580]">Bonus/alumno: </span>
              <span className="font-semibold text-[#2D2A26]">{instructor.perStudentBonus.toLocaleString("es-ES", { style: "currency", currency: "EUR" })}</span>
            </div>
            <button onClick={() => setEditing(true)} className="text-[#8A8580] hover:text-[#E87B5A]"><Pencil className="h-3.5 w-3.5" /></button>
          </>
        )}
      </div>
    </div>
  );
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium text-[#8A8580]">{label}</p>
      <p className="mt-0.5 text-sm font-medium text-[#2D2A26] capitalize">{value}</p>
    </div>
  );
}
