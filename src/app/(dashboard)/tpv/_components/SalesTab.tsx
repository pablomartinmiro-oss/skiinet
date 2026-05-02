"use client";

import { useState, useMemo } from "react";
import { Trash2, Receipt, Eye, X } from "lucide-react";
import { toast } from "sonner";
import {
  useSessions,
  useSales,
  useDeleteSale,
} from "@/hooks/useTpv";
import type { TpvSale, PaymentMethods } from "@/hooks/useTpv";
import { PageSkeleton } from "@/components/shared/LoadingSkeleton";

const fmt = new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" });
const dtf = new Intl.DateTimeFormat("es-ES", {
  dateStyle: "short",
  timeStyle: "short",
});

function formatPaymentMethods(pm: PaymentMethods) {
  const parts: string[] = [];
  if (pm.cash > 0) parts.push(`Efectivo: ${fmt.format(pm.cash)}`);
  if (pm.card > 0) parts.push(`Tarjeta: ${fmt.format(pm.card)}`);
  if (pm.bizum > 0) parts.push(`Bizum: ${fmt.format(pm.bizum)}`);
  return parts.length > 0 ? parts.join(", ") : "—";
}

type PaymentFilter = "" | "cash" | "card" | "bizum" | "mixed";

function dominantMethod(pm: PaymentMethods): "cash" | "card" | "bizum" | "mixed" | null {
  const used = [
    pm.cash > 0 ? "cash" : null,
    pm.card > 0 ? "card" : null,
    pm.bizum > 0 ? "bizum" : null,
  ].filter(Boolean);
  if (used.length === 0) return null;
  if (used.length > 1) return "mixed";
  return used[0] as "cash" | "card" | "bizum";
}

