"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, Home, BedDouble } from "lucide-react";
import { toast } from "sonner";
import {
  useRoomTypes,
  useCreateRoomType,
  useUpdateRoomType,
  useDeleteRoomType,
} from "@/hooks/useHotel";
import type { RoomType } from "@/hooks/useHotel";
import { PageSkeleton } from "@/components/shared/LoadingSkeleton";
import RoomTypeModal from "./RoomTypeModal";
import type { RoomTypeFormData } from "./RoomTypeModal";

export default function RoomTypesTab() {
  const { data, isLoading } = useRoomTypes();
  const createRoom = useCreateRoomType();
  const updateRoom = useUpdateRoomType();
  const deleteRoom = useDeleteRoomType();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<RoomType | null>(null);

  if (isLoading) return <PageSkeleton />;

  const rooms = data?.roomTypes || [];
  const fmt = new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" });

  const handleAdd = () => { setEditing(null); setModalOpen(true); };
  const handleEdit = (room: RoomType) => { setEditing(room); setModalOpen(true); };

  const handleDelete = async (room: RoomType) => {
    if (!confirm(`Eliminar el alojamiento "${room.title}"?`)) return;
    try {
      await deleteRoom.mutateAsync(room.id);
      toast.success("Alojamiento eliminado");
    } catch {
      toast.error("Error al eliminar alojamiento");
    }
  };

  const handleSave = async (data: RoomTypeFormData & { id?: string }) => {
    try {
      if (data.id) {
        await updateRoom.mutateAsync({ id: data.id, ...data });
        toast.success("Alojamiento actualizado");
      } else {
        await createRoom.mutateAsync(data);
        toast.success("Alojamiento creado");
      }
      setModalOpen(false);
    } catch {
      toast.error("Error al guardar alojamiento");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-[#8A8580]">
          {rooms.length} tipo{rooms.length !== 1 ? "s" : ""} de habitación
        </p>
        <button onClick={handleAdd} className="flex items-center gap-2 rounded-[10px] bg-[#E87B5A] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#D56E4F] transition-colors">
          <Plus className="h-4 w-4" />
          Añadir Habitación
        </button>
      </div>

      {rooms.length === 0 ? (
        <div className="rounded-2xl bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-12 text-center">
          <BedDouble className="mx-auto h-10 w-10 text-[#8A8580] mb-3" />
          <p className="text-sm text-[#8A8580]">No hay tipos de habitación creados</p>
          <p className="text-xs text-[#8A8580] mt-1">Crea tu primer tipo de habitación para gestionar el hotel</p>
        </div>
      ) : (
        <div className="rounded-2xl bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#E8E4DE] bg-[#FAF9F7]/50">
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#8A8580] uppercase tracking-wider">Titulo</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#8A8580] uppercase tracking-wider">Slug</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-[#8A8580] uppercase tracking-wider">Capacidad</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-[#8A8580] uppercase tracking-wider">Precio base</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-[#8A8580] uppercase tracking-wider">Estado</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-[#8A8580] uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E4DE]">
                {rooms.map((room) => (
                  <tr key={room.id} className="hover:bg-[#FAF9F7]/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <BedDouble className="h-4 w-4 text-[#8A8580]" />
                        <span className="font-medium text-sm text-[#2D2A26]">{room.title}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="rounded-[6px] bg-[#FAF9F7] px-2 py-0.5 text-xs font-mono text-[#8A8580]">{room.slug}</span>
                    </td>
                    <td className="px-6 py-4 text-center text-sm text-[#8A8580]">{room.capacity}</td>
                    <td className="px-6 py-4 text-right text-sm text-[#2D2A26]">{fmt.format(room.basePrice)}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex rounded-[6px] px-2 py-0.5 text-xs font-medium ${room.active ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>
                        {room.active ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => handleEdit(room)} className="rounded-[10px] p-1.5 text-[#8A8580] hover:bg-[#FAF9F7] hover:text-[#E87B5A] transition-colors" title="Editar">
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleDelete(room)} className="rounded-[10px] p-1.5 text-[#8A8580] hover:bg-red-50 hover:text-[#C75D4A] transition-colors" title="Eliminar">
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

      <RoomTypeModal key={editing?.id ?? "new"} room={editing} isOpen={modalOpen} onClose={() => setModalOpen(false)} onSave={handleSave} />
    </div>
  );
}
