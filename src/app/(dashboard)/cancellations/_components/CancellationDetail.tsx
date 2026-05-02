"use client";

import { Clock, Gift, ArrowRight } from "lucide-react";
import {
  useCancellation,
  type CancellationLog,
  type CancellationVoucher,
} from "@/hooks/useCancellations";
import VoucherRow from "./VoucherRow";

const STATUS_LABEL: Record<string, string> = {
  recibida: "Recibida",
  en_revision: "En revision",
  pendiente_documentacion: "Pte. documentacion",
  pendiente_decision: "Pte. decision",
  resuelta: "Resuelta",
  cerrada: "Cerrada",
};

const FINANCIAL_LABEL: Record<string, string> = {
  devuelta_economicamente: "Devolucion economica",
  pendiente_devolucion: "Pendiente devolucion",
  bono_emitido: "Bono emitido",
};

interface Props {
  requestId: string;
}

export default function CancellationDetail({ requestId }: Props) {
  const { data: cancellation, isLoading } = useCancellation(requestId);

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-3">
        <div className="h-6 w-48 rounded bg-[#E8E4DE]/40" />
        <div className="h-20 rounded bg-[#E8E4DE]/40" />
      </div>
    );
  }

  if (!cancellation) {
    return (
      <p className="text-sm text-[#8A8580]">No se pudo cargar el detalle</p>
    );
  }

  const fmtDate = new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const fmtCurrency = new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
  });

  return (
    <div className="space-y-5">
      {/* Resolution info */}
      {cancellation.resolution && (
        <div className="glass-card p-4">
          <h4 className="text-sm font-semibold text-[#2D2A26] mb-2">
            Resolucion
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div>
              <span className="text-[#8A8580]">Tipo:</span>{" "}
              <span className="text-[#2D2A26] font-medium">
                {cancellation.resolution === "fully_accepted"
                  ? "Aceptada total"
                  : cancellation.resolution === "partially_accepted"
                    ? "Aceptada parcial"
                    : "Rechazada"}
              </span>
            </div>
            {cancellation.refundAmount !== null && (
              <div>
                <span className="text-[#8A8580]">Importe:</span>{" "}
                <span className="text-[#2D2A26] font-medium">
                  {fmtCurrency.format(cancellation.refundAmount)}
                </span>
              </div>
            )}
            {cancellation.creditNoteNumber && (
              <div>
                <span className="text-[#8A8580]">Nota credito:</span>{" "}
                <span className="font-mono text-[#2D2A26]">
                  {cancellation.creditNoteNumber}
                </span>
              </div>
            )}
            {cancellation.financialStatus && (
              <div>
                <span className="text-[#8A8580]">Estado financiero:</span>{" "}
                <span className="text-[#2D2A26] font-medium">
                  {FINANCIAL_LABEL[cancellation.financialStatus] ??
                    cancellation.financialStatus}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Timeline */}
      <div className="glass-card p-4">
        <h4 className="text-sm font-semibold text-[#2D2A26] mb-3 flex items-center gap-2">
          <Clock className="h-4 w-4 text-[#E87B5A]" />
          Historial de estados
        </h4>
        {cancellation.logs.length === 0 ? (
          <p className="text-sm text-[#8A8580]">Sin entradas</p>
        ) : (
          <div className="space-y-3">
            {cancellation.logs.map((log: CancellationLog) => (
              <div key={log.id} className="flex items-start gap-3">
                <div className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-[#E87B5A]" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    {log.previousStatus && (
                      <>
                        <span className="text-xs text-[#8A8580]">
                          {STATUS_LABEL[log.previousStatus] ?? log.previousStatus}
                        </span>
                        <ArrowRight className="h-3 w-3 text-[#E8E4DE]" />
                      </>
                    )}
                    <span className="text-xs font-medium text-[#2D2A26]">
                      {STATUS_LABEL[log.newStatus] ?? log.newStatus}
                    </span>
                    <span className="text-xs text-[#8A8580]">
                      {fmtDate.format(new Date(log.timestamp))}
                    </span>
                  </div>
                  {log.notes && (
                    <p className="mt-0.5 text-xs text-[#8A8580]">{log.notes}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Vouchers */}
      {cancellation.vouchers.length > 0 && (
        <div className="glass-card p-4">
          <h4 className="text-sm font-semibold text-[#2D2A26] mb-3 flex items-center gap-2">
            <Gift className="h-4 w-4 text-[#5B8C6D]" />
            Bonos emitidos
          </h4>
          <div className="space-y-2">
            {cancellation.vouchers.map((v: CancellationVoucher) => (
              <VoucherRow key={v.id} voucher={v} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
