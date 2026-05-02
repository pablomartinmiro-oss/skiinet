"use client";

import { useState } from "react";
import { Plus, X, CalendarDays } from "lucide-react";
import { toast } from "sonner";
import {
  useRestaurants,
  useRestaurantBookings,
  useCreateRestaurantBooking,
  useUpdateRestaurantBooking,
  useDeleteRestaurantBooking,
} from "@/hooks/useRestaurant";
import type { Restaurant, RestaurantBooking } from "@/hooks/useRestaurant";
import { PageSkeleton } from "@/components/shared/LoadingSkeleton";

const inputCls =
  "w-full rounded-[10px] border border-[#E8E4DE] px-3 py-2 text-sm text-[#2D2A26] focus:border-[#E87B5A] focus:outline-none focus:ring-1 focus:ring-[#E87B5A]";

const STATUS_BADGES: Record<string, { label: string; color: string }> = {
  confirmed: { label: "Confirmada", color: "bg-emerald-50 text-emerald-700" },
  cancelled: { label: "Cancelada", color: "bg-red-50 text-red-700" },
  no_show: { label: "No presentado", color: "bg-amber-50 text-amber-700" },
};

const DEPOSIT_BADGES: Record<string, { label: string; color: string }> = {
  pending: { label: "Pendiente", color: "bg-gray-100 text-gray-600" },
  paid: { label: "Pagado", color: "bg-emerald-50 text-emerald-700" },
};

const fmt = new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" });

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" });
}

