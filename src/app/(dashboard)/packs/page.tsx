"use client";

import { useState } from "react";
import { Boxes, Plus } from "lucide-react";
import { toast } from "sonner";
import { usePacks, useCreatePack } from "@/hooks/usePacks";
import { PageSkeleton } from "@/components/shared/LoadingSkeleton";
import PacksTable from "./_components/PacksTable";

const inputCls =
  "w-full rounded-[10px] border border-[#E8E4DE] px-3 py-2 text-sm text-[#2D2A26] placeholder:text-[#8A8580] focus:border-[#E87B5A] focus:outline-none focus:ring-1 focus:ring-[#E87B5A]";

export default function PacksPage() {
  const [filterActive, setFilterActive] = useState<boolean | undefined>(
    undefined
  );
  const { data, isLoading } = usePacks(filterActive);
  const createPack = useCreatePack();
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newPrice, setNewPrice] = useState(0);

  const packs = data?.packs ?? [];

  const handleQuickCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    try {
      await createPack.mutateAsync({
        title: newTitle.trim(),
        price: newPrice,
      });
      toast.success("Pack creado");
      setNewTitle("");
      setNewPrice(0);
      setCreating(false);
    } catch {
      toast.error("Error al crear pack");
    }
  };

  if (isLoading) return <PageSkeleton />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#2D2A26]">
          Packs
        </h1>
        <button
          onClick={() => setCreating(true)}
          className="flex items-center gap-2 rounded-[10px] bg-[#E87B5A] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#D56E4F] transition-colors"
        >
          <Plus className="h-4 w-4" /> Nuevo Pack
        </button>
      </div>

      {/* Quick create form */}
      {creating && (
        <div className="glass-card p-6">
          <form onSubmit={handleQuickCreate} className="flex items-end gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-[#2D2A26] mb-1">
                Titulo del Pack
              </label>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className={inputCls}
                placeholder="Ej: Pack Romantico"
                required
                autoFocus
              />
            </div>
            <div className="w-36">
              <label className="block text-sm font-medium text-[#2D2A26] mb-1">
                Precio (EUR)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={newPrice}
                onChange={(e) => setNewPrice(parseFloat(e.target.value) || 0)}
                className={inputCls}
              />
            </div>
            <button
              type="submit"
              className="rounded-[10px] bg-[#E87B5A] px-4 py-2 text-sm font-medium text-white hover:bg-[#D56E4F] transition-colors"
            >
              Crear
            </button>
            <button
              type="button"
              onClick={() => setCreating(false)}
              className="rounded-[10px] border border-[#E8E4DE] px-4 py-2 text-sm font-medium text-[#8A8580] hover:bg-[#FAF9F7] transition-colors"
            >
              Cancelar
            </button>
          </form>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-3">
        <select
          value={filterActive === undefined ? "" : String(filterActive)}
          onChange={(e) =>
            setFilterActive(
              e.target.value === ""
                ? undefined
                : e.target.value === "true"
            )
          }
          className={inputCls + " w-36"}
        >
          <option value="">Todos</option>
          <option value="true">Activos</option>
          <option value="false">Inactivos</option>
        </select>
        <p className="text-sm text-[#8A8580]">
          {packs.length} pack{packs.length !== 1 ? "s" : ""}
        </p>
      </div>

      {packs.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <Boxes className="mx-auto h-10 w-10 text-[#8A8580] mb-3" />
          <p className="text-sm text-[#8A8580]">No hay packs creados</p>
          <p className="text-xs text-[#8A8580] mt-1">
            Crea tu primer pack compuesto para combinar productos y servicios
          </p>
        </div>
      ) : (
        <PacksTable packs={packs} />
      )}
    </div>
  );
}
