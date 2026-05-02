"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import {
  useRentalInventory,
  useCreateRentalInventory,
  useUpdateRentalInventory,
  useDeleteRentalInventory,
} from "@/hooks/useRental";
import type { RentalInventoryItem } from "@/hooks/useRental";
import { PageSkeleton } from "@/components/shared/LoadingSkeleton";

const inputCls =
  "w-full rounded-[10px] border border-[#E8E4DE] px-3 py-2 text-sm text-[#2D2A26] placeholder:text-[#8A8580] focus:border-[#E87B5A] focus:outline-none focus:ring-1 focus:ring-[#E87B5A]";

const EQUIP_TYPES = [
  { value: "SKI", label: "Esquis" },
  { value: "BOOT", label: "Botas" },
  { value: "POLE", label: "Bastones" },
  { value: "HELMET", label: "Casco" },
  { value: "SNOWBOARD", label: "Snowboard" },
  { value: "SNOWBOARD_BOOT", label: "Botas Snow" },
];

const STATIONS = [
  { value: "baqueira", label: "Baqueira Beret" },
  { value: "sierra_nevada", label: "Sierra Nevada" },
  { value: "la_pinilla", label: "La Pinilla" },
];

const TIERS = [
  { value: "media", label: "Media" },
  { value: "alta", label: "Alta" },
];

const CONDITIONS = [
  { value: "bueno", label: "Bueno", color: "#5B8C6D" },
  { value: "dañado", label: "Dañado", color: "#C75D4A" },
  { value: "mantenimiento", label: "Mantenimiento", color: "#D4A853" },
  { value: "baja", label: "Baja", color: "#8A8580" },
];

