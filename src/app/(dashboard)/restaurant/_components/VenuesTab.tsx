"use client";

import { useState, Fragment } from "react";
import { Plus, Pencil, Trash2, ChevronDown, ChevronRight, UtensilsCrossed } from "lucide-react";
import { toast } from "sonner";
import {
  useRestaurants, useCreateRestaurant, useUpdateRestaurant, useDeleteRestaurant,
} from "@/hooks/useRestaurant";
import type { Restaurant } from "@/hooks/useRestaurant";
import { PageSkeleton } from "@/components/shared/LoadingSkeleton";
import RestaurantModal from "./RestaurantModal";
import type { RestaurantFormData } from "./RestaurantModal";
import ShiftsClosuresPanel from "./ShiftsClosuresPanel";

const DAY_LABELS = ["D", "L", "M", "X", "J", "V", "S"];
const fmt = new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" });

function formatDays(days: number[]) {
  return DAY_LABELS.map((lbl, i) => (
    <span key={i} className={`text-xs font-medium ${days.includes(i) ? "text-[#2D2A26]" : "text-[#E8E4DE]"}`}>
      {lbl}
    </span>
  ));
}

export default function VenuesTab() {
  const { data, isLoading } = useRestaurants();
  const createRest = useCreateRestaurant();
  const updateRest = useUpdateRestaurant();
  const deleteRest = useDeleteRestaurant();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Restaurant | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (isLoading) return <PageSkeleton />;

  const restaurants = data?.restaurants || [];

  const handleAdd = () => { setEditing(null); setModalOpen(true); };
  const handleEdit = (r: Restaurant) => { setEditing(r); setModalOpen(true); };

  const handleDelete = async (r: Restaurant) => {
    if (!confirm(`Eliminar el restaurante "${r.title}"?`)) return;
    try { await deleteRest.mutateAsync(r.id); toast.success("Restaurante eliminado"); }
    catch { toast.error("Error al eliminar restaurante"); }
  };

  const handleSave = async (d: RestaurantFormData & { id?: string }) => {
    try {
      if (d.id) {
        await updateRest.mutateAsync({ id: d.id, ...d });
        toast.success("Restaurante actualizado");
      } else {
        await createRest.mutateAsync(d);
        toast.success("Restaurante creado");
      }
      setModalOpen(false);
    } catch { toast.error("Error al guardar restaurante"); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-[#8A8580]">
          {restaurants.length} restaurante{restaurants.length !== 1 ? "s" : ""}
        </p>
        <button onClick={handleAdd} className="flex items-center gap-2 rounded-[10px] bg-[#E87B5A] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#D56E4F] transition-colors">
          <Plus className="h-4 w-4" /> Añadir Restaurante
        </button>
      </div>

      {restaurants.length === 0 ? (
        <div className="rounded-2xl bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-12 text-center">
          <UtensilsCrossed className="mx-auto h-10 w-10 text-[#8A8580] mb-3" />
          <p className="text-sm text-[#8A8580]">No hay restaurantes creados</p>
          <p className="text-xs text-[#8A8580] mt-1">Crea tu primer restaurante para gestionar turnos y reservas</p>
        </div>
      ) : (
        <div className="rounded-2xl bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#E8E4DE] bg-[#FAF9F7]/50">
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#8A8580] uppercase tracking-wider w-8"></th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#8A8580] uppercase tracking-wider">Nombre</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-[#8A8580] uppercase tracking-wider">Capacidad</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-[#8A8580] uppercase tracking-wider">Depósito/persona</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-[#8A8580] uppercase tracking-wider">Dias operacion</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-[#8A8580] uppercase tracking-wider">Estado</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-[#8A8580] uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E4DE]">
                {restaurants.map((r) => (
                  <Fragment key={r.id}>
                    <tr className="hover:bg-[#FAF9F7]/30 transition-colors">
                      <td className="px-6 py-4">
                        <button onClick={() => setExpandedId(expandedId === r.id ? null : r.id)} className="text-[#8A8580] hover:text-[#2D2A26]">
                          {expandedId === r.id ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <UtensilsCrossed className="h-4 w-4 text-[#8A8580]" />
                          <span className="font-medium text-sm text-[#2D2A26]">{r.title}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center text-sm text-[#8A8580]">{r.capacity}</td>
                      <td className="px-6 py-4 text-right text-sm text-[#2D2A26]">{fmt.format(r.depositPerGuest ?? 0)}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-1">{formatDays(r.operatingDays)}</div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex rounded-[6px] px-2 py-0.5 text-xs font-medium ${r.active ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>
                          {r.active ? "Activo" : "Inactivo"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => handleEdit(r)} className="rounded-[10px] p-1.5 text-[#8A8580] hover:bg-[#FAF9F7] hover:text-[#E87B5A] transition-colors" title="Editar">
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button onClick={() => handleDelete(r)} className="rounded-[10px] p-1.5 text-[#8A8580] hover:bg-red-50 hover:text-[#C75D4A] transition-colors" title="Eliminar">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                    {expandedId === r.id && (
                      <tr>
                        <td colSpan={7} className="p-0">
                          <ShiftsClosuresPanel restaurant={r} />
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <RestaurantModal key={editing?.id ?? "new"} restaurant={editing} isOpen={modalOpen} onClose={() => setModalOpen(false)} onSave={handleSave} />
    </div>
  );
}
