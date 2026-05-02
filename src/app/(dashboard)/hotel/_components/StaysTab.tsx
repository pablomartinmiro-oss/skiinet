"use client";

import { useQuery } from "@tanstack/react-query";
import { BedDouble, Mail, Phone } from "lucide-react";

interface LodgeStay {
  id: string;
  guestName: string;
  guestEmail: string | null;
  guestPhone: string | null;
  checkIn: string;
  checkOut: string;
  adults: number;
  children: number;
  totalAmount: number;
  status: string;
  notes: string | null;
  roomType: { id: string; title: string } | null;
}

const STATUS_LABELS: Record<string, { label: string; cls: string }> = {
  reservada: { label: "Reservada", cls: "bg-blue-50 text-blue-700" },
  checkin: { label: "Check-in", cls: "bg-emerald-50 text-emerald-700" },
  checkout: { label: "Check-out", cls: "bg-slate-100 text-slate-600" },
  cancelada: { label: "Cancelada", cls: "bg-red-50 text-red-700" },
};

const fmtEUR = new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" });

function formatDate(s: string): string {
  return new Date(s).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Europe/Madrid",
  });
}

function nights(a: string, b: string): number {
  const ms = new Date(b).getTime() - new Date(a).getTime();
  return Math.max(1, Math.round(ms / 86_400_000));
}

export default function StaysTab() {
  const { data, isLoading, error } = useQuery<{ stays: LodgeStay[] }>({
    queryKey: ["hotel-stays"],
    queryFn: () => fetch("/api/hotel/stays").then((r) => r.json()),
  });

  if (isLoading) {
    return (
      <div className="rounded-2xl bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-12 text-center">
        <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-slate-200 border-t-slate-700" />
      </div>
    );
  }
  if (error) {
    return (
      <div className="rounded-2xl bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-8 text-center text-sm text-[#C75D4A]">
        Error al cargar reservas de alojamiento
      </div>
    );
  }
  const stays = data?.stays ?? [];
  if (stays.length === 0) {
    return (
      <div className="rounded-2xl bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-12 text-center">
        <BedDouble className="mx-auto h-10 w-10 text-[#8A8580] mb-3" />
        <p className="text-sm text-[#8A8580]">Sin reservas de alojamiento</p>
        <p className="text-xs text-[#8A8580] mt-1">
          Las estancias se generan automáticamente al confirmar reservas con item de hotel.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#E8E4DE] bg-[#FAF9F7]/50">
              <th className="px-4 py-3 text-left text-xs font-medium text-[#8A8580] uppercase tracking-wider">Huésped</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[#8A8580] uppercase tracking-wider">Habitación</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[#8A8580] uppercase tracking-wider">Check-in</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[#8A8580] uppercase tracking-wider">Check-out</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-[#8A8580] uppercase tracking-wider">Noches</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-[#8A8580] uppercase tracking-wider">Personas</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-[#8A8580] uppercase tracking-wider">Importe</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-[#8A8580] uppercase tracking-wider">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E8E4DE]">
            {stays.map((s) => {
              const st = STATUS_LABELS[s.status] ?? STATUS_LABELS.reservada;
              return (
                <tr key={s.id} className="hover:bg-[#FAF9F7]/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-medium text-[#2D2A26]">{s.guestName}</div>
                    <div className="flex flex-wrap items-center gap-2 mt-0.5 text-xs text-[#8A8580]">
                      {s.guestEmail && (
                        <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{s.guestEmail}</span>
                      )}
                      {s.guestPhone && (
                        <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{s.guestPhone}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[#2D2A26]">{s.roomType?.title ?? "—"}</td>
                  <td className="px-4 py-3 text-[#2D2A26]">{formatDate(s.checkIn)}</td>
                  <td className="px-4 py-3 text-[#2D2A26]">{formatDate(s.checkOut)}</td>
                  <td className="px-4 py-3 text-center text-[#8A8580]">{nights(s.checkIn, s.checkOut)}</td>
                  <td className="px-4 py-3 text-center text-[#8A8580]">
                    {s.adults}
                    {s.children > 0 && <span className="text-[#8A8580]"> + {s.children}</span>}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-[#2D2A26]">{fmtEUR.format(s.totalAmount)}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex rounded-[6px] px-2 py-0.5 text-xs font-medium ${st.cls}`}>
                      {st.label}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
