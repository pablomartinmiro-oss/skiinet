"use client";

import { useState } from "react";
import { X, User, Phone, Trash2, Plus, UserPlus } from "lucide-react";
import type { Instructor } from "@/hooks/useInstructors";
import { useGroupCell, useUpdateGroupCell, useDeleteGroupCell, useAddWalkInParticipant } from "@/hooks/usePlanning";
import { toast } from "sonner";

const LEVEL_COLORS: Record<string, string> = {
  A: "bg-[#5B8C6D]/15 text-[#5B8C6D]", B: "bg-[#D4A853]/15 text-[#D4A853]",
  C: "bg-[#E87B5A]/15 text-[#E87B5A]", D: "bg-[#C75D4A]/15 text-[#C75D4A]",
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  draft: { label: "Borrador", color: "bg-[#8A8580]/15 text-[#8A8580]" },
  confirmed: { label: "Confirmado", color: "bg-[#5B8C6D]/15 text-[#5B8C6D]" },
  in_progress: { label: "En curso", color: "bg-[#E87B5A]/15 text-[#E87B5A]" },
  completed: { label: "Completado", color: "bg-[#5B8C6D]/15 text-[#5B8C6D]" },
  cancelled: { label: "Cancelado", color: "bg-[#C75D4A]/15 text-[#C75D4A]" },
};

interface Props {
  groupId: string;
  onClose: () => void;
  instructors: Instructor[];
}

