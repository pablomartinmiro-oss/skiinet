"use client";

import { X, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { useSession, useCloseSession } from "@/hooks/useTpv";

const fmt = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
});
const dtf = new Intl.DateTimeFormat("es-ES", {
  dateStyle: "short",
  timeStyle: "short",
});

interface Props {
  sessionId: string;
  onClose: () => void;
  form: { closingAmount: number };
  setForm: (v: { closingAmount: number }) => void;
  mutation: ReturnType<typeof useCloseSession>;
}

export default function CloseSessionModal({
  sessionId,
  onClose,
  form,
  setForm,
  mutation,
}: Props) {
  const { data, isLoading } = useSession(sessionId);
  const session = data?.session;

  let totalCash = 0;
  let totalCard = 0;
  let totalBizum = 0;
  let salesCount = 0;
  let movementsCash = 0;

  if (session) {
    salesCount = session.sales?.length ?? 0;
    for (const sale of session.sales ?? []) {
      totalCash += sale.paymentMethods?.cash ?? 0;
      totalCard += sale.paymentMethods?.card ?? 0;
      totalBizum += sale.paymentMethods?.bizum ?? 0;
    }
    for (const mov of session.movements ?? []) {
      movementsCash += mov.type === "in" ? mov.amount : -mov.amount;
    }
  }
  const expectedCash =
    (session?.openingAmount ?? 0) + totalCash + movementsCash;
  const difference =
    Math.round((form.closingAmount - expectedCash) * 100) / 100;

  const handleSubmit = async () => {
    try {
      await mutation.mutateAsync({
        id: sessionId,
        closingAmount: form.closingAmount,
        totalCash,
        totalCard,
        totalBizum,
      });
      toast.success("Caja cerrada");
      onClose();
    } catch {
      toast.error("Error al cerrar caja");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-[#2D2A26]">Cerrar Caja</h2>
          <button
            onClick={onClose}
            className="text-[#8A8580] hover:text-[#2D2A26]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {isLoading ? (
          <p className="text-sm text-[#8A8580]">
            Cargando datos de la sesion...
          </p>
        ) : session ? (
          <>
            <div className="mb-4 rounded-[10px] border border-[#E8E4DE] bg-[#FAF9F7]/40 p-4">
              <div className="mb-3 flex items-center gap-2 text-sm font-medium text-[#2D2A26]">
                <TrendingUp className="h-4 w-4 text-[#E87B5A]" /> Resumen de la
                sesion
              </div>
              <div className="space-y-1.5 text-sm">
                <Row label="Caja" value={session.register?.name ?? "—"} />
                <Row
                  label="Apertura"
                  value={dtf.format(new Date(session.openedAt))}
                />
                <Row
                  label="Importe inicial"
                  value={fmt.format(session.openingAmount)}
                />
                <Row label="Ventas" value={String(salesCount)} />
                <Row label="Total efectivo" value={fmt.format(totalCash)} />
                <Row label="Total tarjeta" value={fmt.format(totalCard)} />
                <Row label="Total Bizum" value={fmt.format(totalBizum)} />
                {movementsCash !== 0 && (
                  <Row
                    label="Movimientos efectivo"
                    value={fmt.format(movementsCash)}
                  />
                )}
                <div className="mt-2 flex justify-between border-t border-[#E8E4DE] pt-2 text-sm font-semibold text-[#2D2A26]">
                  <span>Efectivo esperado</span>
                  <span>{fmt.format(expectedCash)}</span>
                </div>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-[#2D2A26] mb-1">
                Efectivo contado al cierre *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.closingAmount || ""}
                onChange={(e) =>
                  setForm({
                    closingAmount: parseFloat(e.target.value) || 0,
                  })
                }
                placeholder="0.00"
                className="w-full rounded-[10px] border border-[#E8E4DE] px-3 py-2 text-sm focus:border-[#E87B5A] focus:outline-none"
              />
            </div>

            <div
              className={`mb-4 rounded-[10px] px-3 py-2.5 text-sm font-medium ${
                Math.abs(difference) < 0.01
                  ? "bg-emerald-50 text-emerald-700"
                  : difference > 0
                    ? "bg-amber-50 text-amber-700"
                    : "bg-red-50 text-[#C75D4A]"
              }`}
            >
              <div className="flex justify-between">
                <span>Diferencia</span>
                <span>{fmt.format(difference)}</span>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={onClose}
                className="rounded-[10px] border border-[#E8E4DE] px-4 py-2 text-sm font-medium text-[#8A8580] hover:bg-[#FAF9F7] transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmit}
                disabled={mutation.isPending}
                className="rounded-[10px] bg-[#C75D4A] px-4 py-2 text-sm font-medium text-white hover:bg-[#B5503F] transition-colors disabled:opacity-50"
              >
                Cerrar Caja
              </button>
            </div>
          </>
        ) : (
          <p className="text-sm text-[#C75D4A]">Sesión no encontrada</p>
        )}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-[#8A8580]">
      <span>{label}</span>
      <span className="text-[#2D2A26]">{value}</span>
    </div>
  );
}
