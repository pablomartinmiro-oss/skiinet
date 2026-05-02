"use client";

import { useState } from "react";
import { Plus, Trash2, FileText, Upload, ExternalLink } from "lucide-react";
import { useReavExpedient } from "@/hooks/useReav";
import type { ReavExpedient } from "@/hooks/useReav";

const fmt = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
});

const inputCls =
  "w-full rounded-[10px] border border-[#E8E4DE] px-3 py-2 text-sm text-[#2D2A26] focus:border-[#E87B5A] focus:outline-none focus:ring-1 focus:ring-[#E87B5A]";

interface Props {
  expedient: ReavExpedient;
  onUpdate: (d: Partial<{
    operationType: string;
    costPercentage: number;
    marginPercentage: number;
    marginAmount: number;
    taxableBase: number;
    vat: number;
  }>) => void;
  onAddCost: (d: { description: string; cost: number; notes?: string | null }) => void;
  onDeleteCost: (costId: string) => void;
  onAddDocument: (d: { type: string; url: string }) => void;
  onDeleteDocument: (docId: string) => void;
}

export default function ExpedientDetail({
  expedient,
  onUpdate,
  onAddCost,
  onDeleteCost,
  onAddDocument,
  onDeleteDocument,
}: Props) {
  const { data } = useReavExpedient(expedient.id);
  const detail = data?.expedient || expedient;
  const costs = detail.costs || [];
  const documents = detail.documents || [];

  // Cost form
  const [costForm, setCostForm] = useState({ description: "", cost: 0, notes: "" });
  const [showCostForm, setShowCostForm] = useState(false);

  // Doc form
  const [docForm, setDocForm] = useState({ type: "client" as string, url: "" });
  const [showDocForm, setShowDocForm] = useState(false);

  const handleCostSubmit = () => {
    if (!costForm.description || costForm.cost <= 0) return;
    onAddCost({
      description: costForm.description,
      cost: costForm.cost,
      notes: costForm.notes || null,
    });
    setCostForm({ description: "", cost: 0, notes: "" });
    setShowCostForm(false);
  };

  const handleDocSubmit = () => {
    if (!docForm.url) return;
    onAddDocument({ type: docForm.type, url: docForm.url });
    setDocForm({ type: "client", url: "" });
    setShowDocForm(false);
  };

  const totalCosts = costs.reduce((sum, c) => sum + c.cost, 0);

  return (
    <div className="bg-[#FAF9F7] border-t border-[#E8E4DE] p-6 space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Margen", value: fmt.format(detail.marginAmount) },
          { label: "Base imponible", value: fmt.format(detail.taxableBase) },
          { label: "Total costes", value: fmt.format(totalCosts) },
          { label: "Documentos", value: String(documents.length) },
        ].map((card) => (
          <div key={card.label} className="rounded-2xl bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
            <p className="text-xs text-[#8A8580] mb-1">{card.label}</p>
            <p className="text-lg font-semibold text-[#2D2A26]">{card.value}</p>
          </div>
        ))}
      </div>

      {/* Costs section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-[#2D2A26]">
            Costes del expediente
          </h3>
          <button
            onClick={() => setShowCostForm(!showCostForm)}
            className="flex items-center gap-1 rounded-[10px] bg-[#E87B5A] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#D56E4F] transition-colors"
          >
            <Plus className="h-3 w-3" /> Añadir Coste
          </button>
        </div>

        {showCostForm && (
          <div className="rounded-2xl bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)] mb-3 space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <input
                  type="text"
                  placeholder="Descripción del coste"
                  value={costForm.description}
                  onChange={(e) =>
                    setCostForm((p) => ({ ...p, description: e.target.value }))
                  }
                  className={inputCls}
                />
              </div>
              <div>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Importe"
                  value={costForm.cost || ""}
                  onChange={(e) =>
                    setCostForm((p) => ({
                      ...p,
                      cost: parseFloat(e.target.value) || 0,
                    }))
                  }
                  className={inputCls}
                />
              </div>
            </div>
            <input
              type="text"
              placeholder="Notas (opcional)"
              value={costForm.notes}
              onChange={(e) =>
                setCostForm((p) => ({ ...p, notes: e.target.value }))
              }
              className={inputCls}
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowCostForm(false)}
                className="rounded-[10px] border border-[#E8E4DE] px-3 py-1.5 text-xs font-medium text-[#8A8580] hover:bg-[#FAF9F7] transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleCostSubmit}
                className="rounded-[10px] bg-[#5B8C6D] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#4a7a5c] transition-colors"
              >
                Guardar
              </button>
            </div>
          </div>
        )}

        {costs.length === 0 ? (
          <p className="text-xs text-[#8A8580]">Sin costes registrados</p>
        ) : (
          <div className="rounded-2xl bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#E8E4DE] bg-[#FAF9F7]/50">
                  <th className="px-4 py-2 text-left text-xs font-medium text-[#8A8580]">
                    Descripción
                  </th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-[#8A8580]">
                    Importe
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-[#8A8580]">
                    Notas
                  </th>
                  <th className="px-4 py-2 w-10" />
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E4DE]">
                {costs.map((c) => (
                  <tr key={c.id} className="hover:bg-[#FAF9F7]/30">
                    <td className="px-4 py-2 text-sm text-[#2D2A26]">
                      {c.description}
                    </td>
                    <td className="px-4 py-2 text-right text-sm text-[#2D2A26]">
                      {fmt.format(c.cost)}
                    </td>
                    <td className="px-4 py-2 text-xs text-[#8A8580] max-w-[200px] truncate">
                      {c.notes || "--"}
                    </td>
                    <td className="px-4 py-2 text-right">
                      <button
                        onClick={() => onDeleteCost(c.id)}
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

      {/* Documents section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-[#2D2A26]">Documentos</h3>
          <button
            onClick={() => setShowDocForm(!showDocForm)}
            className="flex items-center gap-1 rounded-[10px] bg-[#E87B5A] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#D56E4F] transition-colors"
          >
            <Upload className="h-3 w-3" /> Añadir Documento
          </button>
        </div>

        {showDocForm && (
          <div className="rounded-2xl bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)] mb-3 space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <div>
                <select
                  value={docForm.type}
                  onChange={(e) =>
                    setDocForm((p) => ({ ...p, type: e.target.value }))
                  }
                  className={inputCls}
                >
                  <option value="client">Cliente</option>
                  <option value="provider">Proveedor</option>
                </select>
              </div>
              <div className="col-span-2">
                <input
                  type="url"
                  placeholder="URL del documento"
                  value={docForm.url}
                  onChange={(e) =>
                    setDocForm((p) => ({ ...p, url: e.target.value }))
                  }
                  className={inputCls}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowDocForm(false)}
                className="rounded-[10px] border border-[#E8E4DE] px-3 py-1.5 text-xs font-medium text-[#8A8580] hover:bg-[#FAF9F7] transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleDocSubmit}
                className="rounded-[10px] bg-[#5B8C6D] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#4a7a5c] transition-colors"
              >
                Guardar
              </button>
            </div>
          </div>
        )}

        {documents.length === 0 ? (
          <p className="text-xs text-[#8A8580]">Sin documentos adjuntos</p>
        ) : (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {documents.map((d) => (
              <div
                key={d.id}
                className="flex items-center justify-between rounded-2xl bg-white p-3 shadow-[0_1px_3px_rgba(0,0,0,0.04)]"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <FileText className="h-4 w-4 shrink-0 text-[#8A8580]" />
                  <div className="min-w-0">
                    <span className="inline-flex rounded-[6px] bg-[#FAF9F7] px-2 py-0.5 text-xs font-medium text-[#8A8580] mb-0.5">
                      {d.type === "client" ? "Cliente" : "Proveedor"}
                    </span>
                    <p className="text-xs text-[#8A8580] truncate max-w-[200px]">
                      {d.url}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <a
                    href={d.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-[10px] p-1 text-[#8A8580] hover:bg-[#FAF9F7] hover:text-[#E87B5A] transition-colors"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                  <button
                    onClick={() => onDeleteDocument(d.id)}
                    className="rounded-[10px] p-1 text-[#8A8580] hover:bg-red-50 hover:text-[#C75D4A] transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
