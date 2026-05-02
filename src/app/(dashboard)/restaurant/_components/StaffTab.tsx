"use client";

import { useState } from "react";
import { Plus, Trash2, Users, X } from "lucide-react";
import { toast } from "sonner";
import {
  useRestaurants,
  useRestaurantStaff,
  useAssignStaff,
  useUnassignStaff,
} from "@/hooks/useRestaurant";
import type { Restaurant, RestaurantStaff } from "@/hooks/useRestaurant";
import { PageSkeleton } from "@/components/shared/LoadingSkeleton";
import { useTeam } from "@/hooks/useSettings";

const inputCls =
  "w-full rounded-[10px] border border-[#E8E4DE] px-3 py-2 text-sm text-[#2D2A26] focus:border-[#E87B5A] focus:outline-none focus:ring-1 focus:ring-[#E87B5A]";

const ROLE_BADGES: Record<string, { label: string; color: string }> = {
  staff: { label: "Staff", color: "bg-gray-100 text-gray-600" },
  manager: { label: "Manager", color: "bg-blue-50 text-blue-700" },
  chef: { label: "Chef", color: "bg-amber-50 text-amber-700" },
};

// ── Assign Modal ──────────────────────────────────────────
function AssignModal({ restaurants, isOpen, onClose, onSave }: {
  restaurants: Restaurant[]; isOpen: boolean;
  onClose: () => void;
  onSave: (d: { restaurantId: string; userId: string; role: string }) => void;
}) {
  const { data: teamData } = useTeam();
  const members = teamData?.users || [];

  const [form, setForm] = useState({
    restaurantId: "",
    userId: "",
    role: "staff",
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-[#E8E4DE] px-6 py-4">
          <h2 className="text-lg font-semibold text-[#2D2A26]">Asignar Personal</h2>
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
          <div>
            <label className="block text-sm font-medium text-[#2D2A26] mb-1">Miembro del equipo</label>
            <select value={form.userId} onChange={(e) => setForm((p) => ({ ...p, userId: e.target.value }))} className={inputCls} required>
              <option value="">Seleccionar usuario...</option>
              {members.map((m: { id: string; name: string | null; email: string }) => (
                <option key={m.id} value={m.id}>{m.name || m.email}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#2D2A26] mb-1">Rol</label>
            <select value={form.role} onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))} className={inputCls}>
              <option value="staff">Staff</option>
              <option value="manager">Manager</option>
              <option value="chef">Chef</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="rounded-[10px] border border-[#E8E4DE] px-4 py-2 text-sm font-medium text-[#8A8580] hover:bg-[#FAF9F7] transition-colors">
              Cancelar
            </button>
            <button type="submit" className="rounded-[10px] bg-[#E87B5A] px-4 py-2 text-sm font-medium text-white hover:bg-[#D56E4F] transition-colors">
              Asignar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main Tab ──────────────────────────────────────────────
export default function StaffTab() {
  const { data: restData, isLoading: restLoading } = useRestaurants();
  const restaurants = restData?.restaurants || [];

  const [filterRestaurant, setFilterRestaurant] = useState("");
  const { data: staffData, isLoading: staffLoading } = useRestaurantStaff(filterRestaurant || undefined);
  const assignStaff = useAssignStaff();
  const unassignStaff = useUnassignStaff();
  const [modalOpen, setModalOpen] = useState(false);

  if (restLoading) return <PageSkeleton />;
  const staff = staffData?.staff || [];

  const handleAssign = async (d: { restaurantId: string; userId: string; role: string }) => {
    try {
      await assignStaff.mutateAsync(d);
      toast.success("Personal asignado");
      setModalOpen(false);
    } catch { toast.error("Error al asignar personal"); }
  };

  const handleUnassign = async (s: RestaurantStaff) => {
    const name = s.user?.name || s.user?.email || "este miembro";
    if (!confirm(`Desasignar a ${name}?`)) return;
    try {
      await unassignStaff.mutateAsync(s.id);
      toast.success("Personal desasignado");
    } catch { toast.error("Error al desasignar personal"); }
  };

  const restName = (id: string) => restaurants.find((r) => r.id === id)?.title || "--";

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label className="block text-sm font-medium text-[#2D2A26] mb-1">Restaurante</label>
          <select value={filterRestaurant} onChange={(e) => setFilterRestaurant(e.target.value)} className={inputCls}>
            <option value="">Todos</option>
            {restaurants.map((r) => (<option key={r.id} value={r.id}>{r.title}</option>))}
          </select>
        </div>
        <div />
        <div className="flex items-end">
          <button onClick={() => setModalOpen(true)} className="flex items-center gap-2 rounded-[10px] bg-[#E87B5A] px-4 py-2 text-sm font-medium text-white hover:bg-[#D56E4F] transition-colors w-full justify-center">
            <Plus className="h-4 w-4" /> Asignar Personal
          </button>
        </div>
      </div>

      {/* Table */}
      {staffLoading ? (
        <PageSkeleton />
      ) : staff.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <Users className="mx-auto h-10 w-10 text-[#8A8580] mb-3" />
          <p className="text-sm text-[#8A8580]">No hay personal asignado</p>
          <p className="text-xs text-[#8A8580] mt-1">Asigna miembros de tu equipo a los restaurantes</p>
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#E8E4DE] bg-[#FAF9F7]/50">
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#8A8580] uppercase tracking-wider">Nombre</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#8A8580] uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-[#8A8580] uppercase tracking-wider">Rol</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#8A8580] uppercase tracking-wider">Restaurante</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-[#8A8580] uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E4DE]">
                {staff.map((s) => {
                  const badge = ROLE_BADGES[s.role] || ROLE_BADGES.staff;
                  return (
                    <tr key={s.id} className="hover:bg-[#FAF9F7]/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-[#E87B5A]/10 flex items-center justify-center">
                            <span className="text-xs font-semibold text-[#E87B5A]">
                              {(s.user?.name || s.user?.email || "?").charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <span className="font-medium text-sm text-[#2D2A26]">{s.user?.name || "--"}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-[#8A8580]">{s.user?.email || "--"}</td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex rounded-[6px] px-2 py-0.5 text-xs font-medium ${badge.color}`}>
                          {badge.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-[#2D2A26]">{s.restaurant?.title || restName(s.restaurantId)}</td>
                      <td className="px-6 py-4 text-right">
                        <button onClick={() => handleUnassign(s)} className="rounded-[10px] p-1.5 text-[#8A8580] hover:bg-red-50 hover:text-[#C75D4A] transition-colors" title="Desasignar">
                          <Trash2 className="h-4 w-4" />
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

      <AssignModal restaurants={restaurants} isOpen={modalOpen} onClose={() => setModalOpen(false)} onSave={handleAssign} />
    </div>
  );
}
