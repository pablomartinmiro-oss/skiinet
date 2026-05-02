"use client";

import { Receipt, FileText, Calendar } from "lucide-react";
import type { Client } from "@/hooks/useClients";
import { useClientHistory } from "@/hooks/useClients";
import { Skeleton } from "@/components/ui/skeleton";

const EUR = new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" });

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" });
}

export function HistoryTab({ client }: { client: Client }) {
  const { data, isLoading } = useClientHistory(client.id);

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full" />
        ))}
      </div>
    );
  }

  const reservations = data?.reservations ?? [];
  const quotes = data?.quotes ?? [];

  if (reservations.length === 0 && quotes.length === 0) {
    return (
      <div className="glass-card p-8 text-center">
        <Calendar className="mx-auto h-8 w-8 text-[#E8E4DE] mb-2" />
        <p className="text-sm text-[#8A8580]">Sin historial de reservas o presupuestos</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {reservations.length > 0 && (
        <section>
          <h4 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[#8A8580]">
            <Receipt className="h-3.5 w-3.5" />
            Reservas ({reservations.length})
          </h4>
          <ul className="space-y-1.5">
            {reservations.map((r) => (
              <li
                key={r.id}
                className="flex items-center justify-between rounded-[10px] border border-[#E8E4DE] bg-white px-3 py-2"
              >
                <div>
                  <p className="text-sm font-medium text-[#2D2A26]">{r.station}</p>
                  <p className="text-xs text-[#8A8580]">
                    {fmtDate(r.activityDate)} · {r.source}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-[#2D2A26]">{EUR.format(r.totalPrice)}</p>
                  <StatusBadge status={r.status} />
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {quotes.length > 0 && (
        <section>
          <h4 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[#8A8580]">
            <FileText className="h-3.5 w-3.5" />
            Presupuestos ({quotes.length})
          </h4>
          <ul className="space-y-1.5">
            {quotes.map((q) => (
              <li
                key={q.id}
                className="flex items-center justify-between rounded-[10px] border border-[#E8E4DE] bg-white px-3 py-2"
              >
                <div>
                  <p className="text-sm font-medium text-[#2D2A26]">{q.destination}</p>
                  <p className="text-xs text-[#8A8580]">
                    {fmtDate(q.checkIn)} → {fmtDate(q.checkOut)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-[#2D2A26]">{EUR.format(q.totalAmount)}</p>
                  <StatusBadge status={q.status} />
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; fg: string; label: string }> = {
    pendiente: { bg: "#D4A85326", fg: "#8A6F22", label: "Pendiente" },
    confirmada: { bg: "#5B8C6D26", fg: "#3D6049", label: "Confirmada" },
    sin_disponibilidad: { bg: "#C75D4A26", fg: "#8B3F31", label: "Sin disp." },
    cancelada: { bg: "#8A858026", fg: "#5C5853", label: "Cancelada" },
    nuevo: { bg: "#7C9CB826", fg: "#3F5870", label: "Nuevo" },
    borrador: { bg: "#8A858026", fg: "#5C5853", label: "Borrador" },
    enviado: { bg: "#7C9CB826", fg: "#3F5870", label: "Enviado" },
    pagado: { bg: "#5B8C6D26", fg: "#3D6049", label: "Pagado" },
    expirado: { bg: "#C75D4A26", fg: "#8B3F31", label: "Expirado" },
    cancelado: { bg: "#8A858026", fg: "#5C5853", label: "Cancelado" },
  };
  const s = map[status] ?? { bg: "#E8E4DE", fg: "#5C5853", label: status };
  return (
    <span
      className="ml-1 inline-flex rounded-md px-1.5 py-0.5 text-[10px] font-medium"
      style={{ backgroundColor: s.bg, color: s.fg }}
    >
      {s.label}
    </span>
  );
}
