"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Trash2, Plus, ChevronDown, ChevronRight, Check, Clock, FileText } from "lucide-react";
import type { PayrollRecord } from "@/hooks/usePayroll";
import { useUpdatePayroll, useDeletePayroll, useCreatePayrollExtra, useDeletePayrollExtra } from "@/hooks/usePayroll";

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-[#8A8580]/15 text-[#8A8580]",
  approved: "bg-[#D4A853]/15 text-[#D4A853]",
  paid: "bg-[#5B8C6D]/15 text-[#5B8C6D]",
};
const TYPE_LABELS: Record<string, string> = {
  bonus: "Bonus",
  deduction: "Deduccion",
  commission: "Comision",
  overtime: "Horas extra",
};

const inputCls =
  "w-full rounded-[10px] border border-[#E8E4DE] px-3 py-2 text-sm text-[#2D2A26] placeholder:text-[#8A8580] focus:border-[#E87B5A] focus:outline-none focus:ring-1 focus:ring-[#E87B5A]";

interface Props { records: PayrollRecord[] }

export default function PayrollTable({ records }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [extraForm, setExtraForm] = useState({ concept: "", type: "bonus", amount: "" });
  const updatePay = useUpdatePayroll();
  const deletePay = useDeletePayroll();
  const addExtra = useCreatePayrollExtra();
  const delExtra = useDeletePayrollExtra();

  if (records.length === 0) {
    return (
      <div className="glass-card p-12 text-center">
        <FileText className="mx-auto h-10 w-10 text-[#8A8580] mb-3" />
        <p className="text-sm text-[#8A8580]">No hay nominas para este mes</p>
        <p className="text-xs text-[#8A8580] mt-1">Crea una nomina para empezar</p>
      </div>
    );
  }

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await updatePay.mutateAsync({ id, status });
      toast.success("Estado actualizado");
    } catch { toast.error("Error al cambiar estado"); }
  };

  const handleDelete = async (r: PayrollRecord) => {
    if (!confirm(`Eliminar la nomina de ${r.user.name ?? r.user.email}?`)) return;
    try {
      await deletePay.mutateAsync(r.id);
      toast.success("Nomina eliminada");
    } catch { toast.error("Error al eliminar nomina"); }
  };

  const handleAddExtra = async (payrollId: string) => {
    if (!extraForm.concept || !extraForm.amount) return;
    try {
      await addExtra.mutateAsync({
        payrollId,
        concept: extraForm.concept,
        type: extraForm.type,
        amount: parseFloat(extraForm.amount),
      });
      setExtraForm({ concept: "", type: "bonus", amount: "" });
      toast.success("Extra anadido");
    } catch { toast.error("Error al anadir extra"); }
  };

  const handleDeleteExtra = async (payrollId: string, extraId: string) => {
    try {
      await delExtra.mutateAsync({ payrollId, extraId });
      toast.success("Extra eliminado");
    } catch { toast.error("Error al eliminar extra"); }
  };

  const fmtEur = (n: number) => n.toLocaleString("es-ES", { style: "currency", currency: "EUR" });

  return (
    <div className="space-y-3">
      {records.map((r) => {
        const isExpanded = expandedId === r.id;
        return (
          <div key={r.id} className="rounded-2xl border border-[#E8E4DE] bg-white overflow-hidden">
            <div className="flex items-center gap-3 px-5 py-4">
              <button onClick={() => setExpandedId(isExpanded ? null : r.id)} className="text-[#8A8580]">
                {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </button>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[#2D2A26] truncate">
                  {r.user.name ?? r.user.email}
                </p>
                <p className="text-xs text-[#8A8580]">{r.user.email}</p>
              </div>
              <div className="hidden sm:flex items-center gap-4 text-sm">
                <span className="text-[#8A8580]">Base: {fmtEur(r.baseSalary)}</span>
                {r.totalExtras !== 0 && (
                  <span className={r.totalExtras > 0 ? "text-[#5B8C6D]" : "text-[#C75D4A]"}>
                    Extras: {r.totalExtras > 0 ? "+" : ""}{fmtEur(r.totalExtras)}
                  </span>
                )}
                <span className="font-semibold text-[#2D2A26]">{fmtEur(r.totalAmount)}</span>
              </div>
              <select
                value={r.status}
                onChange={(e) => handleStatusChange(r.id, e.target.value)}
                className={`shrink-0 rounded-md px-2.5 py-1 text-xs font-medium border-0 cursor-pointer ${STATUS_COLORS[r.status] ?? ""}`}
              >
                <option value="draft">Borrador</option>
                <option value="approved">Aprobada</option>
                <option value="paid">Pagada</option>
              </select>
              <button onClick={() => handleDelete(r)} className="rounded-[10px] p-1.5 text-[#8A8580] hover:bg-red-50 hover:text-[#C75D4A] transition-colors">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>

            {/* Mobile summary */}
            <div className="sm:hidden px-5 pb-3 flex items-center gap-3 text-xs text-[#8A8580]">
              <span>Base: {fmtEur(r.baseSalary)}</span>
              <span className="font-semibold text-[#2D2A26]">Total: {fmtEur(r.totalAmount)}</span>
            </div>

            {isExpanded && (
              <div className="border-t border-[#E8E4DE] px-5 py-4 bg-[#FAF9F7] space-y-3">
                {/* Existing extras */}
                {r.extras.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-[#8A8580] uppercase">Extras</p>
                    {r.extras.map((e) => (
                      <div key={e.id} className="flex items-center justify-between rounded-lg bg-white border border-[#E8E4DE] px-3 py-2">
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex rounded-[6px] px-2 py-0.5 text-xs font-medium ${
                            e.type === "deduction" ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"
                          }`}>
                            {TYPE_LABELS[e.type] ?? e.type}
                          </span>
                          <span className="text-sm text-[#2D2A26]">{e.concept}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-medium ${e.type === "deduction" ? "text-[#C75D4A]" : "text-[#5B8C6D]"}`}>
                            {e.type === "deduction" ? "-" : "+"}{fmtEur(e.amount)}
                          </span>
                          <button onClick={() => handleDeleteExtra(r.id, e.id)} className="text-[#8A8580] hover:text-[#C75D4A]">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add extra form */}
                <div className="flex flex-wrap items-end gap-2">
                  <div className="flex-1 min-w-[120px]">
                    <label className="text-xs font-medium text-[#8A8580] mb-1 block">Concepto</label>
                    <input type="text" value={extraForm.concept} onChange={(e) => setExtraForm(p => ({ ...p, concept: e.target.value }))} className={inputCls} placeholder="Bonus navidad..." />
                  </div>
                  <div className="w-32">
                    <label className="text-xs font-medium text-[#8A8580] mb-1 block">Tipo</label>
                    <select value={extraForm.type} onChange={(e) => setExtraForm(p => ({ ...p, type: e.target.value }))} className={inputCls}>
                      <option value="bonus">Bonus</option>
                      <option value="deduction">Deduccion</option>
                      <option value="commission">Comision</option>
                      <option value="overtime">Horas extra</option>
                    </select>
                  </div>
                  <div className="w-28">
                    <label className="text-xs font-medium text-[#8A8580] mb-1 block">Importe</label>
                    <input type="number" step="0.01" value={extraForm.amount} onChange={(e) => setExtraForm(p => ({ ...p, amount: e.target.value }))} className={inputCls} placeholder="0,00" />
                  </div>
                  <button
                    onClick={() => handleAddExtra(r.id)}
                    disabled={addExtra.isPending}
                    className="rounded-[10px] bg-[#E87B5A] px-3 py-2 text-sm font-medium text-white hover:bg-[#D56E4F] disabled:opacity-50 transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>

                {/* Status info */}
                <div className="flex items-center gap-4 text-xs text-[#8A8580] pt-2">
                  {r.status === "paid" && r.paidAt && (
                    <span className="flex items-center gap-1">
                      <Check className="h-3 w-3 text-[#5B8C6D]" />
                      Pagada el {new Date(r.paidAt).toLocaleDateString("es-ES")}
                    </span>
                  )}
                  {r.notes && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {r.notes}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
