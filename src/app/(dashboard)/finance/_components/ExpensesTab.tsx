"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, Receipt, X } from "lucide-react";
import { toast } from "sonner";
import {
  useExpenses,
  useExpenseCategories,
  useCostCenters,
  useCreateExpense,
  useUpdateExpense,
  useDeleteExpense,
} from "@/hooks/useFinance";
import type { Expense } from "@/hooks/useFinance";
import { PageSkeleton } from "@/components/shared/LoadingSkeleton";

const STATUS_STYLE: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700",
  justified: "bg-blue-50 text-blue-700",
  accounted: "bg-emerald-50 text-emerald-700",
};
const STATUS_LABEL: Record<string, string> = {
  pending: "Pendiente",
  justified: "Justificado",
  accounted: "Contabilizado",
};
const METHOD_LABEL: Record<string, string> = {
  cash: "Efectivo",
  card: "Tarjeta",
  transfer: "Transferencia",
  direct_debit: "Domiciliacion",
};

const fmt = new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" });
const inputCls =
  "w-full rounded-[10px] border border-[#E8E4DE] px-3 py-2 text-sm text-[#2D2A26] placeholder:text-[#8A8580] focus:border-[#E87B5A] focus:outline-none focus:ring-1 focus:ring-[#E87B5A]";
const selectCls =
  "rounded-[10px] border border-[#E8E4DE] px-3 py-2 text-sm text-[#2D2A26] focus:border-[#E87B5A] focus:outline-none focus:ring-1 focus:ring-[#E87B5A]";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" });
}

interface ExpForm {
  date: string; categoryId: string; costCenterId: string;
  concept: string; amount: number; paymentMethod: string; status: string;
}

const emptyForm = (): ExpForm => ({
  date: new Date().toISOString().slice(0, 10),
  categoryId: "", costCenterId: "", concept: "", amount: 0,
  paymentMethod: "transfer", status: "pending",
});

