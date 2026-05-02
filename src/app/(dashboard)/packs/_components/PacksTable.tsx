"use client";

import { useState } from "react";
import {
  Pencil,
  Trash2,
  ChevronDown,
  ChevronRight,
  Boxes,
} from "lucide-react";
import { toast } from "sonner";
import type { LegoPack } from "@/hooks/usePacks";
import { useDeletePack } from "@/hooks/usePacks";
import PackEditModal from "./PackEditModal";
import PackLinesRow from "./PackLinesRow";

const fmt = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
});

export default function PacksTable({ packs }: { packs: LegoPack[] }) {
  const deletePack = useDeletePack();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingPack, setEditingPack] = useState<LegoPack | null>(null);

  const handleDelete = async (p: LegoPack) => {
    if (!confirm(`Eliminar el pack "${p.title}"?`)) return;
    try {
      await deletePack.mutateAsync(p.id);
      toast.success("Pack eliminado");
    } catch {
      toast.error("Error al eliminar pack");
    }
  };

  return (
    <>
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#E8E4DE] bg-[#FAF9F7]/50">
                <th className="px-6 py-3 text-left text-xs font-medium text-[#8A8580] uppercase tracking-wider w-8" />
                <th className="px-6 py-3 text-left text-xs font-medium text-[#8A8580] uppercase tracking-wider">
                  Titulo
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-[#8A8580] uppercase tracking-wider">
                  Lineas
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-[#8A8580] uppercase tracking-wider">
                  Precio
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-[#8A8580] uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-[#8A8580] uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8E4DE]">
              {packs.map((p) => (
                <>
                  <tr
                    key={p.id}
                    className="hover:bg-[#FAF9F7]/30 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <button
                        onClick={() =>
                          setExpandedId(expandedId === p.id ? null : p.id)
                        }
                        className="text-[#8A8580] hover:text-[#E87B5A] transition-colors"
                      >
                        {expandedId === p.id ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Boxes className="h-4 w-4 text-[#8A8580]" />
                        <div>
                          <span className="font-medium text-sm text-[#2D2A26]">
                            {p.title}
                          </span>
                          {p.description && (
                            <p className="text-xs text-[#8A8580] mt-0.5 truncate max-w-xs">
                              {p.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center text-sm text-[#8A8580]">
                      {p._count?.lines ?? 0}
                    </td>
                    <td className="px-6 py-4 text-right text-sm text-[#2D2A26]">
                      {fmt.format(p.price)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`inline-flex rounded-[6px] px-2 py-0.5 text-xs font-medium ${
                          p.isActive
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {p.isActive ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setEditingPack(p)}
                          className="rounded-[10px] p-1.5 text-[#8A8580] hover:bg-[#FAF9F7] hover:text-[#E87B5A] transition-colors"
                          title="Editar"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(p)}
                          className="rounded-[10px] p-1.5 text-[#8A8580] hover:bg-red-50 hover:text-[#C75D4A] transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                  {expandedId === p.id && (
                    <PackLinesRow key={`lines-${p.id}`} pack={p} />
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {editingPack && (
        <PackEditModal
          key={editingPack.id}
          pack={editingPack}
          isOpen={!!editingPack}
          onClose={() => setEditingPack(null)}
        />
      )}
    </>
  );
}
