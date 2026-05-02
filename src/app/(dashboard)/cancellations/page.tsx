"use client";

import { useState } from "react";
import { XCircle, Plus } from "lucide-react";
import {
  useCancellations,
  useCreateCancellation,
  type CancellationRequest,
} from "@/hooks/useCancellations";
import CancellationTableRow from "./_components/CancellationTableRow";
import ResolveModal from "./_components/ResolveModal";
import { toast } from "sonner";

const STATUS_OPTIONS = [
  { value: "", label: "Todos" },
  { value: "recibida", label: "Recibida" },
  { value: "en_revision", label: "En revision" },
  { value: "pendiente_documentacion", label: "Pte. documentacion" },
  { value: "pendiente_decision", label: "Pte. decision" },
  { value: "resuelta", label: "Resuelta" },
  { value: "cerrada", label: "Cerrada" },
];

export default function CancellationsPage() {
  const [statusFilter, setStatusFilter] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [resolveTarget, setResolveTarget] = useState<string | null>(null);
  const [newReason, setNewReason] = useState("");
  const [newReservationId, setNewReservationId] = useState("");
  const [newQuoteId, setNewQuoteId] = useState("");

  const { data: requests, isLoading } = useCancellations(
    statusFilter || undefined
  );
  const createMutation = useCreateCancellation();

  const handleCreate = async () => {
    try {
      await createMutation.mutateAsync({
        reservationId: newReservationId || null,
        quoteId: newQuoteId || null,
        reason: newReason || null,
      });
      toast.success("Solicitud de cancelación creada");
      setShowCreateForm(false);
      setNewReason("");
      setNewReservationId("");
      setNewQuoteId("");
    } catch {
      toast.error("Error al crear solicitud");
    }
  };

  const fmt = new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const fmtCurrency = new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <XCircle className="h-6 w-6 text-[#E87B5A]" />
          <h1 className="text-2xl font-bold text-[#2D2A26]">
            Cancelaciónes
          </h1>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="flex items-center gap-2 rounded-[10px] bg-[#E87B5A] px-4 py-2 text-sm font-medium text-white hover:bg-[#D56E4F] transition-colors"
        >
          <Plus className="h-4 w-4" />
          Nueva solicitud
        </button>
      </div>

      {/* Create Form */}
      {showCreateForm && (
        <CreateForm
          newReservationId={newReservationId}
          newQuoteId={newQuoteId}
          newReason={newReason}
          onChangeReservationId={setNewReservationId}
          onChangeQuoteId={setNewQuoteId}
          onChangeReason={setNewReason}
          onSubmit={handleCreate}
          onCancel={() => setShowCreateForm(false)}
          isPending={createMutation.isPending}
        />
      )}

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {STATUS_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setStatusFilter(opt.value)}
            className={`rounded-[6px] px-3 py-1.5 text-xs font-medium transition-colors ${
              statusFilter === opt.value
                ? "bg-[#E87B5A] text-white"
                : "bg-[#FAF9F7] text-[#8A8580] hover:bg-[#E8E4DE]"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Table */}
      {isLoading ? (
        <TableSkeleton />
      ) : !requests?.length ? (
        <div className="rounded-[16px] border border-[#E8E4DE] bg-white p-12 text-center">
          <XCircle className="mx-auto h-10 w-10 text-[#E8E4DE]" />
          <p className="mt-3 text-sm text-[#8A8580]">
            No hay solicitudes de cancelación
          </p>
        </div>
      ) : (
        <div className="rounded-[16px] border border-[#E8E4DE] bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#E8E4DE] bg-[#FAF9F7]">
                {["ID", "Ref.", "Motivo", "Estado", "Resolucion", "Importe", "Fecha"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-medium text-[#8A8580]">{h}</th>
                ))}
                <th className="px-4 py-3 text-right font-medium text-[#8A8580]">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((req: CancellationRequest) => (
                <CancellationTableRow
                  key={req.id}
                  req={req}
                  isExpanded={expandedId === req.id}
                  onToggle={() => setExpandedId(expandedId === req.id ? null : req.id)}
                  onResolve={() => setResolveTarget(req.id)}
                  fmt={fmt}
                  fmtCurrency={fmtCurrency}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {resolveTarget && (
        <ResolveModal
          requestId={resolveTarget}
          onClose={() => setResolveTarget(null)}
        />
      )}
    </div>
  );
}

// ==================== CREATE FORM ====================

function CreateForm({
  newReservationId,
  newQuoteId,
  newReason,
  onChangeReservationId,
  onChangeQuoteId,
  onChangeReason,
  onSubmit,
  onCancel,
  isPending,
}: {
  newReservationId: string;
  newQuoteId: string;
  newReason: string;
  onChangeReservationId: (v: string) => void;
  onChangeQuoteId: (v: string) => void;
  onChangeReason: (v: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
  isPending: boolean;
}) {
  return (
    <div className="rounded-[16px] border border-[#E8E4DE] bg-white p-6 space-y-4">
      <h3 className="text-lg font-semibold text-[#2D2A26]">Nueva solicitud de cancelación</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <input
          placeholder="ID Reserva (opcional)"
          value={newReservationId}
          onChange={(e) => onChangeReservationId(e.target.value)}
          className="rounded-[10px] border border-[#E8E4DE] px-3 py-2 text-sm"
        />
        <input
          placeholder="ID Presupuesto (opcional)"
          value={newQuoteId}
          onChange={(e) => onChangeQuoteId(e.target.value)}
          className="rounded-[10px] border border-[#E8E4DE] px-3 py-2 text-sm"
        />
      </div>
      <textarea
        placeholder="Motivo de cancelación"
        value={newReason}
        onChange={(e) => onChangeReason(e.target.value)}
        rows={3}
        className="w-full rounded-[10px] border border-[#E8E4DE] px-3 py-2 text-sm"
      />
      <div className="flex gap-2 justify-end">
        <button
          onClick={onCancel}
          className="rounded-[10px] border border-[#E8E4DE] px-4 py-2 text-sm text-[#8A8580] hover:bg-[#FAF9F7]"
        >
          Cancelar
        </button>
        <button
          onClick={onSubmit}
          disabled={isPending}
          className="rounded-[10px] bg-[#E87B5A] px-4 py-2 text-sm font-medium text-white hover:bg-[#D56E4F] disabled:opacity-50"
        >
          {isPending ? "Creando..." : "Crear"}
        </button>
      </div>
    </div>
  );
}

// ==================== SKELETON ====================

function TableSkeleton() {
  return (
    <div className="rounded-[16px] border border-[#E8E4DE] bg-white p-4 space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="h-12 rounded-[10px] bg-[#E8E4DE]/40 animate-pulse" />
      ))}
    </div>
  );
}
