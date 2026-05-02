"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, Building2, X, Check } from "lucide-react";
import { toast } from "sonner";
import {
  useCostCenters,
  useCreateCostCenter,
  useUpdateCostCenter,
  useDeleteCostCenter,
} from "@/hooks/useFinance";
import type { CostCenter } from "@/hooks/useFinance";
import { PageSkeleton } from "@/components/shared/LoadingSkeleton";

const inputCls =
  "w-full rounded-[10px] border border-[#E8E4DE] px-3 py-2 text-sm text-[#2D2A26] placeholder:text-[#8A8580] focus:border-[#E87B5A] focus:outline-none focus:ring-1 focus:ring-[#E87B5A]";

export default function CostCentersSection() {
  const { data, isLoading } = useCostCenters();
  const createCC = useCreateCostCenter();
  const updateCC = useUpdateCostCenter();
  const deleteCC = useDeleteCostCenter();

  const [addMode, setAddMode] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [active, setActive] = useState(true);

  if (isLoading) return <PageSkeleton />;
  const items = data?.costCenters || [];

  const resetForm = () => { setName(""); setCode(""); setActive(true); setAddMode(false); setEditId(null); };

  const startEdit = (cc: CostCenter) => {
    setEditId(cc.id); setName(cc.name); setCode(cc.code); setActive(cc.active); setAddMode(false);
  };

  const handleSave = async () => {
    if (!name.trim() || !code.trim()) { toast.error("Nombre y codigo son obligatorios"); return; }
    try {
      if (editId) {
        await updateCC.mutateAsync({ id: editId, name, code, active });
        toast.success("Centro de coste actualizado");
      } else {
        await createCC.mutateAsync({ name, code, active });
        toast.success("Centro de coste creado");
      }
      resetForm();
    } catch { toast.error("Error al guardar centro de coste"); }
  };

  const handleDelete = async (cc: CostCenter) => {
    if (!confirm(`Eliminar "${cc.name}"?`)) return;
    try { await deleteCC.mutateAsync(cc.id); toast.success("Centro de coste eliminado"); }
    catch { toast.error("Error al eliminar centro de coste"); }
  };

  const renderEditRow = (key: string) => (
    <tr key={key} className="bg-[#FAF9F7]/50">
      <td className="px-6 py-3"><input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} placeholder="Nombre del centro" autoFocus={!editId} /></td>
      <td className="px-6 py-3"><input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} className={inputCls} placeholder="CODIGO" /></td>
      <td className="px-6 py-3 text-center"><input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} className="h-4 w-4 rounded border-[#E8E4DE] text-[#E87B5A] focus:ring-[#E87B5A]" /></td>
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
          <Building2 className="h-5 w-5 text-[#E87B5A]" />
          <h3 className="text-base font-semibold text-[#2D2A26]">Centros de coste</h3>
        </div>
        {!addMode && (
          <button onClick={() => { resetForm(); setAddMode(true); }} className="flex items-center gap-2 rounded-[10px] bg-[#E87B5A] px-3 py-2 text-sm font-medium text-white hover:bg-[#D56E4F] transition-colors">
            <Plus className="h-4 w-4" /> Añadir
          </button>
        )}
      </div>

      <div className="rounded-2xl bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#E8E4DE] bg-[#FAF9F7]/50">
                <th className="px-6 py-3 text-left text-xs font-medium text-[#8A8580] uppercase tracking-wider">Nombre</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#8A8580] uppercase tracking-wider">Codigo</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-[#8A8580] uppercase tracking-wider">Activo</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-[#8A8580] uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8E4DE]">
              {items.map((cc) =>
                editId === cc.id ? renderEditRow(cc.id) : (
                  <tr key={cc.id} className="hover:bg-[#FAF9F7]/30 transition-colors">
                    <td className="px-6 py-4"><span className="font-medium text-sm text-[#2D2A26]">{cc.name}</span></td>
                    <td className="px-6 py-4"><span className="rounded-[6px] bg-[#FAF9F7] px-2 py-0.5 text-xs font-mono text-[#8A8580]">{cc.code}</span></td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex rounded-[6px] px-2 py-0.5 text-xs font-medium ${cc.active ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>
                        {cc.active ? "Si" : "No"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => startEdit(cc)} className="rounded-[10px] p-1.5 text-[#8A8580] hover:bg-[#FAF9F7] hover:text-[#E87B5A] transition-colors" title="Editar"><Pencil className="h-4 w-4" /></button>
                        <button onClick={() => handleDelete(cc)} className="rounded-[10px] p-1.5 text-[#8A8580] hover:bg-red-50 hover:text-[#C75D4A] transition-colors" title="Eliminar"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </td>
                  </tr>
                )
              )}
              {addMode && renderEditRow("new")}
              {items.length === 0 && !addMode && (
                <tr><td colSpan={4} className="px-6 py-8 text-center text-sm text-[#8A8580]">No hay centros de coste creados</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
