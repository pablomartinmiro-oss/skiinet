"use client";

import { X, MapPin, Clock, Phone, Users, Award } from "lucide-react";
import type { CalendarActivity } from "@/hooks/useBookingOps";

const STATUS_LABELS: Record<string, string> = {
  scheduled: "Programada",
  pending: "Pendiente",
  confirmed: "Confirmada",
  cancelled: "Cancelada",
  incident: "Incidencia",
};

const STATUS_COLORS: Record<string, string> = {
  scheduled: "bg-[#8A8580]/15 text-[#8A8580]",
  pending: "bg-[#D4A853]/15 text-[#D4A853]",
  confirmed: "bg-[#5B8C6D]/15 text-[#5B8C6D]",
  cancelled: "bg-[#C75D4A]/15 text-[#C75D4A]",
  incident: "bg-red-100 text-red-700",
};

interface Props {
  activity: CalendarActivity;
  onClose: () => void;
}

export default function LessonDetailPopup({ activity, onClose }: Props) {
  const r = activity.reservation;
  const monitors = activity.monitors ?? [];
  const participants = (r as unknown as { participants?: { name?: string; type?: string; level?: string }[] } | undefined)
    ?.participants;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl bg-white shadow-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E8E4DE]">
          <div>
            <h2 className="text-base font-semibold text-[#2D2A26]">
              {r?.clientName ?? "Cliente"}
            </h2>
            <span
              className={`inline-block mt-1 rounded-[6px] px-2 py-0.5 text-xs font-medium ${
                STATUS_COLORS[activity.status] ?? STATUS_COLORS.scheduled
              }`}
            >
              {STATUS_LABELS[activity.status] ?? activity.status}
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-[#8A8580] hover:text-[#2D2A26] transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">
          {/* Meta */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            {r?.station && (
              <Row icon={<MapPin className="h-3.5 w-3.5" />} label="Estacion" value={r.station} />
            )}
            {r?.schedule && (
              <Row icon={<Clock className="h-3.5 w-3.5" />} label="Horario" value={r.schedule} />
            )}
            {r?.clientPhone && (
              <Row icon={<Phone className="h-3.5 w-3.5" />} label="Teléfono" value={r.clientPhone} />
            )}
            {Array.isArray(participants) && (
              <Row
                icon={<Users className="h-3.5 w-3.5" />}
                label="Participantes"
                value={`${participants.length}`}
              />
            )}
          </div>

          {/* Instructors */}
          <div>
            <p className="text-xs font-medium text-[#8A8580] mb-2 flex items-center gap-1.5">
              <Award className="h-3.5 w-3.5" />
              Instructores
            </p>
            {monitors.length === 0 ? (
              <p className="text-xs text-[#8A8580] italic">Sin asignar</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {monitors.map((m) => (
                  <span
                    key={m.id}
                    className="inline-flex rounded-md bg-[#FAF9F7] border border-[#E8E4DE] px-2 py-1 text-xs text-[#2D2A26]"
                  >
                    {m.user.name ?? m.user.email.split("@")[0]}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Participants */}
          {Array.isArray(participants) && participants.length > 0 && (
            <div>
              <p className="text-xs font-medium text-[#8A8580] mb-2 flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5" />
                Alumnos
              </p>
              <div className="rounded-xl border border-[#E8E4DE] divide-y divide-[#E8E4DE]">
                {participants.map((p, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between px-3 py-2 text-xs"
                  >
                    <span className="text-[#2D2A26]">{p.name ?? `Alumno ${i + 1}`}</span>
                    <div className="flex items-center gap-2 text-[#8A8580]">
                      {p.type && <span>{p.type}</span>}
                      {p.level && (
                        <span className="rounded bg-[#FAF9F7] px-1.5 py-0.5">
                          {p.level}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activity.operationalNotes && (
            <div>
              <p className="text-xs font-medium text-[#8A8580] mb-1">Notas operativas</p>
              <p className="text-sm text-[#2D2A26] whitespace-pre-wrap rounded-xl bg-[#FAF9F7] border border-[#E8E4DE] p-3">
                {activity.operationalNotes}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wide text-[#8A8580]">
        {icon}
        {label}
      </p>
      <p className="text-sm text-[#2D2A26] mt-0.5">{value}</p>
    </div>
  );
}
