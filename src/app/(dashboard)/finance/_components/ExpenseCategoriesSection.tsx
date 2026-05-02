"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, Tag, X, Check } from "lucide-react";
import { toast } from "sonner";
import {
  useExpenseCategories,
  useCreateExpenseCategory,
  useUpdateExpenseCategory,
  useDeleteExpenseCategory,
} from "@/hooks/useFinance";
import type { ExpenseCategory } from "@/hooks/useFinance";
import { PageSkeleton } from "@/components/shared/LoadingSkeleton";

const inputCls =
  "w-full rounded-[10px] border border-[#E8E4DE] px-3 py-2 text-sm text-[#2D2A26] placeholder:text-[#8A8580] focus:border-[#E87B5A] focus:outline-none focus:ring-1 focus:ring-[#E87B5A]";

export default function ExpenseCategoriesSection() {
  const { data, isLoading } = useExpenseCategories();
  const createEC = useCreateExpenseCategory();
  const updateEC = useUpdateExpenseCategory();
  const deleteEC = useDeleteExpenseCategory();

  const [addMode, setAddMode] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");

  if (isLoading) return <PageSkeleton />;
  const items = data?.categories || [];

  const resetForm = () => { setName(""); setCode(""); setAddMode(false); setEditId(null); };

  const startEdit = (ec: ExpenseCategory) => {
    setEditId(ec.id); setName(ec.name); setCode(ec.code); setAddMode(false);
  };

  const handleSave = async () => {
    if (!name.trim() || !code.trim()) { toast.error("Nombre y codigo son obligatorios"); return; }
    try {
      if (editId) {
        await updateEC.mutateAsync({ id: editId, name, code });
        toast.success("Categoria actualizada");
      } else {
        await createEC.mutateAsync({ name, code });
        toast.success("Categoria creada");
      }
      resetForm();
    } catch { toast.error("Error al guardar categoria"); }
  };

  const handleDelete = async (ec: ExpenseCategory) => {
    if (!confirm(`Eliminar "${ec.name}"?`)) return;
    try { await deleteEC.mutateAsync(ec.id); toast.success("Categoria eliminada"); }
    catch { toast.error("Error al eliminar categoria"); }
  };

  const renderEditRow = (key: string) => (
    <tr key={key} className="bg-[#FAF9F7]/50">
      <td className="px-6 py-3"><input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} placeholder="Nombre de la categoria" autoFocus={!editId} /></td>
      <td className="px-6 py-3"><input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} className={inputCls} placeholder="CODIGO" /></td>
      <td className="px-6 py-3 text-right">
        <div className="flex items-center justify-end gap-2">
          <button onClick={handleSave} className="rounded-[10px] p-1.5 text-emerald-600 hover:bg-emerald-50 transition-colors"><Check className="h-4 w-4" /></button>
          <button onClick={resetForm} className="rounded-[10px] p-1.5 text-[#8A8580] hover:bg-[#FAF9F7] transition-colors"><X className="h-4 w-4" /></button>
        </div>
      </td>
    </tr>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Tag className="h-5 w-5 text-[#E87B5A]" />
          <h3 className="text-base font-semibold text-[#2D2A26]">Categorias de gasto</h3>
        </div>
        {!addMode && (
          <button onClick={() => { resetForm(); setAddMode(true); }} className="flex items-center gap-2 rounded-[10px] bg-[#E87B5A] px-3 py-2 text-sm font-medium text-white hover:bg-[#D56E4F] transition-colors">
            <Plus className="h-4 w-4" /> Añadir
          </button>
        )}
      </div>

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#E8E4DE] bg-[#FAF9F7]/50">
                <th className="px-6 py-3 text-left text-xs font-medium text-[#8A8580] uppercase tracking-wider">Nombre</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#8A8580] uppercase tracking-wider">Codigo</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-[#8A8580] uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8E4DE]">
              {items.map((ec) =>
                editId === ec.id ? renderEditRow(ec.id) : (
                  <tr key={ec.id} className="hover:bg-[#FAF9F7]/30 transition-colors">
                    <td className="px-6 py-4"><span className="font-medium text-sm text-[#2D2A26]">{ec.name}</span></td>
                    <td className="px-6 py-4"><span className="rounded-[6px] bg-[#FAF9F7] px-2 py-0.5 text-xs font-mono text-[#8A8580]">{ec.code}</span></td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => startEdit(ec)} className="rounded-[10px] p-1.5 text-[#8A8580] hover:bg-[#FAF9F7] hover:text-[#E87B5A] transition-colors" title="Editar"><Pencil className="h-4 w-4" /></button>
                        <button onClick={() => handleDelete(ec)} className="rounded-[10px] p-1.5 text-[#8A8580] hover:bg-red-50 hover:text-[#C75D4A] transition-colors" title="Eliminar"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </td>
                  </tr>
                )
              )}
              {addMode && renderEditRow("new")}
              {items.length === 0 && !addMode && (
                <tr><td colSpan={3} className="px-6 py-8 text-center text-sm text-[#8A8580]">No hay categorias de gasto creadas</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
