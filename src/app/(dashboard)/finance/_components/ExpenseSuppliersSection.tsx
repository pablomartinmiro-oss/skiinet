"use client";

import { useMemo } from "react";
import { Building2 } from "lucide-react";
import { useSuppliers } from "@/hooks/useSuppliers";
import { useExpenses } from "@/hooks/useFinance";

const fmt = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
});

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

interface SupplierAggregate {
  id: string;
  name: string;
  totalSpent: number;
  outstanding: number;
  lastPayment: string | null;
  count: number;
}

export default function ExpenseSuppliersSection() {
  const { data: supData, isLoading: supLoading } = useSuppliers();
  const { data: expData, isLoading: expLoading } = useExpenses();

  const aggregates = useMemo<SupplierAggregate[]>(() => {
    const suppliers = supData?.suppliers ?? [];
    const expenses = expData?.expenses ?? [];
    return suppliers.map((s) => {
      const own = expenses.filter((e) => e.supplierId === s.id);
      const totalSpent = own.reduce((sum, e) => sum + e.amount, 0);
      const outstanding = own
        .filter((e) => e.status === "pending" || e.status === "justified")
        .reduce((sum, e) => sum + e.amount, 0);
      const sorted = [...own].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      const lastPayment =
        sorted.find((e) => e.status === "accounted")?.date ??
        sorted[0]?.date ??
        null;
      return {
        id: s.id,
        name: s.commercialName || s.fiscalName,
        totalSpent,
        outstanding,
        lastPayment,
        count: own.length,
      };
    });
  }, [supData, expData]);

  const sorted = [...aggregates].sort((a, b) => b.totalSpent - a.totalSpent);
  const isLoading = supLoading || expLoading;

  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-lg font-semibold text-[#2D2A26]">
          Gastos por proveedor
        </h2>
        <p className="text-sm text-[#8A8580]">
          Resumen de gastos vinculados a cada proveedor
        </p>
      </div>

      {isLoading ? (
        <div className="glass-card p-8 text-center text-sm text-[#8A8580]">
          Cargando proveedores...
        </div>
      ) : sorted.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <Building2 className="mx-auto mb-3 h-10 w-10 text-[#8A8580]" />
          <p className="text-sm text-[#8A8580]">No hay proveedores</p>
          <p className="mt-1 text-xs text-[#8A8580]">
            Crea proveedores en la seccion Proveedores para vincularlos a gastos
          </p>
        </div>
      ) : (
        <div className="overflow-hidden glass-card">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#E8E4DE] bg-[#FAF9F7]/50">
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-[#8A8580]">
                    Proveedor
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-[#8A8580]">
                    Gastos
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-[#8A8580]">
                    Total gastado
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-[#8A8580]">
                    Pendiente
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-[#8A8580]">
                    Ultimo pago
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E4DE]">
                {sorted.map((s) => (
                  <tr
                    key={s.id}
                    className="transition-colors hover:bg-[#FAF9F7]/30"
                  >
                    <td className="px-6 py-4 text-sm font-medium text-[#2D2A26]">
                      {s.name}
                    </td>
                    <td className="px-6 py-4 text-center text-sm text-[#8A8580]">
                      {s.count}
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-medium text-[#2D2A26]">
                      {fmt.format(s.totalSpent)}
                    </td>
                    <td className="px-6 py-4 text-right text-sm">
                      {s.outstanding > 0 ? (
                        <span className="font-medium text-[#D4A853]">
                          {fmt.format(s.outstanding)}
                        </span>
                      ) : (
                        <span className="text-[#8A8580]">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-[#8A8580]">
                      {formatDate(s.lastPayment)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