export default function ExpensesTab() {
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const { data, isLoading } = useExpenses(
    categoryFilter || undefined, undefined, statusFilter || undefined
  );
  const { data: catData } = useExpenseCategories();
  const { data: ccData } = useCostCenters();
  const createExpense = useCreateExpense();
  const updateExpense = useUpdateExpense();
  const deleteExpense = useDeleteExpense();

  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<ExpForm>(emptyForm);

  if (isLoading) return <PageSkeleton />;

  const expenses = data?.expenses || [];
  const categories = catData?.categories || [];
  const costCenters = ccData?.costCenters || [];

  // Client-side date range filter
  const filtered = expenses.filter((exp) => {
    if (fromDate && new Date(exp.date) < new Date(fromDate)) return false;
    if (toDate && new Date(exp.date) > new Date(toDate)) return false;
    return true;
  });

  const handleAdd = () => {
    setEditId(null);
    setForm({ ...emptyForm(), categoryId: categories[0]?.id || "" });
    setModalOpen(true);
  };

  const handleEdit = (exp: Expense) => {
    setEditId(exp.id);
    setForm({
      date: exp.date.slice(0, 10), categoryId: exp.categoryId,
      costCenterId: exp.costCenterId || "", concept: exp.concept,
      amount: exp.amount, paymentMethod: exp.paymentMethod, status: exp.status,
    });
    setModalOpen(true);
  };

  const handleDelete = async (exp: Expense) => {
    if (!confirm(`Eliminar gasto "${exp.concept}"?`)) return;
    try {
      await deleteExpense.mutateAsync(exp.id);
      toast.success("Gasto eliminado");
    } catch { toast.error("Error al eliminar gasto"); }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.concept.trim() || !form.categoryId) {
      toast.error("Concepto y categoria son obligatorios");
      return;
    }
    const payload = { ...form, amount: Number(form.amount), costCenterId: form.costCenterId || null };
    try {
      if (editId) {
        await updateExpense.mutateAsync({ id: editId, ...payload });
        toast.success("Gasto actualizado");
      } else {
        await createExpense.mutateAsync(payload);
        toast.success("Gasto creado");
      }
      setModalOpen(false);
    } catch { toast.error("Error al guardar gasto"); }
  };

  const isPending = createExpense.isPending || updateExpense.isPending;

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className={selectCls}>
            <option value="">Todas las categorias</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={selectCls}>
            <option value="">Todos los estados</option>
            <option value="pending">Pendiente</option>
            <option value="justified">Justificado</option>
            <option value="accounted">Contabilizado</option>
          </select>
          <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className={selectCls} title="Desde" />
          <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className={selectCls} title="Hasta" />
          <p className="text-sm text-[#8A8580]">{filtered.length} gasto{filtered.length !== 1 ? "s" : ""}</p>
        </div>
        <button onClick={handleAdd} className="flex items-center gap-2 rounded-[10px] bg-[#E87B5A] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#D56E4F] transition-colors">
          <Plus className="h-4 w-4" /> Nuevo Gasto
        </button>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <Receipt className="mx-auto h-10 w-10 text-[#8A8580] mb-3" />
          <p className="text-sm text-[#8A8580]">No hay gastos registrados</p>
          <p className="text-xs text-[#8A8580] mt-1">Registra tu primer gasto para llevar el control financiero</p>
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#E8E4DE] bg-[#FAF9F7]/50">
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#8A8580] uppercase tracking-wider">Fecha</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#8A8580] uppercase tracking-wider">Concepto</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#8A8580] uppercase tracking-wider">Categoria</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-[#8A8580] uppercase tracking-wider">Importe</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#8A8580] uppercase tracking-wider">Método pago</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-[#8A8580] uppercase tracking-wider">Estado</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-[#8A8580] uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E4DE]">
                {filtered.map((exp) => (
                  <tr key={exp.id} className="hover:bg-[#FAF9F7]/30 transition-colors">
                    <td className="px-6 py-4 text-sm text-[#8A8580]">{formatDate(exp.date)}</td>
                    <td className="px-6 py-4"><span className="font-medium text-sm text-[#2D2A26]">{exp.concept}</span></td>
                    <td className="px-6 py-4 text-sm text-[#8A8580]">{exp.category?.name || "—"}</td>
                    <td className="px-6 py-4 text-right text-sm font-medium text-[#2D2A26]">{fmt.format(exp.amount)}</td>
                    <td className="px-6 py-4 text-sm text-[#8A8580]">{METHOD_LABEL[exp.paymentMethod] || exp.paymentMethod}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex rounded-[6px] px-2 py-0.5 text-xs font-medium ${STATUS_STYLE[exp.status] || "bg-gray-100 text-gray-600"}`}>
                        {STATUS_LABEL[exp.status] || exp.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => handleEdit(exp)} className="rounded-[10px] p-1.5 text-[#8A8580] hover:bg-[#FAF9F7] hover:text-[#E87B5A] transition-colors" title="Editar">
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleDelete(exp)} className="rounded-[10px] p-1.5 text-[#8A8580] hover:bg-red-50 hover:text-[#C75D4A] transition-colors" title="Eliminar">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Expense Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-[#E8E4DE] px-6 py-4">
              <h2 className="text-lg font-semibold text-[#2D2A26]">{editId ? "Editar Gasto" : "Nuevo Gasto"}</h2>
              <button onClick={() => setModalOpen(false)} className="rounded-[10px] p-1.5 text-[#8A8580] hover:bg-[#FAF9F7] transition-colors"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleSave} className="space-y-4 p-6">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-[#2D2A26] mb-1">Fecha</label><input type="date" value={form.date} onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))} className={inputCls} required /></div>
                <div><label className="block text-sm font-medium text-[#2D2A26] mb-1">Categoria</label><select value={form.categoryId} onChange={(e) => setForm((p) => ({ ...p, categoryId: e.target.value }))} className={inputCls} required><option value="">Seleccionar...</option>{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
              </div>
              <div><label className="block text-sm font-medium text-[#2D2A26] mb-1">Concepto</label><input type="text" value={form.concept} onChange={(e) => setForm((p) => ({ ...p, concept: e.target.value }))} className={inputCls} placeholder="Descripción del gasto" required /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-[#2D2A26] mb-1">Centro de coste</label><select value={form.costCenterId} onChange={(e) => setForm((p) => ({ ...p, costCenterId: e.target.value }))} className={inputCls}><option value="">Ninguno</option>{costCenters.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
                <div><label className="block text-sm font-medium text-[#2D2A26] mb-1">Importe (EUR)</label><input type="number" min="0" step="0.01" value={form.amount} onChange={(e) => setForm((p) => ({ ...p, amount: parseFloat(e.target.value) || 0 }))} className={inputCls} required /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-[#2D2A26] mb-1">Método pago</label><select value={form.paymentMethod} onChange={(e) => setForm((p) => ({ ...p, paymentMethod: e.target.value }))} className={inputCls}><option value="transfer">Transferencia</option><option value="card">Tarjeta</option><option value="cash">Efectivo</option><option value="direct_debit">Domiciliacion</option></select></div>
                <div><label className="block text-sm font-medium text-[#2D2A26] mb-1">Estado</label><select value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))} className={inputCls}><option value="pending">Pendiente</option><option value="justified">Justificado</option><option value="accounted">Contabilizado</option></select></div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setModalOpen(false)} className="rounded-[10px] border border-[#E8E4DE] px-4 py-2 text-sm font-medium text-[#8A8580] hover:bg-[#FAF9F7] transition-colors">Cancelar</button>
                <button type="submit" disabled={isPending} className="rounded-[10px] bg-[#E87B5A] px-4 py-2 text-sm font-medium text-white hover:bg-[#D56E4F] transition-colors disabled:opacity-50">{isPending ? "Guardando..." : editId ? "Guardar Cambios" : "Crear Gasto"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
