"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { LegoPack, LegoPackLine } from "@/hooks/usePacks";
import {
  usePackLines,
  useCreatePackLine,
  useUpdatePackLine,
  useDeletePackLine,
} from "@/hooks/usePacks";

const fmt = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
});

const inputCls =
  "w-full rounded-[10px] border border-[#E8E4DE] px-3 py-2 text-sm text-[#2D2A26] placeholder:text-[#8A8580] focus:border-[#E87B5A] focus:outline-none focus:ring-1 focus:ring-[#E87B5A]";

export default function PackLinesRow({ pack }: { pack: LegoPack }) {
  const { data } = usePackLines(pack.id);
  const createLine = useCreatePackLine(pack.id);
  const updateLine = useUpdatePackLine(pack.id);
  const deleteLine = useDeletePackLine(pack.id);
  const [adding, setAdding] = useState(false);
  const [newLine, setNewLine] = useState({
    productId: "",
    quantity: 1,
    isRequired: true,
    overridePrice: "",
    sortOrder: 0,
  });

  const lines = data?.lines ?? [];

  const handleAddLine = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createLine.mutateAsync({
        productId: newLine.productId || null,
        quantity: newLine.quantity,
        isRequired: newLine.isRequired,
        overridePrice: newLine.overridePrice
          ? parseFloat(newLine.overridePrice)
          : null,
        sortOrder: newLine.sortOrder,
      });
      toast.success("Linea anadida");
      setAdding(false);
      setNewLine({
        productId: "",
        quantity: 1,
        isRequired: true,
        overridePrice: "",
        sortOrder: 0,
      });
    } catch {
      toast.error("Error al anadir linea");
    }
  };

  const toggleRequired = async (line: LegoPackLine) => {
    try {
      await updateLine.mutateAsync({
        id: line.id,
        isRequired: !line.isRequired,
        isOptional: line.isRequired,
      });
    } catch {
      toast.error("Error al actualizar linea");
    }
  };

  const handleDeleteLine = async (line: LegoPackLine) => {
    if (!confirm("Eliminar esta linea?")) return;
    try {
      await deleteLine.mutateAsync(line.id);
      toast.success("Linea eliminada");
    } catch {
      toast.error("Error al eliminar linea");
    }
  };

  return (
    <tr>
      <td colSpan={6} className="px-6 py-3 bg-[#FAF9F7]/50">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-[#8A8580] uppercase">
              Lineas del pack ({lines.length})
            </p>
            <button
              onClick={() => setAdding(!adding)}
              className="flex items-center gap-1 text-xs text-[#E87B5A] hover:text-[#D56E4F] font-medium transition-colors"
            >
              <Plus className="h-3.5 w-3.5" /> Añadir linea
            </button>
          </div>

          {adding && (
            <form
              onSubmit={handleAddLine}
              className="flex items-end gap-3 bg-white rounded-[10px] p-3 border border-[#E8E4DE]"
            >
              <div className="flex-1">
                <label className="block text-xs text-[#8A8580] mb-1">
                  ID Producto
                </label>
                <input
                  type="text"
                  value={newLine.productId}
                  onChange={(e) =>
                    setNewLine((p) => ({ ...p, productId: e.target.value }))
                  }
                  className={inputCls}
                  placeholder="ID del producto"
                />
              </div>
              <div className="w-20">
                <label className="block text-xs text-[#8A8580] mb-1">
                  Cantidad
                </label>
                <input
                  type="number"
                  min="1"
                  value={newLine.quantity}
                  onChange={(e) =>
                    setNewLine((p) => ({
                      ...p,
                      quantity: parseInt(e.target.value) || 1,
                    }))
                  }
                  className={inputCls}
                />
              </div>
              <div className="w-28">
                <label className="block text-xs text-[#8A8580] mb-1">
                  Precio manual
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={newLine.overridePrice}
                  onChange={(e) =>
                    setNewLine((p) => ({
                      ...p,
                      overridePrice: e.target.value,
                    }))
                  }
                  className={inputCls}
                  placeholder="-"
                />
              </div>
              <button
                type="submit"
                className="rounded-[10px] bg-[#E87B5A] px-3 py-2 text-xs font-medium text-white hover:bg-[#D56E4F] transition-colors"
              >
                Añadir
              </button>
            </form>
          )}

          {lines.length === 0 ? (
            <p className="text-xs text-[#8A8580] py-2">
              Sin lineas. Anade productos, habitaciónes o tratamientos.
            </p>
          ) : (
            <div className="bg-white rounded-[10px] border border-[#E8E4DE] overflow-hidden">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-[#FAF9F7]/50 border-b border-[#E8E4DE]">
                    <th className="px-3 py-2 text-left text-[#8A8580]">Referencia</th>
                    <th className="px-3 py-2 text-center text-[#8A8580]">Cant.</th>
                    <th className="px-3 py-2 text-center text-[#8A8580]">Tipo</th>
                    <th className="px-3 py-2 text-right text-[#8A8580]">Precio</th>
                    <th className="px-3 py-2 text-right text-[#8A8580]">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8E4DE]">
                  {lines.map((line) => (
                    <tr key={line.id} className="hover:bg-[#FAF9F7]/30">
                      <td className="px-3 py-2 text-[#2D2A26]">
                        {line.productId ?? line.roomTypeId ?? line.treatmentId ?? "-"}
                      </td>
                      <td className="px-3 py-2 text-center text-[#8A8580]">
                        {line.quantity}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <button
                          onClick={() => toggleRequired(line)}
                          className={`inline-flex rounded-[6px] px-2 py-0.5 text-xs font-medium ${
                            line.isRequired
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-amber-50 text-amber-700"
                          }`}
                        >
                          {line.isRequired ? "Obligatorio" : "Opcional"}
                        </button>
                      </td>
                      <td className="px-3 py-2 text-right text-[#2D2A26]">
                        {line.overridePrice !== null
                          ? fmt.format(line.overridePrice)
                          : "-"}
                      </td>
                      <td className="px-3 py-2 text-right">
                        <button
                          onClick={() => handleDeleteLine(line)}
                          className="rounded-[10px] p-1 text-[#8A8580] hover:bg-red-50 hover:text-[#C75D4A] transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </td>
    </tr>
  );
}
