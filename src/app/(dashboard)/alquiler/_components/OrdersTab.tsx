"use client";

import { useState } from "react";
import {
  Plus,
  Search,
  ArrowDownToLine,
  ArrowUpFromLine,
  Eye,
  X,
} from "lucide-react";
import { toast } from "sonner";
import {
  useRentalOrders,
  useCreateRentalOrder,
  usePickupRentalOrder,
  useReturnRentalOrder,
} from "@/hooks/useRental";
import type { RentalOrder, RentalOrderItem } from "@/hooks/useRental";
import { PageSkeleton } from "@/components/shared/LoadingSkeleton";

const inputCls =
  "w-full rounded-[10px] border border-[#E8E4DE] px-3 py-2 text-sm text-[#2D2A26] placeholder:text-[#8A8580] focus:border-[#E87B5A] focus:outline-none focus:ring-1 focus:ring-[#E87B5A]";

const fmt = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
});

const dateFmt = new Intl.DateTimeFormat("es-ES", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

const EQUIP_LABELS: Record<string, string> = {
  SKI: "Esquis",
  BOOT: "Botas",
  POLE: "Bastones",
  HELMET: "Casco",
  SNOWBOARD: "Snowboard",
  SNOWBOARD_BOOT: "Botas Snow",
};

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  RESERVED: { bg: "bg-[#D4A853]/15", text: "text-[#D4A853]", label: "Reservado" },
  PREPARED: { bg: "bg-[#5B8C6D]/15", text: "text-[#5B8C6D]", label: "Preparado" },
  PICKED_UP: { bg: "bg-[#3B82F6]/15", text: "text-[#3B82F6]", label: "Recogido" },
  IN_USE: { bg: "bg-[#E87B5A]/15", text: "text-[#E87B5A]", label: "En Uso" },
  RETURNED: { bg: "bg-[#5B8C6D]/15", text: "text-[#5B8C6D]", label: "Devuelto" },
  INSPECTED: { bg: "bg-[#5B8C6D]/15", text: "text-[#5B8C6D]", label: "Inspeccionado" },
  CANCELLED: { bg: "bg-[#8A8580]/15", text: "text-[#8A8580]", label: "Cancelado" },
};

const STATIONS = [
  { value: "baqueira", label: "Baqueira Beret" },
  { value: "sierra_nevada", label: "Sierra Nevada" },
  { value: "la_pinilla", label: "La Pinilla" },
];