export default function SalesTab() {
  const { data: sessData } = useSessions();
  const sessions = sessData?.sessions ?? [];

  const [filterSession, setFilterSession] = useState<string>("");
  const [filterDate, setFilterDate] = useState<string>("");
  const [filterPayment, setFilterPayment] = useState<PaymentFilter>("");
  const [detailSale, setDetailSale] = useState<TpvSale | null>(null);

  const { data, isLoading } = useSales(
    filterSession || undefined,
    filterDate || undefined
  );
  const deleteSale = useDeleteSale();

  const visibleSales = useMemo(() => {
    const sales = data?.sales ?? [];
    if (!filterPayment) return sales;
    return sales.filter((s) => dominantMethod(s.paymentMethods) === filterPayment);
  }, [data, filterPayment]);

  const totals = useMemo(() => {
    let total = 0;
    let cash = 0;
    let card = 0;
    let bizum = 0;
    for (const s of visibleSales) {
      total += s.totalAmount;
      cash += s.paymentMethods?.cash ?? 0;
      card += s.paymentMethods?.card ?? 0;
      bizum += s.paymentMethods?.bizum ?? 0;
    }
    return { total, cash, card, bizum, count: visibleSales.length };
  }, [visibleSales]);

  if (isLoading) return <PageSkeleton />;

  const handleDelete = async (sale: TpvSale) => {
    if (!confirm(`Eliminar el ticket "${sale.ticketNumber}"?`)) return;
    try {
      await deleteSale.mutateAsync(sale.id);
      toast.success("Venta eliminada");
    } catch {
      toast.error("Error al eliminar venta");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={filterSession}
          onChange={(e) => setFilterSession(e.target.value)}
          className="rounded-[10px] border border-[#E8E4DE] px-3 py-2 text-sm focus:border-[#E87B5A] focus:outline-none"
        >
          <option value="">Todas las sesiones</option>
          {sessions.map((s) => (
            <option key={s.id} value={s.id}>
              {s.register?.name} — {dtf.format(new Date(s.openedAt))}
            </option>
          ))}
        </select>
        <input
          type="date"
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
          className="rounded-[10px] border border-[#E8E4DE] px-3 py-2 text-sm focus:border-[#E87B5A] focus:outline-none"
        />
        <select
          value={filterPayment}
          onChange={(e) => setFilterPayment(e.target.value as PaymentFilter)}
          className="rounded-[10px] border border-[#E8E4DE] px-3 py-2 text-sm focus:border-[#E87B5A] focus:outline-none"
        >
          <option value="">Todos los pagos</option>
          <option value="cash">Efectivo</option>
          <option value="card">Tarjeta</option>
          <option value="bizum">Bizum</option>
          <option value="mixed">Mixto</option>
        </select>
        {(filterDate || filterPayment) && (
          <button
            onClick={() => { setFilterDate(""); setFilterPayment(""); }}
            className="text-xs text-[#8A8580] hover:text-[#E87B5A]"
          >
            Limpiar filtros
          </button>
        )}
      </div>

      {visibleSales.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label={`${totals.count} ventas`} value={fmt.format(totals.total)} />
          <Stat label="Efectivo" value={fmt.format(totals.cash)} />
          <Stat label="Tarjeta" value={fmt.format(totals.card)} />
          <Stat label="Bizum" value={fmt.format(totals.bizum)} />
        </div>
      )}

      {visibleSales.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <Receipt className="mx-auto h-10 w-10 text-[#8A8580] mb-3" />
          <p className="text-sm text-[#8A8580]">No hay ventas registradas</p>
          <p className="text-xs text-[#8A8580] mt-1">
            Las ventas se crean desde una sesión abierta
          </p>
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#E8E4DE] bg-[#FAF9F7]/50">
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#8A8580] uppercase tracking-wider">Ticket</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#8A8580] uppercase tracking-wider">Fecha</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#8A8580] uppercase tracking-wider">Caja</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-[#8A8580] uppercase tracking-wider">Total</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-[#8A8580] uppercase tracking-wider">IVA</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#8A8580] uppercase tracking-wider">Pagos</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-[#8A8580] uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E4DE]">
                {visibleSales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-[#FAF9F7]/30 transition-colors">
                    <td className="px-4 py-4">
                      <span className="rounded-[6px] bg-[#FAF9F7] px-2 py-0.5 text-xs font-mono text-[#2D2A26]">
                        {sale.ticketNumber}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm text-[#8A8580]">{dtf.format(new Date(sale.date))}</td>
                    <td className="px-4 py-4 text-sm text-[#8A8580]">{sale.session?.register?.name ?? "—"}</td>
                    <td className="px-4 py-4 text-right text-sm font-medium text-[#2D2A26]">{fmt.format(sale.totalAmount)}</td>
                    <td className="px-4 py-4 text-right text-sm text-[#8A8580]">{fmt.format(sale.totalTax)}</td>
                    <td className="px-4 py-4 text-sm text-[#8A8580]">{formatPaymentMethods(sale.paymentMethods)}</td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setDetailSale(sale)}
                          className="rounded-[10px] p-1.5 text-[#8A8580] hover:bg-[#FAF9F7] hover:text-[#E87B5A] transition-colors"
                          title="Ver detalle"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(sale)}
                          className="rounded-[10px] p-1.5 text-[#8A8580] hover:bg-red-50 hover:text-[#C75D4A] transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-[#E8E4DE] bg-[#FAF9F7]/40 font-semibold">
                  <td colSpan={3} className="px-4 py-3 text-xs uppercase tracking-wider text-[#8A8580]">
                    Total ({totals.count})
                  </td>
                  <td className="px-4 py-3 text-right text-sm text-[#2D2A26]">
                    {fmt.format(totals.total)}
                  </td>
                  <td colSpan={3}></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {detailSale && (
        <SaleDetailModal sale={detailSale} onClose={() => setDetailSale(null)} />
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="glass-card p-4">
      <p className="text-xs font-medium uppercase tracking-wider text-[#8A8580]">
        {label}
      </p>
      <p className="mt-1 text-lg font-semibold text-[#2D2A26]">{value}</p>
    </div>
  );
}

function SaleDetailModal({ sale, onClose }: { sale: TpvSale; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={onClose}>
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-[#2D2A26]">
            Detalle de venta {sale.ticketNumber}
          </h2>
          <button onClick={onClose} className="text-[#8A8580] hover:text-[#2D2A26]">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="space-y-3 mb-4">
          <DetailRow label="Fecha" value={dtf.format(new Date(sale.date))} />
          <DetailRow label="Total" value={fmt.format(sale.totalAmount)} bold />
          <DetailRow label="IVA" value={fmt.format(sale.totalTax)} />
          <DetailRow label="Pagos" value={formatPaymentMethods(sale.paymentMethods)} />
        </div>
        {sale.items && sale.items.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-[#2D2A26] mb-2">Lineas</h3>
            <div className="rounded-[10px] border border-[#E8E4DE] overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-[#FAF9F7]/50 text-xs text-[#8A8580]">
                    <th className="px-3 py-2 text-left">Descripción</th>
                    <th className="px-3 py-2 text-center">Cant.</th>
                    <th className="px-3 py-2 text-right">P. Unit.</th>
                    <th className="px-3 py-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8E4DE]">
                  {sale.items.map((item) => (
                    <tr key={item.id}>
                      <td className="px-3 py-2 text-sm text-[#2D2A26]">{item.description}</td>
                      <td className="px-3 py-2 text-center text-sm text-[#8A8580]">{item.quantity}</td>
                      <td className="px-3 py-2 text-right text-sm text-[#8A8580]">{fmt.format(item.unitPrice)}</td>
                      <td className="px-3 py-2 text-right text-sm font-medium text-[#2D2A26]">{fmt.format(item.lineTotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-[10px] border border-[#E8E4DE] px-4 py-2 text-sm font-medium text-[#8A8580] hover:bg-[#FAF9F7] transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value, bold = false }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-[#8A8580]">{label}</span>
      <span className={bold ? "font-medium text-[#2D2A26]" : "text-[#2D2A26]"}>{value}</span>
    </div>
  );
}
