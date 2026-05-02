"use client";

import { useState } from "react";
import { Plus, Trash2, Users, GraduationCap } from "lucide-react";
import { useParticipants, useCreateParticipant, useDeleteParticipant } from "@/hooks/usePlanning";
import { toast } from "sonner";

const DISCIPLINES = [
  { value: "esqui", label: "Esqui alpino" },
  { value: "snow", label: "Snowboard" },
  { value: "telemark", label: "Telemark" },
  { value: "freestyle", label: "Freestyle" },
];

const LEVELS = [
  { value: "A", label: "A — Principiante" },
  { value: "B", label: "B — Basico" },
  { value: "C", label: "C — Intermedio" },
  { value: "D", label: "D — Avanzado" },
];

const LANGUAGES = [
  { value: "es", label: "ES" },
  { value: "en", label: "EN" },
  { value: "fr", label: "FR" },
  { value: "de", label: "DE" },
];

const AGE_BRACKETS = [
  { value: "baby", label: "Baby (3-5)" },
  { value: "infantil", label: "Infantil (6-9)" },
  { value: "adolescente", label: "Adolescente (9-13)" },
  { value: "juvenil", label: "Juvenil (13-17)" },
  { value: "adulto", label: "Adulto (18+)" },
];

interface Props {
  reservationId: string;
}

export function StructuredParticipantEditor({ reservationId }: Props) {
  const { data } = useParticipants(reservationId);
  const participants = data?.participants ?? [];
  const createMutation = useCreateParticipant();
  const deleteMutation = useDeleteParticipant();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    firstName: "", lastName: "", age: "", ageBracket: "adulto",
    discipline: "esqui", level: "A", language: "es", specialNeeds: "",
  });

  const handleAdd = async () => {
    if (!form.firstName) { toast.error("Nombre obligatorio"); return; }
    try {
      await createMutation.mutateAsync({
        reservationId, firstName: form.firstName, lastName: form.lastName || null,
        age: form.age ? parseInt(form.age) : null, ageBracket: form.ageBracket,
        discipline: form.discipline, level: form.level, language: form.language,
        specialNeeds: form.specialNeeds || null,
      });
      toast.success("Participante anadido");
      setForm({ firstName: "", lastName: "", age: "", ageBracket: "adulto", discipline: "esqui", level: "A", language: "es", specialNeeds: "" });
      setShowForm(false);
    } catch { toast.error("Error al crear participante"); }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);
      toast.success("Participante eliminado");
    } catch { toast.error("Error"); }
  };

  const inputClass = "rounded-lg border border-[#E8E4DE] bg-white px-2 py-1.5 text-sm text-[#2D2A26] focus:border-[#E87B5A] focus:outline-none";

  return (
    <div className="rounded-2xl border border-[#E8E4DE] bg-white p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <GraduationCap className="h-4 w-4 text-[#E87B5A]" />
          <h3 className="text-sm font-semibold text-[#2D2A26]">
            Participantes ({participants.length})
          </h3>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1 rounded-lg bg-[#E87B5A] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#D56E4F]">
          <Plus className="h-3 w-3" /> Añadir
        </button>
      </div>

      {/* Add form */}
      {showForm && (
        <div className="mb-3 rounded-xl border border-[#E87B5A]/30 bg-[#E87B5A]/5 p-3 space-y-2">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <input placeholder="Nombre *" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} className={inputClass} />
            <input placeholder="Apellido" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} className={inputClass} />
            <input type="number" placeholder="Edad" value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} className={inputClass} />
            <select value={form.ageBracket} onChange={(e) => setForm({ ...form, ageBracket: e.target.value })} className={inputClass}>
              {AGE_BRACKETS.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <select value={form.discipline} onChange={(e) => setForm({ ...form, discipline: e.target.value })} className={inputClass}>
              {DISCIPLINES.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
            </select>
            <select value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })} className={inputClass}>
              {LEVELS.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
            </select>
            <select value={form.language} onChange={(e) => setForm({ ...form, language: e.target.value })} className={inputClass}>
              {LANGUAGES.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
            </select>
            <input placeholder="Necesidades especiales" value={form.specialNeeds} onChange={(e) => setForm({ ...form, specialNeeds: e.target.value })} className={inputClass} />
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowForm(false)} className="rounded-lg border border-[#E8E4DE] px-3 py-1.5 text-xs text-[#8A8580]">Cancelar</button>
            <button onClick={handleAdd} disabled={createMutation.isPending} className="rounded-lg bg-[#E87B5A] px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50">
              {createMutation.isPending ? "..." : "Guardar"}
            </button>
          </div>
        </div>
      )}

      {/* Participant list */}
      {participants.length === 0 ? (
        <p className="text-xs text-[#8A8580] py-2">Sin participantes estructurados. Anade participantes para activar el motor de planning.</p>
      ) : (
        <div className="space-y-1.5">
          {participants.map((p) => (
            <div key={p.id} className="flex items-center justify-between rounded-lg border border-[#E8E4DE] px-3 py-2">
              <div className="flex items-center gap-3">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#E87B5A]/10 text-xs font-bold text-[#E87B5A]">
                  {p.firstName[0]}
                </div>
                <div>
                  <p className="text-sm font-medium text-[#2D2A26]">{p.firstName} {p.lastName ?? ""}</p>
                  <div className="flex gap-1.5 mt-0.5">
                    <span className="rounded bg-blue-500/10 px-1.5 py-0.5 text-[10px] font-medium text-blue-700 capitalize">{p.discipline}</span>
                    <span className="rounded bg-[#D4A853]/15 px-1.5 py-0.5 text-[10px] font-bold text-[#D4A853]">{p.level}</span>
                    {p.ageBracket && <span className="rounded bg-[#FAF9F7] border border-[#E8E4DE] px-1.5 py-0.5 text-[10px] capitalize">{p.ageBracket}</span>}
                    <span className="rounded bg-[#FAF9F7] border border-[#E8E4DE] px-1.5 py-0.5 text-[10px] uppercase">{p.language}</span>
                  </div>
                </div>
              </div>
              <button onClick={() => handleDelete(p.id)} className="text-[#8A8580] hover:text-[#C75D4A]">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