const dateFmt = new Intl.DateTimeFormat("es-ES", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

interface InvForm {
  stationSlug: string;
  equipmentType: string;
  size: string;
  qualityTier: string;
  totalQuantity: number;
  availableQuantity: number;
  minStockAlert: number;
  condition: string;
  lastMaintenanceAt: string;
  notes: string;
}

export default function InventoryTab() {
  const [filterStation, setFilterStation] = useState<string>("");
  const [filterType, setFilterType] = useState<string>("");
  const [filterTier, setFilterTier] = useState<string>("");
  const [filterCondition, setFilterCondition] = useState<string>("");
  const [editing, setEditing] = useState<RentalInventoryItem | null>(null);
  const [showModal, setShowModal] = useState(false);

  const { data, isLoading } = useRentalInventory(
    filterStation || undefined,
    filterType || undefined,
    filterTier || undefined
  );
  const createMut = useCreateRentalInventory();
  const updateMut = useUpdateRentalInventory();
  const deleteMut = useDeleteRentalInventory();

  if (isLoading) return <PageSkeleton />;

  const allInventory = data?.inventory ?? [];
  const inventory = filterCondition
    ? allInventory.filter((i) => i.condition === filterCondition)
    : allInventory;

  const handleSave = async (form: InvForm & { id?: string }) => {
    try {
      if (form.id) {
        await updateMut.mutateAsync({
          id: form.id,
          totalQuantity: form.totalQuantity,
          availableQuantity: form.availableQuantity,
          minStockAlert: form.minStockAlert,
          condition: form.condition,
          lastMaintenanceAt: form.lastMaintenanceAt || null,
          notes: form.notes || null,
        });
        toast.success("Inventario actualizado");
      } else {
        await createMut.mutateAsync({
          stationSlug: form.stationSlug,
          equipmentType: form.equipmentType,
          size: form.size,
          qualityTier: form.qualityTier,
          totalQuantity: form.totalQuantity,
          availableQuantity: form.availableQuantity,
          minStockAlert: form.minStockAlert,
          condition: form.condition,
          lastMaintenanceAt: form.lastMaintenanceAt || null,
          notes: form.notes || null,
        });
        toast.success("Inventario creado");
      }
      setShowModal(false);
      setEditing(null);
    } catch {
      toast.error("Error al guardar inventario");
    }
  };

  const handleQuickCondition = async (id: string, condition: string) => {
    try {
      await updateMut.mutateAsync({
        id,
        condition,
        ...(condition === "mantenimiento" && {
          lastMaintenanceAt: new Date().toISOString(),
        }),
      });
      toast.success("Estado actualizado");
    } catch {
      toast.error("Error al actualizar estado");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Eliminar esta entrada de inventario?")) return;
    try {
      await deleteMut.mutateAsync(id);
      toast.success("Entrada eliminada");
    } catch {
      toast.error("Error al eliminar");
    }
  };

  return (
    <div className="space-y-4">
      {/* Filters + action */}
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={filterStation}
          onChange={(e) => setFilterStation(e.target.value)}
          className={`${inputCls} w-auto`}
        >
          <option value="">Todas las estaciones</option>
          {STATIONS.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className={`${inputCls} w-auto`}
        >
          <option value="">Todos los tipos</option>
          {EQUIP_TYPES.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
        <select
          value={filterTier}
          onChange={(e) => setFilterTier(e.target.value)}
          className={`${inputCls} w-auto`}
        >
          <option value="">Todas las calidades</option>
          {TIERS.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
        <select
          value={filterCondition}
          onChange={(e) => setFilterCondition(e.target.value)}
          className={`${inputCls} w-auto`}
        >
          <option value="">Todas las condiciones</option>
          {CONDITIONS.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
        <div className="flex-1" />
        <button
          onClick={() => {
            setEditing(null);
            setShowModal(true);
          }}
          className="flex items-center gap-2 rounded-[10px] bg-[#E87B5A] px-4 py-2 text-sm font-medium text-white hover:bg-[#D56E4F] transition-colors"
        >
          <Plus className="h-4 w-4" /> Nuevo
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-[16px] border border-[#E8E4DE] bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#E8E4DE] text-left text-[#8A8580]">
              <th className="px-4 py-3 font-medium">Estacion</th>
              <th className="px-4 py-3 font-medium">Tipo</th>
              <th className="px-4 py-3 font-medium">Talla</th>
              <th className="px-4 py-3 font-medium">Calidad</th>
              <th className="px-4 py-3 font-medium text-right">Total</th>
              <th className="px-4 py-3 font-medium text-right">Disponible</th>
              <th className="px-4 py-3 font-medium">Estado</th>
              <th className="px-4 py-3 font-medium">Mantenim.</th>
              <th className="px-4 py-3 font-medium" />
            </tr>
          </thead>
          <tbody>
            {inventory.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-[#8A8580]">
                  Sin datos de inventario
                </td>
              </tr>
            )}
            {inventory.map((item) => {
              const isLow = item.availableQuantity <= item.minStockAlert;
              const condDef =
                CONDITIONS.find((c) => c.value === item.condition) ??
                CONDITIONS[0];
              return (
                <tr
                  key={item.id}
                  className="border-b border-[#E8E4DE] last:border-0 hover:bg-[#FAF9F7]"
                >
                  <td className="px-4 py-3">
                    {STATIONS.find((s) => s.value === item.stationSlug)?.label ?? item.stationSlug}
                  </td>
                  <td className="px-4 py-3">
                    {EQUIP_TYPES.find((t) => t.value === item.equipmentType)?.label ?? item.equipmentType}
                  </td>
                  <td className="px-4 py-3">{item.size}</td>
                  <td className="px-4 py-3 capitalize">{item.qualityTier}</td>
                  <td className="px-4 py-3 text-right">{item.totalQuantity}</td>
                  <td className={`px-4 py-3 text-right font-medium ${isLow ? "text-[#C75D4A]" : "text-[#5B8C6D]"}`}>
                    {item.availableQuantity}
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={item.condition}
                      onChange={(e) => handleQuickCondition(item.id, e.target.value)}
                      className="rounded-[6px] border-0 bg-transparent px-2 py-0.5 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-[#E87B5A]"
                      style={{
                        backgroundColor: `${condDef.color}26`,
                        color: condDef.color,
                      }}
                    >
                      {CONDITIONS.map((c) => (
                        <option key={c.value} value={c.value}>{c.label}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-xs text-[#8A8580]">
                    {item.lastMaintenanceAt
                      ? dateFmt.format(new Date(item.lastMaintenanceAt))
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => { setEditing(item); setShowModal(true); }}
                        className="rounded-[6px] p-1.5 text-[#8A8580] hover:bg-[#FAF9F7] transition-colors"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="rounded-[6px] p-1.5 text-[#8A8580] hover:text-[#C75D4A] hover:bg-[#C75D4A]/10 transition-colors"
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

      {/* Modal */}
      {showModal && (
        <InventoryModal
          item={editing}
          onClose={() => { setShowModal(false); setEditing(null); }}
          onSave={handleSave}
        />
      )}
    </div>
  );
}

function InventoryModal({
  item,
  onClose,
  onSave,
}: {
  item: RentalInventoryItem | null;
  onClose: () => void;
  onSave: (d: InvForm & { id?: string }) => void;
}) {
  const [form, setForm] = useState<InvForm>(() =>
    item
      ? {
          stationSlug: item.stationSlug,
          equipmentType: item.equipmentType,
          size: item.size,
          qualityTier: item.qualityTier,
          totalQuantity: item.totalQuantity,
          availableQuantity: item.availableQuantity,
          minStockAlert: item.minStockAlert,
          condition: item.condition ?? "bueno",
          lastMaintenanceAt: item.lastMaintenanceAt
            ? item.lastMaintenanceAt.slice(0, 10)
            : "",
          notes: item.notes ?? "",
        }
      : {
          stationSlug: "baqueira",
          equipmentType: "SKI",
          size: "",
          qualityTier: "media",
          totalQuantity: 0,
          availableQuantity: 0,
          minStockAlert: 5,
          condition: "bueno",
          lastMaintenanceAt: "",
          notes: "",
        }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ ...(item && { id: item.id }), ...form });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-[#E8E4DE] px-6 py-4">
          <h2 className="text-lg font-semibold text-[#2D2A26]">
            {item ? "Editar Inventario" : "Nuevo Inventario"}
          </h2>
          <button onClick={onClose} className="rounded-[10px] p-1.5 text-[#8A8580] hover:bg-[#FAF9F7] transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#2D2A26] mb-1">Estacion</label>
              <select value={form.stationSlug} onChange={(e) => setForm((p) => ({ ...p, stationSlug: e.target.value }))} className={inputCls} disabled={!!item}>
                {STATIONS.map((s) => (<option key={s.value} value={s.value}>{s.label}</option>))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#2D2A26] mb-1">Tipo</label>
              <select value={form.equipmentType} onChange={(e) => setForm((p) => ({ ...p, equipmentType: e.target.value }))} className={inputCls} disabled={!!item}>
                {EQUIP_TYPES.map((t) => (<option key={t.value} value={t.value}>{t.label}</option>))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#2D2A26] mb-1">Talla</label>
              <input type="text" value={form.size} onChange={(e) => setForm((p) => ({ ...p, size: e.target.value }))} className={inputCls} placeholder="Ej: 42, 170, M" required disabled={!!item} />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#2D2A26] mb-1">Calidad</label>
              <select value={form.qualityTier} onChange={(e) => setForm((p) => ({ ...p, qualityTier: e.target.value }))} className={inputCls} disabled={!!item}>
                {TIERS.map((t) => (<option key={t.value} value={t.value}>{t.label}</option>))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#2D2A26] mb-1">Total</label>
              <input type="number" min="0" value={form.totalQuantity} onChange={(e) => setForm((p) => ({ ...p, totalQuantity: parseInt(e.target.value) || 0 }))} className={inputCls} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#2D2A26] mb-1">Disponible</label>
              <input type="number" min="0" value={form.availableQuantity} onChange={(e) => setForm((p) => ({ ...p, availableQuantity: parseInt(e.target.value) || 0 }))} className={inputCls} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#2D2A26] mb-1">Alerta min.</label>
              <input type="number" min="0" value={form.minStockAlert} onChange={(e) => setForm((p) => ({ ...p, minStockAlert: parseInt(e.target.value) || 0 }))} className={inputCls} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#2D2A26] mb-1">Estado</label>
              <select value={form.condition} onChange={(e) => setForm((p) => ({ ...p, condition: e.target.value }))} className={inputCls}>
                {CONDITIONS.map((c) => (<option key={c.value} value={c.value}>{c.label}</option>))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#2D2A26] mb-1">Último mantenimiento</label>
              <input type="date" value={form.lastMaintenanceAt} onChange={(e) => setForm((p) => ({ ...p, lastMaintenanceAt: e.target.value }))} className={inputCls} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#2D2A26] mb-1">Notas</label>
            <input type="text" value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} className={inputCls} placeholder="Notas opcionales" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="rounded-[10px] px-4 py-2 text-sm text-[#8A8580] hover:bg-[#FAF9F7] transition-colors">
              Cancelar
            </button>
            <button type="submit" className="rounded-[10px] bg-[#E87B5A] px-4 py-2 text-sm font-medium text-white hover:bg-[#D56E4F] transition-colors">
              {item ? "Guardar" : "Crear"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
