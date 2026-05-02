"use client";

import { useState } from "react";
import { Plus, Trash2, ShieldBan } from "lucide-react";
import { toast } from "sonner";
import { useRoomTypes, useRoomBlocks, useCreateRoomBlock, useDeleteRoomBlock } from "@/hooks/useHotel";
import type { RoomBlock } from "@/hooks/useHotel";
import { PageSkeleton } from "@/components/shared/LoadingSkeleton";
import BlockModal from "./BlockModal";
import type { BlockFormData } from "./BlockModal";

const REASON_BADGES: Record<string, { label: string; color: string }> = {
  closure: { label: "Cierre", color: "bg-red-50 text-red-700" },
  reduced_capacity: { label: "Capacidad reducida", color: "bg-amber-50 text-amber-700" },
  maintenance: { label: "Mantenimiento", color: "bg-blue-50 text-blue-700" },
  other: { label: "Otro", color: "bg-gray-100 text-gray-600" },
};

function getReasonBadge(reason: string) {
  return REASON_BADGES[reason] || { label: reason, color: "bg-gray-100 text-gray-600" };
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" });
}

const inputCls =
  "w-full rounded-[10px] border border-[#E8E4DE] px-3 py-2 text-sm text-[#2D2A26] focus:border-[#E87B5A] focus:outline-none focus:ring-1 focus:ring-[#E87B5A]";

export default function BlocksTab() {
  const { data: roomData, isLoading: roomsLoading } = useRoomTypes();
  const rooms = roomData?.roomTypes || [];

  const [filterRoom, setFilterRoom] = useState("");
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");

  const { data: blocksData, isLoading: blocksLoading } = useRoomBlocks(
    filterRoom || undefined, filterFrom || undefined, filterTo || undefined
  );
  const createBlock = useCreateRoomBlock();
  const deleteBlock = useDeleteRoomBlock();
  const [modalOpen, setModalOpen] = useState(false);

  if (roomsLoading) return <PageSkeleton />;
  const blocks = blocksData?.blocks || [];

  const handleDelete = async (block: RoomBlock) => {
    if (!confirm("Eliminar este bloqueo?")) return;
    try { await deleteBlock.mutateAsync(block.id); toast.success("Bloqueo eliminado"); }
    catch { toast.error("Error al eliminar bloqueo"); }
  };

  const handleSave = async (data: BlockFormData) => {
    try { await createBlock.mutateAsync(data); toast.success("Bloqueo creado"); setModalOpen(false); }
    catch { toast.error("Error al crear bloqueo"); }
  };

  const roomName = (id: string) => rooms.find((r) => r.id === id)?.title || "—";

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <div>
          <label className="block text-sm font-medium text-[#2D2A26] mb-1">Habitación</label>
          <select value={filterRoom} onChange={(e) => setFilterRoom(e.target.value)} className={inputCls}>
            <option value="">Todas</option>
            {rooms.map((r) => (<option key={r.id} value={r.id}>{r.title}</option>))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-[#2D2A26] mb-1">Desde</label>
          <input type="date" value={filterFrom} onChange={(e) => setFilterFrom(e.target.value)} className={inputCls} />
        </div>
        <div>
          <label className="block text-sm font-medium text-[#2D2A26] mb-1">Hasta</label>
          <input type="date" value={filterTo} onChange={(e) => setFilterTo(e.target.value)} className={inputCls} />
        </div>
        <div className="flex items-end">
          <button onClick={() => setModalOpen(true)} className="flex items-center gap-2 rounded-[10px] bg-[#E87B5A] px-4 py-2 text-sm font-medium text-white hover:bg-[#D56E4F] transition-colors w-full justify-center">
            <Plus className="h-4 w-4" />
            Añadir Bloqueo
          </button>
        </div>
      </div>

      {/* Table */}
      {blocksLoading ? (
        <PageSkeleton />
      ) : blocks.length === 0 ? (
        <div className="rounded-2xl bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-12 text-center">
          <ShieldBan className="mx-auto h-10 w-10 text-[#8A8580] mb-3" />
          <p className="text-sm text-[#8A8580]">No hay bloqueos registrados</p>
          <p className="text-xs text-[#8A8580] mt-1">Crea un bloqueo para reservar o inhabilitar habitaciónes</p>
        </div>
      ) : (
        <div className="rounded-2xl bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#E8E4DE] bg-[#FAF9F7]/50">
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#8A8580] uppercase tracking-wider">Fecha</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#8A8580] uppercase tracking-wider">Tipo habitación</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-[#8A8580] uppercase tracking-wider">Unidades</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#8A8580] uppercase tracking-wider">Motivo</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-[#8A8580] uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E4DE]">
                {blocks.map((block) => {
                  const badge = getReasonBadge(block.reason);
                  return (
                    <tr key={block.id} className="hover:bg-[#FAF9F7]/30 transition-colors">
                      <td className="px-6 py-4 text-sm text-[#2D2A26]">{formatDate(block.date)}</td>
                      <td className="px-6 py-4 text-sm text-[#2D2A26]">{block.roomType?.title || roomName(block.roomTypeId)}</td>
                      <td className="px-6 py-4 text-center text-sm text-[#8A8580]">{block.unitCount}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex rounded-[6px] px-2 py-0.5 text-xs font-medium ${badge.color}`}>{badge.label}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button onClick={() => handleDelete(block)} className="rounded-[10px] p-1.5 text-[#8A8580] hover:bg-red-50 hover:text-[#C75D4A] transition-colors" title="Eliminar">
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

      <BlockModal rooms={rooms} isOpen={modalOpen} onClose={() => setModalOpen(false)} onSave={handleSave} />
    </div>
  );
}