export default function OrdersTab() {
  const [filterStatus, setFilterStatus] = useState("");
  const [filterStation, setFilterStation] = useState("");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<RentalOrder | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const { data, isLoading } = useRentalOrders(
    filterStatus || undefined,
    filterStation || undefined,
    undefined,
    undefined,
    search || undefined
  );

  if (isLoading) return <PageSkeleton />;

  const orders = data?.orders ?? [];

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative max-w-xs">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#8A8580]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar cliente..."
            className={`${inputCls} pl-9`}
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className={`${inputCls} w-auto`}
        >
          <option value="">Todos los estados</option>
          {Object.entries(STATUS_STYLES).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>
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
        <div className="flex-1" />
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 rounded-[10px] bg-[#E87B5A] px-4 py-2 text-sm font-medium text-white hover:bg-[#D56E4F] transition-colors"
        >
          <Plus className="h-4 w-4" /> Nuevo Pedido
        </button>
      </div>

      {/* Orders table */}
      <div className="overflow-x-auto rounded-[16px] border border-[#E8E4DE] bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#E8E4DE] text-left text-[#8A8580]">
              <th className="px-4 py-3 font-medium">Cliente</th>
              <th className="px-4 py-3 font-medium">Estacion</th>
              <th className="px-4 py-3 font-medium">Recogida</th>
              <th className="px-4 py-3 font-medium">Devolucion</th>
              <th className="px-4 py-3 font-medium text-center">Items</th>
              <th className="px-4 py-3 font-medium text-right">Precio</th>
              <th className="px-4 py-3 font-medium">Estado</th>
              <th className="px-4 py-3 font-medium" />
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-[#8A8580]">
                  Sin pedidos de alquiler
                </td>
              </tr>
            )}
            {orders.map((o) => {
              const style = STATUS_STYLES[o.status] ?? STATUS_STYLES.RESERVED;
              return (
                <tr
                  key={o.id}
                  className="border-b border-[#E8E4DE] last:border-0 hover:bg-[#FAF9F7] cursor-pointer"
                  onClick={() => setSelected(o)}
                >
                  <td className="px-4 py-3 font-medium text-[#2D2A26]">
                    {o.clientName}
                  </td>
                  <td className="px-4 py-3 text-[#8A8580]">
                    {STATIONS.find((s) => s.value === o.stationSlug)?.label ?? o.stationSlug}
                  </td>
                  <td className="px-4 py-3">{dateFmt.format(new Date(o.pickupDate))}</td>
                  <td className="px-4 py-3">{dateFmt.format(new Date(o.returnDate))}</td>
                  <td className="px-4 py-3 text-center">{o.items.length}</td>
                  <td className="px-4 py-3 text-right">{fmt.format(o.totalPrice)}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-[6px] px-2 py-0.5 text-xs font-medium ${style.bg} ${style.text}`}>
                      {style.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button className="rounded-[6px] p-1.5 text-[#8A8580] hover:bg-[#FAF9F7] transition-colors">
                      <Eye className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Order Detail Modal */}
      {selected && (
        <OrderDetailModal
          order={selected}
          onClose={() => setSelected(null)}
        />
      )}

      {/* Create Order Modal */}
      {showCreate && (
        <CreateOrderModal onClose={() => setShowCreate(false)} />
      )}
    </div>
  );
}

// ==================== ORDER DETAIL MODAL ====================

function OrderDetailModal({
  order,
  onClose,
}: {
  order: RentalOrder;
  onClose: () => void;
}) {
  const [showPickup, setShowPickup] = useState(false);
  const [showReturn, setShowReturn] = useState(false);

  const canPickup = order.status === "RESERVED" || order.status === "PREPARED";
  const canReturn = order.status === "PICKED_UP" || order.status === "IN_USE";

  const style = STATUS_STYLES[order.status] ?? STATUS_STYLES.RESERVED;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-[#E8E4DE] px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-[#2D2A26]">
              Pedido de {order.clientName}
            </h2>
            <span className={`inline-flex rounded-[6px] px-2 py-0.5 text-xs font-medium ${style.bg} ${style.text}`}>
              {style.label}
            </span>
          </div>
          <button onClick={onClose} className="rounded-[10px] p-1.5 text-[#8A8580] hover:bg-[#FAF9F7] transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 p-6">
          {/* Order info */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-[#8A8580]">Estacion</p>
              <p className="font-medium text-[#2D2A26]">
                {STATIONS.find((s) => s.value === order.stationSlug)?.label ?? order.stationSlug}
              </p>
            </div>
            <div>
              <p className="text-[#8A8580]">Precio total</p>
              <p className="font-medium text-[#2D2A26]">{fmt.format(order.totalPrice)}</p>
            </div>
            <div>
              <p className="text-[#8A8580]">Recogida</p>
              <p className="font-medium text-[#2D2A26]">{dateFmt.format(new Date(order.pickupDate))}</p>
            </div>
            <div>
              <p className="text-[#8A8580]">Devolucion</p>
              <p className="font-medium text-[#2D2A26]">{dateFmt.format(new Date(order.returnDate))}</p>
            </div>
          </div>

          {/* Items table */}
          <div>
            <h3 className="text-sm font-semibold text-[#2D2A26] mb-2">
              Equipos ({order.items.length})
            </h3>
            <div className="rounded-[10px] border border-[#E8E4DE] overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#E8E4DE] bg-[#FAF9F7] text-left text-[#8A8580]">
                    <th className="px-3 py-2 font-medium">Participante</th>
                    <th className="px-3 py-2 font-medium">Equipo</th>
                    <th className="px-3 py-2 font-medium">Talla</th>
                    <th className="px-3 py-2 font-medium">DIN</th>
                    <th className="px-3 py-2 font-medium">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((item) => (
                    <tr key={item.id} className="border-b border-[#E8E4DE] last:border-0">
                      <td className="px-3 py-2">{item.participantName}</td>
                      <td className="px-3 py-2">
                        {EQUIP_LABELS[item.equipmentType] ?? item.equipmentType}{" "}
                        <span className="text-[#8A8580]">({item.qualityTier})</span>
                      </td>
                      <td className="px-3 py-2">{item.size ?? "—"}</td>
                      <td className="px-3 py-2">{item.dinSetting ?? "—"}</td>
                      <td className="px-3 py-2">
                        {item.conditionOnReturn ? (
                          <span className={
                            item.conditionOnReturn === "OK"
                              ? "text-[#5B8C6D]"
                              : item.conditionOnReturn === "DAMAGED"
                                ? "text-[#C75D4A]"
                                : "text-[#D4A853]"
                          }>
                            {item.conditionOnReturn}
                          </span>
                        ) : (
                          <span className="text-[#8A8580]">{item.itemStatus}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Notes */}
          {order.notes && (
            <div>
              <p className="text-sm text-[#8A8580]">Notas</p>
              <p className="text-sm text-[#2D2A26]">{order.notes}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            {canPickup && (
              <button
                onClick={() => setShowPickup(true)}
                className="flex items-center gap-2 rounded-[10px] bg-[#E87B5A] px-4 py-2 text-sm font-medium text-white hover:bg-[#D56E4F] transition-colors"
              >
                <ArrowDownToLine className="h-4 w-4" /> Confirmar Recogida
              </button>
            )}
            {canReturn && (
              <button
                onClick={() => setShowReturn(true)}
                className="flex items-center gap-2 rounded-[10px] bg-[#5B8C6D] px-4 py-2 text-sm font-medium text-white hover:bg-[#4A7359] transition-colors"
              >
                <ArrowUpFromLine className="h-4 w-4" /> Registrar Devolucion
              </button>
            )}
          </div>
        </div>

        {showPickup && (
          <PickupForm
            order={order}
            onClose={() => { setShowPickup(false); onClose(); }}
          />
        )}
        {showReturn && (
          <ReturnForm
            order={order}
            onClose={() => { setShowReturn(false); onClose(); }}
          />
        )}
      </div>
    </div>
  );
}

// ==================== PICKUP FORM ====================

function PickupForm({
  order,
  onClose,
}: {
  order: RentalOrder;
  onClose: () => void;
}) {
  const pickupMut = usePickupRentalOrder();
  const [itemForms, setItemForms] = useState<
    Record<string, { size: string; dinSetting: string }>
  >(() => {
    const obj: Record<string, { size: string; dinSetting: string }> = {};
    for (const item of order.items) {
      obj[item.id] = { size: item.size ?? "", dinSetting: item.dinSetting?.toString() ?? "" };
    }
    return obj;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const items = order.items.map((item) => ({
      itemId: item.id,
      size: itemForms[item.id]?.size ?? "",
      dinSetting: itemForms[item.id]?.dinSetting
        ? parseFloat(itemForms[item.id].dinSetting)
        : null,
    }));

    if (items.some((i) => !i.size)) {
      toast.error("Asigna una talla a todos los items");
      return;
    }

    try {
      await pickupMut.mutateAsync({ orderId: order.id, items });
      toast.success("Recogida confirmada");
      onClose();
    } catch {
      toast.error("Error al confirmar recogida");
    }
  };

  return (
    <div className="border-t border-[#E8E4DE] p-6 bg-[#FAF9F7]">
      <h3 className="text-sm font-semibold text-[#2D2A26] mb-3">
        Asignar Tallas para Recogida
      </h3>
      <form onSubmit={handleSubmit} className="space-y-3">
        {order.items.map((item) => (
          <div key={item.id} className="flex items-center gap-3">
            <span className="text-sm text-[#2D2A26] w-32 truncate">
              {item.participantName}
            </span>
            <span className="text-xs text-[#8A8580] w-20">
              {EQUIP_LABELS[item.equipmentType] ?? item.equipmentType}
            </span>
            <input
              type="text"
              placeholder="Talla"
              value={itemForms[item.id]?.size ?? ""}
              onChange={(e) =>
                setItemForms((p) => ({
                  ...p,
                  [item.id]: { ...p[item.id], size: e.target.value },
                }))
              }
              className={`${inputCls} w-24`}
              required
            />
            {(item.equipmentType === "SKI" || item.equipmentType === "SNOWBOARD") && (
              <input
                type="number"
                placeholder="DIN"
                min="0.5"
                max="16"
                step="0.25"
                value={itemForms[item.id]?.dinSetting ?? ""}
                onChange={(e) =>
                  setItemForms((p) => ({
                    ...p,
                    [item.id]: { ...p[item.id], dinSetting: e.target.value },
                  }))
                }
                className={`${inputCls} w-20`}
              />
            )}
          </div>
        ))}
        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={pickupMut.isPending}
            className="rounded-[10px] bg-[#E87B5A] px-4 py-2 text-sm font-medium text-white hover:bg-[#D56E4F] transition-colors disabled:opacity-50"
          >
            {pickupMut.isPending ? "Procesando..." : "Confirmar Recogida"}
          </button>
        </div>
      </form>
    </div>
  );
}

// ==================== RETURN FORM ====================

function ReturnForm({
  order,
  onClose,
}: {
  order: RentalOrder;
  onClose: () => void;
}) {
  const returnMut = useReturnRentalOrder();
  const [itemForms, setItemForms] = useState<
    Record<string, { conditionOnReturn: string; damageNotes: string }>
  >(() => {
    const obj: Record<string, { conditionOnReturn: string; damageNotes: string }> = {};
    for (const item of order.items) {
      obj[item.id] = { conditionOnReturn: "OK", damageNotes: "" };
    }
    return obj;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const items = order.items.map((item) => ({
      itemId: item.id,
      conditionOnReturn: (itemForms[item.id]?.conditionOnReturn ?? "OK") as
        | "OK"
        | "NEEDS_SERVICE"
        | "DAMAGED",
      damageNotes: itemForms[item.id]?.damageNotes || null,
    }));

    try {
      await returnMut.mutateAsync({ orderId: order.id, items });
      toast.success("Devolucion registrada");
      onClose();
    } catch {
      toast.error("Error al registrar devolucion");
    }
  };

  return (
    <div className="border-t border-[#E8E4DE] p-6 bg-[#FAF9F7]">
      <h3 className="text-sm font-semibold text-[#2D2A26] mb-3">
        Inspeccion de Devolucion
      </h3>
      <form onSubmit={handleSubmit} className="space-y-3">
        {order.items.map((item) => (
          <div key={item.id} className="flex items-center gap-3">
            <span className="text-sm text-[#2D2A26] w-32 truncate">
              {item.participantName}
            </span>
            <span className="text-xs text-[#8A8580] w-20">
              {EQUIP_LABELS[item.equipmentType] ?? item.equipmentType}
            </span>
            <select
              value={itemForms[item.id]?.conditionOnReturn ?? "OK"}
              onChange={(e) =>
                setItemForms((p) => ({
                  ...p,
                  [item.id]: { ...p[item.id], conditionOnReturn: e.target.value },
                }))
              }
              className={`${inputCls} w-40`}
            >
              <option value="OK">OK</option>
              <option value="NEEDS_SERVICE">Necesita Mantenimiento</option>
              <option value="DAMAGED">Danado</option>
            </select>
            {itemForms[item.id]?.conditionOnReturn !== "OK" && (
              <input
                type="text"
                placeholder="Notas del dano"
                value={itemForms[item.id]?.damageNotes ?? ""}
                onChange={(e) =>
                  setItemForms((p) => ({
                    ...p,
                    [item.id]: { ...p[item.id], damageNotes: e.target.value },
                  }))
                }
                className={`${inputCls} flex-1`}
              />
            )}
          </div>
        ))}
        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={returnMut.isPending}
            className="rounded-[10px] bg-[#5B8C6D] px-4 py-2 text-sm font-medium text-white hover:bg-[#4A7359] transition-colors disabled:opacity-50"
          >
            {returnMut.isPending ? "Procesando..." : "Confirmar Devolucion"}
          </button>
        </div>
      </form>
    </div>
  );
}

// ==================== CREATE ORDER MODAL ====================

function CreateOrderModal({ onClose }: { onClose: () => void }) {
  const createMut = useCreateRentalOrder();
  const [form, setForm] = useState({
    clientName: "",
    clientEmail: "",
    clientPhone: "",
    stationSlug: "baqueira",
    pickupDate: "",
    returnDate: "",
    totalPrice: "0",
    notes: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createMut.mutateAsync({
        clientName: form.clientName,
        clientEmail: form.clientEmail || null,
        clientPhone: form.clientPhone || null,
        stationSlug: form.stationSlug,
        pickupDate: form.pickupDate,
        returnDate: form.returnDate,
        totalPrice: parseFloat(form.totalPrice) || 0,
        notes: form.notes || null,
      });
      toast.success("Pedido creado");
      onClose();
    } catch {
      toast.error("Error al crear pedido");
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-[#E8E4DE] px-6 py-4">
          <h2 className="text-lg font-semibold text-[#2D2A26]">
            Nuevo Pedido de Alquiler
          </h2>
          <button onClick={onClose} className="rounded-[10px] p-1.5 text-[#8A8580] hover:bg-[#FAF9F7] transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          <div>
            <label className="block text-sm font-medium text-[#2D2A26] mb-1">Nombre del cliente</label>
            <input type="text" value={form.clientName} onChange={(e) => setForm((p) => ({ ...p, clientName: e.target.value }))} className={inputCls} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#2D2A26] mb-1">Email</label>
              <input type="email" value={form.clientEmail} onChange={(e) => setForm((p) => ({ ...p, clientEmail: e.target.value }))} className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#2D2A26] mb-1">Teléfono</label>
              <input type="text" value={form.clientPhone} onChange={(e) => setForm((p) => ({ ...p, clientPhone: e.target.value }))} className={inputCls} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#2D2A26] mb-1">Estacion</label>
            <select value={form.stationSlug} onChange={(e) => setForm((p) => ({ ...p, stationSlug: e.target.value }))} className={inputCls}>
              {STATIONS.map((s) => (<option key={s.value} value={s.value}>{s.label}</option>))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#2D2A26] mb-1">Fecha recogida</label>
              <input type="date" value={form.pickupDate} onChange={(e) => setForm((p) => ({ ...p, pickupDate: e.target.value }))} className={inputCls} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#2D2A26] mb-1">Fecha devolucion</label>
              <input type="date" value={form.returnDate} onChange={(e) => setForm((p) => ({ ...p, returnDate: e.target.value }))} className={inputCls} required />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#2D2A26] mb-1">Precio total (EUR)</label>
            <input type="number" min="0" step="0.01" value={form.totalPrice} onChange={(e) => setForm((p) => ({ ...p, totalPrice: e.target.value }))} className={inputCls} />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#2D2A26] mb-1">Notas</label>
            <input type="text" value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} className={inputCls} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="rounded-[10px] px-4 py-2 text-sm text-[#8A8580] hover:bg-[#FAF9F7] transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={createMut.isPending} className="rounded-[10px] bg-[#E87B5A] px-4 py-2 text-sm font-medium text-white hover:bg-[#D56E4F] transition-colors disabled:opacity-50">
              {createMut.isPending ? "Creando..." : "Crear Pedido"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
