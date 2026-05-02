"use client";

import { useState } from "react";
import { Plus, Lock, Clock } from "lucide-react";
import { toast } from "sonner";
import {
  useRegisters,
  useSessions,
  useOpenSession,
  useCloseSession,
} from "@/hooks/useTpv";
import type { CashSession } from "@/hooks/useTpv";
import { PageSkeleton } from "@/components/shared/LoadingSkeleton";
import OpenSessionModal from "./OpenSessionModal";
import CloseSessionModal from "./CloseSessionModal";

const fmt = new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" });
const dtf = new Intl.DateTimeFormat("es-ES", {
  dateStyle: "short",
  timeStyle: "short",
});

export default function SessionsTab() {
  const { data: regData } = useRegisters();
  const registers = regData?.registers ?? [];

  const [filterRegister, setFilterRegister] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("");

  const { data, isLoading } = useSessions(
    filterRegister || undefined,
    filterStatus || undefined
  );
  const openSession = useOpenSession();
  const closeSession = useCloseSession();

  const [openModal, setOpenModal] = useState(false);
  const [closeSessionId, setCloseSessionId] = useState<string | null>(null);
  const [openForm, setOpenForm] = useState({ registerId: "", openingAmount: 0 });
  const [closeForm, setCloseForm] = useState({ closingAmount: 0 });

  if (isLoading) return <PageSkeleton />;

  const sessions = data?.sessions ?? [];

  const handleOpen = async () => {
    if (!openForm.registerId) {
      toast.error("Selecciona una caja");
      return;
    }
    try {
      await openSession.mutateAsync({
        registerId: openForm.registerId,
        openingAmount: openForm.openingAmount,
      });
      toast.success("Caja abierta");
      setOpenModal(false);
      setOpenForm({ registerId: "", openingAmount: 0 });
    } catch {
      toast.error("Error al abrir caja");
    }
  };

  const startClose = (s: CashSession) => {
    setCloseForm({ closingAmount: 0 });
    setCloseSessionId(s.id);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <select
            value={filterRegister}
            onChange={(e) => setFilterRegister(e.target.value)}
            className="rounded-[10px] border border-[#E8E4DE] px-3 py-2 text-sm focus:border-[#E87B5A] focus:outline-none"
          >
            <option value="">Todas las cajas</option>
            {registers.map((r) => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="rounded-[10px] border border-[#E8E4DE] px-3 py-2 text-sm focus:border-[#E87B5A] focus:outline-none"
          >
            <option value="">Todos los estados</option>
            <option value="open">Abierta</option>
            <option value="closed">Cerrada</option>
          </select>
        </div>
        <button
          onClick={() => setOpenModal(true)}
          className="flex items-center gap-2 rounded-[10px] bg-[#E87B5A] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#D56E4F] transition-colors"
        >
          <Plus className="h-4 w-4" /> Abrir Caja
        </button>
      </div>

      {sessions.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <Clock className="mx-auto h-10 w-10 text-[#8A8580] mb-3" />
          <p className="text-sm text-[#8A8580]">No hay sesiones de caja</p>
          <p className="text-xs text-[#8A8580] mt-1">
            Abre una caja para empezar a registrar ventas
          </p>
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#E8E4DE] bg-[#FAF9F7]/50">
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#8A8580] uppercase tracking-wider">Caja</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#8A8580] uppercase tracking-wider">Apertura</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#8A8580] uppercase tracking-wider">Abierta por</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-[#8A8580] uppercase tracking-wider">Importe inicial</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-[#8A8580] uppercase tracking-wider">Ventas</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-[#8A8580] uppercase tracking-wider">Discrepancia</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-[#8A8580] uppercase tracking-wider">Estado</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-[#8A8580] uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E4DE]">
                {sessions.map((s) => (
                  <tr key={s.id} className="hover:bg-[#FAF9F7]/30 transition-colors">
                    <td className="px-4 py-4 text-sm font-medium text-[#2D2A26]">{s.register?.name ?? "—"}</td>
                    <td className="px-4 py-4 text-sm text-[#8A8580]">{dtf.format(new Date(s.openedAt))}</td>
                    <td className="px-4 py-4 text-sm text-[#8A8580]">{s.openedBy?.name ?? "—"}</td>
                    <td className="px-4 py-4 text-right text-sm text-[#2D2A26]">{fmt.format(s.openingAmount)}</td>
                    <td className="px-4 py-4 text-center text-sm text-[#8A8580]">{s._count?.sales ?? 0}</td>
                    <td className="px-4 py-4 text-right text-sm">
                      {s.discrepancy != null ? (
                        <span className={s.discrepancy === 0 ? "text-[#5B8C6D]" : "text-[#C75D4A] font-medium"}>
                          {fmt.format(s.discrepancy)}
                        </span>
                      ) : "—"}
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className={`inline-flex rounded-[6px] px-2 py-0.5 text-xs font-medium ${
                        s.status === "open" ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-500"
                      }`}>
                        {s.status === "open" ? "Abierta" : "Cerrada"}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right">
                      {s.status === "open" && (
                        <button
                          onClick={() => startClose(s)}
                          className="flex items-center gap-1 rounded-[10px] px-3 py-1.5 text-xs font-medium text-[#C75D4A] bg-red-50 hover:bg-red-100 transition-colors"
                        >
                          <Lock className="h-3 w-3" /> Cerrar Caja
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {openModal && (
        <OpenSessionModal
          onClose={() => setOpenModal(false)}
          registers={registers.filter((r) => r.active)}
          form={openForm}
          setForm={setOpenForm}
          onSubmit={handleOpen}
          submitting={openSession.isPending}
        />
      )}

      {closeSessionId && (
        <CloseSessionModal
          sessionId={closeSessionId}
          onClose={() => setCloseSessionId(null)}
          form={closeForm}
          setForm={setCloseForm}
          mutation={closeSession}
        />
      )}
    </div>
  );
}
