"use client";

import { useState } from "react";
import { X, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useCreateInvoice, useUpdateInvoice } from "@/hooks/useFinance";
import type { Invoice } from "@/hooks/useFinance";

interface LineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  fiscalRegime: "general" | "reav";
}

interface Props {
  invoice: Invoice | null;
  isOpen: boolean;
  onClose: () => void;
}

const inputCls =
  "w-full rounded-[10px] border border-[#E8E4DE] px-3 py-2 text-sm text-[#2D2A26] placeholder:text-[#8A8580] focus:border-[#E87B5A] focus:outline-none focus:ring-1 focus:ring-[#E87B5A]";

const fmt = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
});

function emptyLine(): LineItem {
  return {
    description: "",
    quantity: 1,
    unitPrice: 0,
    taxRate: 21,
    fiscalRegime: "general",
  };
}

export default function InvoiceModal({ invoice, isOpen, onClose }: Props) {
  const createInvoice = useCreateInvoice();
  const updateInvoice = useUpdateInvoice();

  const [clientId, setClientId] = useState(invoice?.clientId ?? "");
  const [notes, setNotes] = useState(invoice?.notes ?? "");
  const [lines, setLines] = useState<LineItem[]>(() =>
    invoice?.lines?.length
      ? invoice.lines.map((l) => ({
          description: l.description,
          quantity: l.quantity,
          unitPrice: l.unitPrice,
          taxRate: l.taxRate,
          fiscalRegime: l.fiscalRegime as "general" | "reav",
        }))
      : [emptyLine()]
  );

  if (!isOpen) return null;

  const updateLine = (
    idx: number,
    field: keyof LineItem,
    value: string | number
  ) => {
    setLines((prev) =>
      prev.map((l, i) => (i === idx ? { ...l, [field]: value } : l))
    );
  };

  const addLine = () => setLines((prev) => [...prev, emptyLine()]);
  const removeLine = (idx: number) =>
    setLines((prev) => prev.filter((_, i) => i !== idx));

  const subtotal = lines.reduce((s, l) => s + l.quantity * l.unitPrice, 0);
  const taxTotal = lines.reduce(
    (s, l) => s + l.quantity * l.unitPrice * (l.taxRate / 100),
    0
  );
  const total = subtotal + taxTotal;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (lines.some((l) => !l.description.trim())) {
      toast.error("Todas las lineas necesitan descripcion");
      return;
    }

    try {
      if (invoice) {
        await updateInvoice.mutateAsync({
          id: invoice.id,
          clientId: clientId || null,
          notes: notes || null,
        });
        toast.success("Factura actualizada");
      } else {
        await createInvoice.mutateAsync({
          clientId: clientId || null,
          notes: notes || null,
          lines,
        });
        toast.success("Factura creada");
      }
      onClose();
    } catch {
      toast.error("Error al guardar factura");
    }
  };

  const isPending = createInvoice.isPending || updateInvoice.isPending;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-[#E8E4DE] px-6 py-4">
          <h2 className="text-lg font-semibold text-[#2D2A26]">
            {invoice ? "Editar Factura" : "Nueva Factura"}
          </h2>
          <button
            onClick={onClose}
            className="rounded-[10px] p-1.5 text-[#8A8580] hover:bg-[#FAF9F7] transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 p-6">
          {/* Client + Notes */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#2D2A26] mb-1">
                ID Cliente (opcional)
              </label>
              <input
                type="text"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                className={inputCls}
                placeholder="ID del cliente"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#2D2A26] mb-1">
                Notas
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className={inputCls}
                placeholder="Notas opcionales"
              />
            </div>
          </div>

          {/* Line items */}
          {!invoice && (
            <div className="space-y-3">
              <label className="block text-sm font-medium text-[#2D2A26]">
                Lineas
              </label>
              {lines.map((line, i) => (
                <div key={i} className="flex gap-2 items-end">
                  <div className="flex-1">
                    <label className="text-xs text-[#8A8580]">
                      Descripción
                    </label>
                    <input
                      type="text"
                      value={line.description}
                      onChange={(e) =>
                        updateLine(i, "description", e.target.value)
                      }
                      className={inputCls}
                      placeholder="Concepto"
                      required
                    />
                  </div>
                  <div className="w-16">
                    <label className="text-xs text-[#8A8580]">Cant.</label>
                    <input
                      type="number"
                      min="1"
                      value={line.quantity}
                      onChange={(e) =>
                        updateLine(i, "quantity", parseInt(e.target.value) || 1)
                      }
                      className={inputCls}
                    />
                  </div>
                  <div className="w-24">
                    <label className="text-xs text-[#8A8580]">
                      Precio unit.
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={line.unitPrice}
                      onChange={(e) =>
                        updateLine(
                          i,
                          "unitPrice",
                          parseFloat(e.target.value) || 0
                        )
                      }
                      className={inputCls}
                    />
                  </div>
                  <div className="w-16">
                    <label className="text-xs text-[#8A8580]">IVA %</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={line.taxRate}
                      onChange={(e) =>
                        updateLine(
                          i,
                          "taxRate",
                          parseFloat(e.target.value) || 0
                        )
                      }
                      className={inputCls}
                    />
                  </div>
                  <div className="w-24">
                    <label className="text-xs text-[#8A8580]">Regimen</label>
                    <select
                      value={line.fiscalRegime}
                      onChange={(e) =>
                        updateLine(i, "fiscalRegime", e.target.value)
                      }
                      className={inputCls}
                    >
                      <option value="general">General</option>
                      <option value="reav">REAV</option>
                    </select>
                  </div>
                  <div className="w-20 text-right text-sm font-medium text-[#2D2A26] pb-2">
                    {fmt.format(line.quantity * line.unitPrice)}
                  </div>
                  {lines.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeLine(i)}
                      className="rounded-[10px] p-1.5 text-[#8A8580] hover:bg-red-50 hover:text-[#C75D4A] transition-colors mb-1"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addLine}
                className="flex items-center gap-1 text-sm text-[#E87B5A] hover:text-[#D56E4F] transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                Añadir linea
              </button>
            </div>
          )}

          {/* Summary */}
          {!invoice && (
            <div className="border-t border-[#E8E4DE] pt-4 text-right space-y-1">
              <p className="text-sm text-[#8A8580]">
                Subtotal: {fmt.format(subtotal)}
              </p>
              <p className="text-sm text-[#8A8580]">
                IVA total: {fmt.format(taxTotal)}
              </p>
              <p className="text-lg font-bold text-[#2D2A26]">
                TOTAL: {fmt.format(total)}
              </p>
            </div>
          )}

          {/* Actions */}
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
              disabled={isPending}
              className="rounded-[10px] bg-[#E87B5A] px-4 py-2 text-sm font-medium text-white hover:bg-[#D56E4F] transition-colors disabled:opacity-50"
            >
              {isPending
                ? "Guardando..."
                : invoice
                  ? "Guardar Cambios"
                  : "Crear Factura"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
