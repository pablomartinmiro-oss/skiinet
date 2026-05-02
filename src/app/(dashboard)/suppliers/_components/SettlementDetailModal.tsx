"use client";

import { X } from "lucide-react";
import { useSettlement } from "@/hooks/useSuppliers";

const statusBadge: Record<string, string> = {
  draft: "bg-gray-100 text-gray-500",
  sent: "bg-blue-50 text-blue-700",
  paid: "bg-emerald-50 text-emerald-700",
};
const statusLabel: Record<string, string> = {
  draft: "Borrador",
  sent: "Enviada",
  paid: "Pagada",
};

const fmt = new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" });

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

interface Props {
  id: string;
  onClose: () => void;
}

export default function SettlementDetailModal({ id, onClose }: Props) {
  const { data, isLoading } = useSettlement(id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-xl max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-[#E8E4DE] px-6 py-4 shrink-0">
          {isLoading || !data ? (
            <h2 className="text-lg font-semibold text-[#2D2A26]">Cargando...</h2>
          ) : (
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold text-[#2D2A26]">
                Liquidación {data.settlement.number}
              </h2>
              <span
                className={`rounded-[6px] px-2 py-0.5 text-xs font-medium ${statusBadge[data.settlement.status] || "bg-gray-100 text-gray-500"}`}
              >
                {statusLabel[data.settlement.status] || data.settlement.status}
              </span>
            </div>
          )}
          <button
            onClick={onClose}
            className="rounded-[10px] p-1.5 text-[#8A8580] hover:bg-[#FAF9F7] transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {isLoading || !data ? (
          <div className="p-8 text-center text-sm text-[#8A8580]">Cargando...</div>
        ) : (
          <div className="overflow-y-auto flex-1 p-6 space-y-4">
            <div className="flex flex-wrap gap-4 text-sm text-[#8A8580]">
              <span>
                <span className="font-medium text-[#2D2A26]">Proveedor:</span>{" "}
                {data.settlement.supplier?.fiscalName ?? "—"}
              </span>
              <span>
                <span className="font-medium text-[#2D2A26]">Periodo:</span>{" "}
                {fmtDate(data.settlement.startDate)} — {fmtDate(data.settlement.endDate)}
              </span>
            </div>

            {data.settlement.lines.length === 0 ? (
              <p className="text-sm text-[#8A8580] text-center py-6">
                Sin líneas de detalle
              </p>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-[#E8E4DE]">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[#FAF9F7]/50 border-b border-[#E8E4DE]">
                      <th className="px-4 py-2.5 text-left text-xs font-medium text-[#8A8580] uppercase tracking-wider">
                        Tipo servicio
                      </th>
                      <th className="px-4 py-2.5 text-left text-xs font-medium text-[#8A8580] uppercase tracking-wider">
                        Fecha
                      </th>
                      <th className="px-4 py-2.5 text-right text-xs font-medium text-[#8A8580] uppercase tracking-wider">
                        Pax
                      </th>
                      <th className="px-4 py-2.5 text-right text-xs font-medium text-[#8A8580] uppercase tracking-wider">
                        Venta
                      </th>
                      <th className="px-4 py-2.5 text-right text-xs font-medium text-[#8A8580] uppercase tracking-wider">
                        Com. %
                      </th>
                      <th className="px-4 py-2.5 text-right text-xs font-medium text-[#8A8580] uppercase tracking-wider">
                        Com. €
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E8E4DE]">
                    {data.settlement.lines.map((l) => (
                      <tr key={l.id} className="hover:bg-[#FAF9F7]/30">
                        <td className="px-4 py-3 text-[#2D2A26]">{l.serviceType}</td>
                        <td className="px-4 py-3 text-[#8A8580]">{fmtDate(l.serviceDate)}</td>
                        <td className="px-4 py-3 text-right text-[#2D2A26]">{l.paxCount}</td>
                        <td className="px-4 py-3 text-right text-[#2D2A26]">
                          {fmt.format(l.saleAmount)}
                        </td>
                        <td className="px-4 py-3 text-right text-[#8A8580]">
                          {l.commissionPercentage}%
                        </td>
                        <td className="px-4 py-3 text-right text-[#E87B5A]">
                          {fmt.format(l.commissionAmount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="flex justify-end gap-6 rounded-xl bg-[#FAF9F7] px-6 py-4 text-sm">
              <div className="text-center">
                <p className="text-xs text-[#8A8580] mb-0.5">Bruto</p>
                <p className="font-medium text-[#2D2A26]">
                  {fmt.format(data.settlement.grossAmount)}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-[#8A8580] mb-0.5">Comisión</p>
                <p className="font-medium text-[#E87B5A]">
                  {fmt.format(data.settlement.commissionAmount)}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-[#8A8580] mb-0.5">Neto</p>
                <p className="font-semibold text-[#5B8C6D]">
                  {fmt.format(data.settlement.netAmount)}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
