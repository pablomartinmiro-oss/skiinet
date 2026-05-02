"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, Truck } from "lucide-react";
import { toast } from "sonner";
import {
  useSuppliers,
  useSettlements,
  useCreateSupplier,
  useUpdateSupplier,
  useDeleteSupplier,
} from "@/hooks/useSuppliers";
import type { Supplier } from "@/hooks/useSuppliers";
import { PageSkeleton } from "@/components/shared/LoadingSkeleton";
import SupplierFormModal, {
  emptyForm,
  fromSupplier,
  type SupplierFormData,
} from "./SupplierFormModal";

const statusBadge: Record<string, string> = {
  active: "bg-emerald-50 text-emerald-700",
  inactive: "bg-gray-100 text-gray-500",
  blocked: "bg-red-50 text-[#C75D4A]",
};

const statusLabel: Record<string, string> = {
  active: "Activo",
  inactive: "Inactivo",
  blocked: "Bloqueado",
};

const paymentLabel: Record<string, string> = {
  transfer: "Transferencia",
  card: "Tarjeta",
};

const freqLabel: Record<string, string> = {
  biweekly: "Quincenal",
  monthly: "Mensual",
  quarterly: "Trimestral",
};

const commTypeLabel: Record<string, string> = {
  percentage: "Porcentaje",
  fixed: "Coste fijo/pax",
  margin: "Margen",
  hybrid: "Híbrido",
};

const fmt = new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" });

function commissionDisplay(s: Supplier): string {
  switch (s.commissionType) {
    case "fixed":
      return `${s.fixedCostPerUnit ?? 0} EUR/pax`;
    case "margin":
      return `${s.marginPercentage ?? 0}%`;
    case "hybrid":
      return `${s.commissionPercentage}% + ${s.fixedCostPerUnit ?? 0} EUR/pax`;
    default:
      return `${s.commissionPercentage}%`;
  }
}

export default function SuppliersTab() {
  const { data, isLoading } = useSuppliers();
  const { data: setData } = useSettlements();
  const createSup = useCreateSupplier();
  const updateSup = useUpdateSupplier();
  const deleteSup = useDeleteSupplier();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [form, setForm] = useState<SupplierFormData>(emptyForm);

  if (isLoading) return <PageSkeleton />;
  const suppliers = data?.suppliers || [];
  const allSettlements = setData?.settlements || [];

  function pendingAmount(supplierId: string): number {
    return allSettlements
      .filter((s) => s.supplierId === supplierId && s.status !== "paid")
      .reduce((acc, s) => acc + s.netAmount, 0);
  }

  const handleAdd = () => {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  };
  const handleEdit = (s: Supplier) => {
    setEditing(s);
    setForm(fromSupplier(s));
    setModalOpen(true);
  };
  const handleDelete = async (s: Supplier) => {
    if (!confirm(`Eliminar proveedor "${s.fiscalName}"?`)) return;
    try {
      await deleteSup.mutateAsync(s.id);
      toast.success("Proveedor eliminado");
    } catch {
      toast.error("Error al eliminar proveedor");
    }
  };
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...form,
      commercialName: form.commercialName || null,
      iban: form.iban || null,
      email: form.email || null,
      phone: form.phone || null,
      fixedCostPerUnit: form.fixedCostPerUnit || null,
      marginPercentage: form.marginPercentage || null,
    };
    try {
      if (editing) {
        await updateSup.mutateAsync({ id: editing.id, ...payload });
        toast.success("Proveedor actualizado");
      } else {
        await createSup.mutateAsync(payload);
        toast.success("Proveedor creado");
      }
      setModalOpen(false);
    } catch {
      toast.error("Error al guardar proveedor");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-[#8A8580]">
          {suppliers.length} proveedor{suppliers.length !== 1 ? "es" : ""}
        </p>
        <button
          onClick={handleAdd}
          className="flex items-center gap-2 rounded-[10px] bg-[#E87B5A] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#D56E4F] transition-colors"
        >
          <Plus className="h-4 w-4" />
          Añadir Proveedor
        </button>
      </div>

      {suppliers.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <Truck className="mx-auto h-10 w-10 text-[#8A8580] mb-3" />
          <p className="text-sm text-[#8A8580]">No hay proveedores creados</p>
          <p className="text-xs text-[#8A8580] mt-1">
            Crea tu primer proveedor para gestionar liquidaciones
          </p>
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#E8E4DE] bg-[#FAF9F7]/50">
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#8A8580] uppercase tracking-wider">
                    Nombre fiscal
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#8A8580] uppercase tracking-wider">
                    NIF
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-[#8A8580] uppercase tracking-wider">
                    Comisión
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#8A8580] uppercase tracking-wider">
                    Método pago
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#8A8580] uppercase tracking-wider">
                    Frecuencia
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-[#8A8580] uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-[#8A8580] uppercase tracking-wider">
                    Pendiente
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-[#8A8580] uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E4DE]">
                {suppliers.map((s) => {
                  const pending = pendingAmount(s.id);
                  return (
                    <tr
                      key={s.id}
                      className="hover:bg-[#FAF9F7]/30 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Truck className="h-4 w-4 text-[#8A8580]" />
                          <div>
                            <span className="font-medium text-sm text-[#2D2A26]">
                              {s.fiscalName}
                            </span>
                            {s.commercialName && (
                              <p className="text-xs text-[#8A8580]">
                                {s.commercialName}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="rounded-[6px] bg-[#FAF9F7] px-2 py-0.5 text-xs font-mono text-[#8A8580]">
                          {s.nif}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center text-sm text-[#2D2A26]">
                        <span className="text-xs text-[#8A8580]">
                          {commTypeLabel[s.commissionType] ?? s.commissionType}
                        </span>{" "}
                        {commissionDisplay(s)}
                      </td>
                      <td className="px-6 py-4 text-sm text-[#8A8580]">
                        {paymentLabel[s.paymentMethod] || s.paymentMethod}
                      </td>
                      <td className="px-6 py-4 text-sm text-[#8A8580]">
                        {freqLabel[s.settlementFrequency] || s.settlementFrequency}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`inline-flex rounded-[6px] px-2 py-0.5 text-xs font-medium ${statusBadge[s.status] || "bg-gray-100 text-gray-500"}`}
                        >
                          {statusLabel[s.status] || s.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-medium">
                        {pending > 0 ? (
                          <span className="text-[#D4A853]">{fmt.format(pending)}</span>
                        ) : (
                          <span className="text-[#8A8580]">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEdit(s)}
                            className="rounded-[10px] p-1.5 text-[#8A8580] hover:bg-[#FAF9F7] hover:text-[#E87B5A] transition-colors"
                            title="Editar"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(s)}
                            className="rounded-[10px] p-1.5 text-[#8A8580] hover:bg-red-50 hover:text-[#C75D4A] transition-colors"
                            title="Eliminar"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {modalOpen && (
        <SupplierFormModal
          editing={editing}
          form={form}
          setForm={setForm}
          onClose={() => setModalOpen(false)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