// ── Booking Modal ─────────────────────────────────────────
function BookingModal({ restaurants, isOpen, onClose, onSave }: {
  restaurants: Restaurant[]; isOpen: boolean;
  onClose: () => void;
  onSave: (d: BookingFormData) => void;
}) {
  const [form, setForm] = useState<BookingFormData>({
    restaurantId: "", date: "", time: "13:00", guestCount: 2,
    clientName: "", clientEmail: null, clientPhone: null,
    specialRequests: null,
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-[#E8E4DE] px-6 py-4">
          <h2 className="text-lg font-semibold text-[#2D2A26]">Nueva Reserva</h2>
          <button onClick={onClose} className="rounded-[10px] p-1.5 text-[#8A8580] hover:bg-[#FAF9F7] transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          <div>
            <label className="block text-sm font-medium text-[#2D2A26] mb-1">Restaurante</label>
            <select value={form.restaurantId} onChange={(e) => setForm((p) => ({ ...p, restaurantId: e.target.value }))} className={inputCls} required>
              <option value="">Seleccionar restaurante...</option>
              {restaurants.map((r) => (<option key={r.id} value={r.id}>{r.title}</option>))}
            </select>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#2D2A26] mb-1">Fecha</label>
              <input type="date" value={form.date} onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))} className={inputCls} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#2D2A26] mb-1">Hora</label>
              <input type="time" value={form.time} onChange={(e) => setForm((p) => ({ ...p, time: e.target.value }))} className={inputCls} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#2D2A26] mb-1">Comensales</label>
              <input type="number" min="1" value={form.guestCount} onChange={(e) => setForm((p) => ({ ...p, guestCount: parseInt(e.target.value) || 1 }))} className={inputCls} required />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#2D2A26] mb-1">Nombre del cliente</label>
            <input type="text" value={form.clientName} onChange={(e) => setForm((p) => ({ ...p, clientName: e.target.value }))} className={inputCls} placeholder="Nombre completo" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#2D2A26] mb-1">Email</label>
              <input type="email" value={form.clientEmail ?? ""} onChange={(e) => setForm((p) => ({ ...p, clientEmail: e.target.value || null }))} className={inputCls} placeholder="Opcional" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#2D2A26] mb-1">Teléfono</label>
              <input type="tel" value={form.clientPhone ?? ""} onChange={(e) => setForm((p) => ({ ...p, clientPhone: e.target.value || null }))} className={inputCls} placeholder="Opcional" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#2D2A26] mb-1">Peticiones especiales</label>
            <textarea value={form.specialRequests ?? ""} onChange={(e) => setForm((p) => ({ ...p, specialRequests: e.target.value || null }))} rows={2} className={inputCls} placeholder="Alergias, preferencias de mesa..." />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="rounded-[10px] border border-[#E8E4DE] px-4 py-2 text-sm font-medium text-[#8A8580] hover:bg-[#FAF9F7] transition-colors">Cancelar</button>
            <button type="submit" className="rounded-[10px] bg-[#E87B5A] px-4 py-2 text-sm font-medium text-white hover:bg-[#D56E4F] transition-colors">Crear Reserva</button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface BookingFormData {
  restaurantId: string; date: string; time: string; guestCount: number;
  clientName: string; clientEmail: string | null; clientPhone: string | null;
  specialRequests: string | null;
}

// ── Main Tab ──────────────────────────────────────────────
export default function BookingsTab() {
  const { data: restData, isLoading: restLoading } = useRestaurants();
  const restaurants = restData?.restaurants || [];

  const [filterRestaurant, setFilterRestaurant] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const { data: bookingsData, isLoading: bookingsLoading } = useRestaurantBookings(
    filterRestaurant || undefined, filterDate || undefined, filterStatus || undefined
  );
  const createBooking = useCreateRestaurantBooking();
  const updateBooking = useUpdateRestaurantBooking();
  const deleteBooking = useDeleteRestaurantBooking();
  const [modalOpen, setModalOpen] = useState(false);

  if (restLoading) return <PageSkeleton />;
  const bookings = bookingsData?.bookings || [];

  const handleSave = async (d: BookingFormData) => {
    try {
      await createBooking.mutateAsync(d);
      toast.success("Reserva creada");
      setModalOpen(false);
    } catch { toast.error("Error al crear reserva"); }
  };

  const handleStatusChange = async (booking: RestaurantBooking, status: string) => {
    try {
      await updateBooking.mutateAsync({ id: booking.id, status });
      toast.success("Estado actualizado");
    } catch { toast.error("Error al actualizar estado"); }
  };

  const handleDepositChange = async (booking: RestaurantBooking, depositStatus: string) => {
    try {
      await updateBooking.mutateAsync({ id: booking.id, depositStatus });
      toast.success("Depósito actualizado");
    } catch { toast.error("Error al actualizar depósito"); }
  };

  const handleDelete = async (booking: RestaurantBooking) => {
    if (!confirm("Eliminar esta reserva?")) return;
    try { await deleteBooking.mutateAsync(booking.id); toast.success("Reserva eliminada"); }
    catch { toast.error("Error al eliminar reserva"); }
  };

  const restName = (id: string) => restaurants.find((r) => r.id === id)?.title || "—";
  const depositForBooking = (b: RestaurantBooking): number => {
    const perGuest = b.restaurant?.depositPerGuest
      ?? restaurants.find((r) => r.id === b.restaurantId)?.depositPerGuest
      ?? 0;
    return perGuest * b.guestCount;
  };

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <div>
          <label className="block text-sm font-medium text-[#2D2A26] mb-1">Restaurante</label>
          <select value={filterRestaurant} onChange={(e) => setFilterRestaurant(e.target.value)} className={inputCls}>
            <option value="">Todos</option>
            {restaurants.map((r) => (<option key={r.id} value={r.id}>{r.title}</option>))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-[#2D2A26] mb-1">Fecha</label>
          <input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} className={inputCls} />
        </div>
        <div>
          <label className="block text-sm font-medium text-[#2D2A26] mb-1">Estado</label>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className={inputCls}>
            <option value="">Todos</option>
            <option value="confirmed">Confirmada</option>
            <option value="cancelled">Cancelada</option>
            <option value="no_show">No presentado</option>
          </select>
        </div>
        <div className="flex items-end">
          <button onClick={() => setModalOpen(true)} className="flex items-center gap-2 rounded-[10px] bg-[#E87B5A] px-4 py-2 text-sm font-medium text-white hover:bg-[#D56E4F] transition-colors w-full justify-center">
            <Plus className="h-4 w-4" /> Nueva Reserva
          </button>
        </div>
      </div>

      {/* Table */}
      {bookingsLoading ? (
        <PageSkeleton />
      ) : bookings.length === 0 ? (
        <div className="rounded-2xl bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-12 text-center">
          <CalendarDays className="mx-auto h-10 w-10 text-[#8A8580] mb-3" />
          <p className="text-sm text-[#8A8580]">No hay reservas registradas</p>
          <p className="text-xs text-[#8A8580] mt-1">Crea una reserva para comenzar a gestionar tu restaurante</p>
        </div>
      ) : (
        <div className="rounded-2xl bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#E8E4DE] bg-[#FAF9F7]/50">
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#8A8580] uppercase tracking-wider">Restaurante</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#8A8580] uppercase tracking-wider">Fecha</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#8A8580] uppercase tracking-wider">Hora</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-[#8A8580] uppercase tracking-wider">Comensales</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#8A8580] uppercase tracking-wider">Cliente</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-[#8A8580] uppercase tracking-wider">Estado</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-[#8A8580] uppercase tracking-wider">Depósito</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#8A8580] uppercase tracking-wider">Notas</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-[#8A8580] uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E4DE]">
                {bookings.map((b) => {
                  const statusBadge = STATUS_BADGES[b.status] || STATUS_BADGES.confirmed;
                  const depositBadge = DEPOSIT_BADGES[b.depositStatus] || DEPOSIT_BADGES.pending;
                  return (
                    <tr key={b.id} className="hover:bg-[#FAF9F7]/30 transition-colors">
                      <td className="px-4 py-3 text-sm text-[#2D2A26]">{b.restaurant?.title || restName(b.restaurantId)}</td>
                      <td className="px-4 py-3 text-sm text-[#2D2A26]">{formatDate(b.date)}</td>
                      <td className="px-4 py-3 text-sm text-[#8A8580]">{b.time}</td>
                      <td className="px-4 py-3 text-center text-sm text-[#8A8580]">{b.guestCount}</td>
                      <td className="px-4 py-3 text-sm text-[#2D2A26]">{b.client?.name ?? "—"}</td>
                      <td className="px-4 py-3 text-center">
                        <select value={b.status} onChange={(e) => handleStatusChange(b, e.target.value)}
                          className={`rounded-[6px] px-2 py-0.5 text-xs font-medium border-0 cursor-pointer ${statusBadge.color}`}>
                          <option value="confirmed">Confirmada</option>
                          <option value="cancelled">Cancelada</option>
                          <option value="no_show">No presentado</option>
                        </select>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex flex-col items-center gap-0.5">
                          <span className="text-xs text-[#8A8580]">{fmt.format(depositForBooking(b))}</span>
                          <select value={b.depositStatus} onChange={(e) => handleDepositChange(b, e.target.value)}
                            className={`rounded-[6px] px-2 py-0.5 text-xs font-medium border-0 cursor-pointer ${depositBadge.color}`}>
                            <option value="pending">Pendiente</option>
                            <option value="paid">Pagado</option>
                          </select>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-[#8A8580] max-w-[160px] truncate" title={b.specialRequests || b.operationalNotes || ""}>
                        {b.specialRequests || b.operationalNotes || "—"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => handleDelete(b)} className="rounded-[10px] p-1.5 text-[#8A8580] hover:bg-red-50 hover:text-[#C75D4A] transition-colors" title="Eliminar">
                          <X className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <BookingModal restaurants={restaurants} isOpen={modalOpen} onClose={() => setModalOpen(false)} onSave={handleSave} />
    </div>
  );
}
