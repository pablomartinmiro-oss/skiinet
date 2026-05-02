"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, X, MapPin } from "lucide-react";
import { toast } from "sonner";
import {
  useLocations,
  useCreateLocation,
  useUpdateLocation,
  useDeleteLocation,
} from "@/hooks/useCatalog";
import type { Location } from "@/hooks/useCatalog";
import { PageSkeleton } from "@/components/shared/LoadingSkeleton";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

interface LocationFormData {
  name: string;
  slug: string;
  latitude: number | null;
  longitude: number | null;
  description: string | null;
}

function getInitialForm(location: Location | null): LocationFormData {
  if (location) {
    return {
      name: location.name,
      slug: location.slug,
      latitude: location.latitude,
      longitude: location.longitude,
      description: location.description,
    };
  }
  return {
    name: "",
    slug: "",
    latitude: null,
    longitude: null,
    description: null,
  };
}

interface LocationModalProps {
  location: Location | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: LocationFormData & { id?: string }) => void;
}

function LocationModal({
  location,
  isOpen,
  onClose,
  onSave,
}: LocationModalProps) {
  const [form, setForm] = useState(getInitialForm(location));

  if (!isOpen) return null;

  const handleNameChange = (name: string) => {
    setForm((prev) => ({
      ...prev,
      name,
      slug: location ? prev.slug : slugify(name),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...(location && { id: location.id }),
      ...form,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-[#E8E4DE] px-6 py-4">
          <h2 className="text-lg font-semibold text-[#2D2A26]">
            {location ? "Editar Ubicación" : "Nueva Ubicación"}
          </h2>
          <button
            onClick={onClose}
            className="rounded-[10px] p-1.5 text-[#8A8580] hover:bg-[#FAF9F7] transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          <div>
            <label className="block text-sm font-medium text-[#2D2A26] mb-1">
              Nombre
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => handleNameChange(e.target.value)}
              className="w-full rounded-[10px] border border-[#E8E4DE] px-3 py-2 text-sm text-[#2D2A26] placeholder:text-[#8A8580] focus:border-[#E87B5A] focus:outline-none focus:ring-1 focus:ring-[#E87B5A]"
              placeholder="Ej: Baqueira Beret"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#2D2A26] mb-1">
              Slug
            </label>
            <input
              type="text"
              value={form.slug}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, slug: e.target.value }))
              }
              className="w-full rounded-[10px] border border-[#E8E4DE] px-3 py-2 text-sm text-[#2D2A26] placeholder:text-[#8A8580] focus:border-[#E87B5A] focus:outline-none focus:ring-1 focus:ring-[#E87B5A]"
              placeholder="baqueira-beret"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#2D2A26] mb-1">
                Latitud
              </label>
              <input
                type="number"
                step="any"
                value={form.latitude ?? ""}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    latitude: e.target.value
                      ? parseFloat(e.target.value)
                      : null,
                  }))
                }
                className="w-full rounded-[10px] border border-[#E8E4DE] px-3 py-2 text-sm text-[#2D2A26] placeholder:text-[#8A8580] focus:border-[#E87B5A] focus:outline-none focus:ring-1 focus:ring-[#E87B5A]"
                placeholder="42.6953"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#2D2A26] mb-1">
                Longitud
              </label>
              <input
                type="number"
                step="any"
                value={form.longitude ?? ""}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    longitude: e.target.value
                      ? parseFloat(e.target.value)
                      : null,
                  }))
                }
                className="w-full rounded-[10px] border border-[#E8E4DE] px-3 py-2 text-sm text-[#2D2A26] placeholder:text-[#8A8580] focus:border-[#E87B5A] focus:outline-none focus:ring-1 focus:ring-[#E87B5A]"
                placeholder="0.9467"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#2D2A26] mb-1">
              Descripción
            </label>
            <input
              type="text"
              value={form.description ?? ""}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  description: e.target.value || null,
                }))
              }
              className="w-full rounded-[10px] border border-[#E8E4DE] px-3 py-2 text-sm text-[#2D2A26] placeholder:text-[#8A8580] focus:border-[#E87B5A] focus:outline-none focus:ring-1 focus:ring-[#E87B5A]"
              placeholder="Descripción opcional de la ubicación"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-[10px] border border-[#E8E4DE] px-4 py-2 text-sm font-medium text-[#8A8580] hover:bg-[#FAF9F7] transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="rounded-[10px] bg-[#E87B5A] px-4 py-2 text-sm font-medium text-white hover:bg-[#D56E4F] transition-colors"
            >
              {location ? "Guardar Cambios" : "Crear Ubicación"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function LocationsTab() {
  const { data, isLoading } = useLocations();
  const createLocation = useCreateLocation();
  const updateLocation = useUpdateLocation();
  const deleteLocation = useDeleteLocation();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Location | null>(null);

  if (isLoading) return <PageSkeleton />;

  const locations = data?.locations || [];

  const handleAdd = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const handleEdit = (location: Location) => {
    setEditing(location);
    setModalOpen(true);
  };

  const handleDelete = async (location: Location) => {
    if (!confirm(`¿Eliminar la ubicación "${location.name}"?`)) return;
    try {
      await deleteLocation.mutateAsync(location.id);
      toast.success("Ubicación eliminada");
    } catch {
      toast.error("Error al eliminar ubicación");
    }
  };

  const handleSave = async (
    data: LocationFormData & { id?: string }
  ) => {
    try {
      if (data.id) {
        await updateLocation.mutateAsync({
          id: data.id,
          name: data.name,
          slug: data.slug,
          latitude: data.latitude,
          longitude: data.longitude,
          description: data.description,
        });
        toast.success("Ubicación actualizada");
      } else {
        await createLocation.mutateAsync({
          name: data.name,
          slug: data.slug,
          latitude: data.latitude,
          longitude: data.longitude,
          description: data.description,
        });
        toast.success("Ubicación creada");
      }
      setModalOpen(false);
    } catch {
      toast.error("Error al guardar ubicación");
    }
  };

  const formatCoords = (lat: number | null, lng: number | null) => {
    if (lat === null || lng === null) return "—";
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-[#8A8580]">
          {locations.length} ubicación{locations.length !== 1 ? "es" : ""} en el
          catálogo
        </p>
        <button
          onClick={handleAdd}
          className="flex items-center gap-2 rounded-[10px] bg-[#E87B5A] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#D56E4F] transition-colors"
        >
          <Plus className="h-4 w-4" />
          Añadir Ubicación
        </button>
      </div>

      {/* Table */}
      {locations.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <MapPin className="mx-auto h-10 w-10 text-[#8A8580] mb-3" />
          <p className="text-sm text-[#8A8580]">
            No hay ubicaciones creadas
          </p>
          <p className="text-xs text-[#8A8580] mt-1">
            Crea tu primera ubicación para asignar a los productos
          </p>
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#E8E4DE] bg-[#FAF9F7]/50">
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#8A8580] uppercase tracking-wider">
                    Nombre
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#8A8580] uppercase tracking-wider">
                    Slug
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#8A8580] uppercase tracking-wider">
                    Coordenadas
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#8A8580] uppercase tracking-wider">
                    Descripción
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-[#8A8580] uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E4DE]">
                {locations.map((location) => (
                  <tr
                    key={location.id}
                    className="hover:bg-[#FAF9F7]/30 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-[#8A8580]" />
                        <span className="font-medium text-sm text-[#2D2A26]">
                          {location.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="rounded-[6px] bg-[#FAF9F7] px-2 py-0.5 text-xs font-mono text-[#8A8580]">
                        {location.slug}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-[#8A8580]">
                      {formatCoords(location.latitude, location.longitude)}
                    </td>
                    <td className="px-6 py-4 text-sm text-[#8A8580] max-w-[200px] truncate">
                      {location.description || "—"}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEdit(location)}
                          className="rounded-[10px] p-1.5 text-[#8A8580] hover:bg-[#FAF9F7] hover:text-[#E87B5A] transition-colors"
                          title="Editar"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(location)}
                          className="rounded-[10px] p-1.5 text-[#8A8580] hover:bg-red-50 hover:text-[#C75D4A] transition-colors"
                          title="Eliminar"
                        >
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

      {/* Modal */}
      <LocationModal
        key={editing?.id ?? "new"}
        location={editing}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
      />
    </div>
  );
}