export default function GroupDetailDrawer({ groupId, onClose, instructors }: Props) {
  const { data } = useGroupCell(groupId);
  const updateMutation = useUpdateGroupCell();
  const deleteMutation = useDeleteGroupCell();
  const group = data?.group;

  const [showAddParticipant, setShowAddParticipant] = useState(false);

  if (!group) return null;

  const statusInfo = STATUS_LABELS[group.status] ?? STATUS_LABELS.draft;
  const participants = group.units ?? [];
  const isFull = participants.length >= group.maxParticipants;

  const handleInstructorChange = async (instructorId: string) => {
    try {
      await updateMutation.mutateAsync({ id: groupId, instructorId: instructorId || null });
      toast.success("Profesor actualizado");
    } catch { toast.error("Error"); }
  };

  const handleStatusChange = async (status: string) => {
    try {
      await updateMutation.mutateAsync({ id: groupId, status });
      toast.success("Estado actualizado");
    } catch { toast.error("Error"); }
  };

  const handleDissolve = async () => {
    if (!confirm("Disolver este grupo? Los participantes volveran a pendientes.")) return;
    try {
      await deleteMutation.mutateAsync(groupId);
      toast.success("Grupo disuelto");
      onClose();
    } catch { toast.error("Error"); }
  };

  const selectClass = "w-full rounded-lg border border-[#E8E4DE] bg-white px-3 py-2 text-sm text-[#2D2A26] focus:border-[#E87B5A] focus:outline-none";

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white shadow-2xl overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#E8E4DE] bg-white px-5 py-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-[#2D2A26] capitalize">{group.discipline} {group.level}</h2>
              <span className={`rounded-lg px-2 py-0.5 text-[10px] font-medium ${statusInfo.color}`}>{statusInfo.label}</span>
            </div>
            <p className="text-xs text-[#8A8580]">{group.timeSlotStart} – {group.timeSlotEnd} · {group.station}</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-[#8A8580] hover:bg-[#FAF9F7]">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Instructor selector */}
          <div>
            <label className="block text-xs font-semibold text-[#8A8580] uppercase tracking-wide mb-1.5">Profesor asignado</label>
            <select value={group.instructorId ?? ""} onChange={(e) => handleInstructorChange(e.target.value)} className={selectClass}>
              <option value="">Sin asignar</option>
              {instructors.map((i) => (
                <option key={i.id} value={i.id}>{i.user.name} ({i.tdLevel})</option>
              ))}
            </select>
          </div>

          {/* Status selector */}
          <div>
            <label className="block text-xs font-semibold text-[#8A8580] uppercase tracking-wide mb-1.5">Estado</label>
            <div className="flex gap-1.5 flex-wrap">
              {Object.entries(STATUS_LABELS).map(([key, info]) => (
                <button key={key} onClick={() => handleStatusChange(key)}
                  className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-all ${group.status === key ? info.color + " ring-1 ring-current" : "bg-[#FAF9F7] text-[#8A8580] hover:bg-[#E8E4DE]"}`}>
                  {info.label}
                </button>
              ))}
            </div>
          </div>

          {/* Group info */}
          <div className="grid grid-cols-3 gap-3">
            <InfoBox label="Disciplina" value={group.discipline} />
            <InfoBox label="Nivel" value={`Nivel ${group.level}`} />
            <InfoBox label="Capacidad" value={`${participants.length}/${group.maxParticipants}`} />
          </div>
          {group.ageBracket && (
            <div className="grid grid-cols-3 gap-3">
              <InfoBox label="Edad" value={group.ageBracket} />
              <InfoBox label="Idioma" value={group.language.toUpperCase()} />
              <InfoBox label="Punto encuentro" value={group.meetingPoint?.name ?? "—"} />
            </div>
          )}

          {/* Participants */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-[#8A8580] uppercase tracking-wide">
                Participantes ({participants.length})
              </label>
              {!isFull && (
                <button onClick={() => setShowAddParticipant(true)}
                  className="flex items-center gap-1 rounded-lg bg-[#E87B5A]/10 px-2 py-1 text-[10px] font-medium text-[#E87B5A] hover:bg-[#E87B5A]/20 transition-colors">
                  <UserPlus className="h-3 w-3" />
                  Añadir alumno
                </button>
              )}
            </div>

            {participants.length === 0 ? (
              <div className="text-center py-6">
                <User className="mx-auto h-8 w-8 text-[#E8E4DE] mb-2" />
                <p className="text-xs text-[#8A8580] mb-2">Sin participantes en este grupo</p>
                <button onClick={() => setShowAddParticipant(true)}
                  className="rounded-lg bg-[#E87B5A] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#D56E4F]">
                  <Plus className="inline h-3 w-3 mr-1" />Añadir primer alumno
                </button>
              </div>
            ) : (
              <div className="space-y-1.5">
                {participants.map((u) => (
                  <div key={u.id} className="flex items-center justify-between rounded-xl border border-[#E8E4DE] px-3 py-2.5 hover:bg-[#FAF9F7] transition-colors">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#E87B5A]/10 text-xs font-bold text-[#E87B5A]">
                        {u.participant.firstName[0]}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-[#2D2A26]">
                          {u.participant.firstName} {u.participant.lastName ?? ""}
                        </p>
                        <div className="flex gap-1 mt-0.5">
                          <span className={`rounded px-1 py-0.5 text-[10px] font-bold ${LEVEL_COLORS[u.participant.level] ?? ""}`}>
                            {u.participant.level}
                          </span>
                          <span className="text-[10px] text-[#8A8580] capitalize">{u.participant.discipline}</span>
                          {u.participant.age && <span className="text-[10px] text-[#8A8580]">{u.participant.age} anos</span>}
                          <span className="text-[10px] text-[#8A8580] uppercase">{u.participant.language}</span>
                        </div>
                      </div>
                    </div>
                    {/* Contact: reservation titular phone or walk-in phone */}
                    {(u.reservation?.clientPhone || u.participant.phone) && (
                      <a href={`https://wa.me/${(u.reservation?.clientPhone ?? u.participant.phone ?? "").replace(/\D/g, "")}`}
                        target="_blank" rel="noopener noreferrer"
                        className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#5B8C6D]/10 text-[#5B8C6D] hover:bg-[#5B8C6D]/20">
                        <Phone className="h-3.5 w-3.5" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Incidents */}
          {group.incidents && group.incidents.length > 0 && (
            <div>
              <label className="block text-xs font-semibold text-[#C75D4A] uppercase tracking-wide mb-2">
                Incidencias ({group.incidents.length})
              </label>
              <div className="space-y-1.5">
                {group.incidents.map((inc) => (
                  <div key={inc.id} className="rounded-lg border border-[#C75D4A]/20 bg-[#C75D4A]/5 px-3 py-2 text-xs">
                    <span className="font-medium text-[#C75D4A]">{inc.type.replace(/_/g, " ")}</span>
                    {inc.severity === "urgent" && <span className="ml-1 text-[#C75D4A] font-bold">URGENTE</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Dissolve */}
          <button onClick={handleDissolve} disabled={deleteMutation.isPending}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#C75D4A]/30 py-2.5 text-xs font-medium text-[#C75D4A] hover:bg-[#C75D4A]/10 transition-colors">
            <Trash2 className="h-3.5 w-3.5" />
            Disolver grupo
          </button>
        </div>

        {/* Add participant inline form */}
        {showAddParticipant && (
          <AddParticipantForm
            groupId={groupId}
            discipline={group.discipline}
            level={group.level}
            language={group.language}
            onClose={() => setShowAddParticipant(false)}
          />
        )}
      </div>
    </div>
  );
}

function InfoBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-[#FAF9F7] border border-[#E8E4DE] p-2.5">
      <p className="text-[10px] text-[#8A8580]">{label}</p>
      <p className="text-sm font-medium text-[#2D2A26] capitalize">{value}</p>
    </div>
  );
}

function AddParticipantForm({ groupId, discipline, level, language, onClose }: {
  groupId: string; discipline: string; level: string; language: string; onClose: () => void;
}) {
  const addMutation = useAddWalkInParticipant();
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    age: "",
    phone: "",
    discipline,
    level,
    language,
  });

  const set = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }));
  const inputClass = "w-full rounded-lg border border-[#E8E4DE] bg-white px-3 py-2 text-sm text-[#2D2A26] focus:border-[#E87B5A] focus:outline-none";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.firstName.trim()) { toast.error("El nombre es obligatorio"); return; }
    try {
      await addMutation.mutateAsync({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim() || null,
        age: form.age ? Number(form.age) : null,
        phone: form.phone.trim() || null,
        discipline: form.discipline,
        level: form.level,
        language: form.language,
        groupCellId: groupId,
      });
      toast.success("Alumno anadido al grupo");
      onClose();
    } catch {
      toast.error("Error al anadir alumno");
    }
  };

  return (
    <div className="border-t-2 border-[#E87B5A] bg-[#FAF9F7] p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-[#2D2A26]">Añadir alumno (walk-in)</h3>
        <button onClick={onClose} className="text-xs text-[#8A8580] hover:text-[#2D2A26]">Cancelar</button>
      </div>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex gap-2">
          <input value={form.firstName} onChange={(e) => set("firstName", e.target.value)}
            placeholder="Nombre *" className={inputClass} autoFocus />
          <input value={form.lastName} onChange={(e) => set("lastName", e.target.value)}
            placeholder="Apellido" className={inputClass} />
        </div>
        <div className="flex gap-2">
          <input type="number" value={form.age} onChange={(e) => set("age", e.target.value)}
            placeholder="Edad" min={3} max={99} className={`w-20 ${inputClass}`} />
          <input value={form.phone} onChange={(e) => set("phone", e.target.value)}
            placeholder="Teléfono contacto" className={inputClass} />
        </div>
        <div className="flex gap-2">
          <select value={form.discipline} onChange={(e) => set("discipline", e.target.value)} className={inputClass}>
            <option value="esqui">Esqui</option>
            <option value="snow">Snow</option>
            <option value="telemark">Telemark</option>
            <option value="freestyle">Freestyle</option>
          </select>
          <select value={form.level} onChange={(e) => set("level", e.target.value)} className={inputClass}>
            <option value="A">Nivel A</option>
            <option value="B">Nivel B</option>
            <option value="C">Nivel C</option>
            <option value="D">Nivel D</option>
          </select>
          <select value={form.language} onChange={(e) => set("language", e.target.value)} className={inputClass}>
            <option value="es">ES</option>
            <option value="en">EN</option>
            <option value="fr">FR</option>
          </select>
        </div>
        <button type="submit" disabled={addMutation.isPending}
          className="w-full rounded-lg bg-[#E87B5A] py-2 text-sm font-medium text-white hover:bg-[#D56E4F] disabled:opacity-50">
          {addMutation.isPending ? "Añadiendo..." : "Añadir al grupo"}
        </button>
      </form>
    </div>
  );
}
