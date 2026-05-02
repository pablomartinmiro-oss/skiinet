"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { useResolveCancellation } from "@/hooks/useCancellations";
import { toast } from "sonner";

interface Props {
  requestId: string;
  onClose: () => void;
}

export default function ResolveModal({ requestId, onClose }: Props) {
  const [resolution, setResolution] = useState<string>("fully_accepted");
  const [refundAmount, setRefundAmount] = useState("");
  const [issueVoucher, setIssueVoucher] = useState(false);
  const [voucherType, setVoucherType] = useState<string>("monetary");
  const [voucherValue, setVoucherValue] = useState("");
  const [voucherExpiration, setVoucherExpiration] = useState("");
  const [notes, setNotes] = useState("");

  const resolveMutation = useResolveCancellation();

  const handleResolve = async () => {
    try {
      await resolveMutation.mutateAsync({
        id: requestId,
        resolution,
        refundAmount: refundAmount ? parseFloat(refundAmount) : undefined,
        issueVoucher,
        voucherType: issueVoucher ? voucherType : undefined,
        voucherValue: issueVoucher
          ? parseFloat(voucherValue)
          : undefined,
        voucherExpiration: voucherExpiration || null,
        notes: notes || undefined,
      });
      toast.success("Cancelación resuelta correctamente");
      onClose();
    } catch {
      toast.error("Error al resolver cancelación");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="w-full max-w-lg rounded-[16px] bg-white p-6 shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-semibold text-[#2D2A26]">
            Resolver cancelación
          </h3>
          <button
            onClick={onClose}
            className="rounded-[6px] p-1 text-[#8A8580] hover:bg-[#E8E4DE]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Resolution type */}
          <div>
            <label className="block text-sm font-medium text-[#2D2A26] mb-1">
              Tipo de resolucion
            </label>
            <select
              value={resolution}
              onChange={(e) => setResolution(e.target.value)}
              className="w-full rounded-[10px] border border-[#E8E4DE] px-3 py-2 text-sm"
            >
              <option value="fully_accepted">
                Aceptada total
              </option>
              <option value="partially_accepted">
                Aceptada parcial
              </option>
              <option value="rejected">Rechazada</option>
            </select>
          </div>

          {/* Refund amount */}
          {resolution !== "rejected" && (
            <div>
              <label className="block text-sm font-medium text-[#2D2A26] mb-1">
                Importe devolucion (EUR)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={refundAmount}
                onChange={(e) => setRefundAmount(e.target.value)}
                className="w-full rounded-[10px] border border-[#E8E4DE] px-3 py-2 text-sm"
              />
            </div>
          )}

          {/* Voucher toggle */}
          {resolution !== "rejected" && (
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="issueVoucher"
                checked={issueVoucher}
                onChange={(e) => setIssueVoucher(e.target.checked)}
                className="h-4 w-4 rounded border-[#E8E4DE] accent-[#E87B5A]"
              />
              <label
                htmlFor="issueVoucher"
                className="text-sm text-[#2D2A26]"
              >
                Emitir bono de compensacion
              </label>
            </div>
          )}

          {/* Voucher details */}
          {issueVoucher && resolution !== "rejected" && (
            <div className="rounded-[10px] border border-[#E8E4DE] bg-[#FAF9F7] p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#8A8580] mb-1">
                    Tipo
                  </label>
                  <select
                    value={voucherType}
                    onChange={(e) => setVoucherType(e.target.value)}
                    className="w-full rounded-[10px] border border-[#E8E4DE] px-3 py-2 text-sm"
                  >
                    <option value="monetary">Monetario</option>
                    <option value="activity">Actividad</option>
                    <option value="service">Servicio</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#8A8580] mb-1">
                    Valor (EUR)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={voucherValue}
                    onChange={(e) => setVoucherValue(e.target.value)}
                    className="w-full rounded-[10px] border border-[#E8E4DE] px-3 py-2 text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-[#8A8580] mb-1">
                  Fecha de expiracion
                </label>
                <input
                  type="date"
                  value={voucherExpiration}
                  onChange={(e) => setVoucherExpiration(e.target.value)}
                  className="w-full rounded-[10px] border border-[#E8E4DE] px-3 py-2 text-sm"
                />
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-[#2D2A26] mb-1">
              Notas internas
            </label>
            <textarea
              rows={3}
              placeholder="Notas opcionales sobre la resolucion..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-[10px] border border-[#E8E4DE] px-3 py-2 text-sm"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-2 justify-end mt-6">
          <button
            onClick={onClose}
            className="rounded-[10px] border border-[#E8E4DE] px-4 py-2 text-sm text-[#8A8580] hover:bg-[#FAF9F7]"
          >
            Cancelar
          </button>
          <button
            onClick={handleResolve}
            disabled={resolveMutation.isPending}
            className="rounded-[10px] bg-[#E87B5A] px-4 py-2 text-sm font-medium text-white hover:bg-[#D56E4F] disabled:opacity-50"
          >
            {resolveMutation.isPending
              ? "Resolviendo..."
              : "Confirmar resolucion"}
          </button>
        </div>
      </div>
    </div>
  );
}
