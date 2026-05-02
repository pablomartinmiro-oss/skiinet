"use client";

import { useState } from "react";
import { X, Plus, Trash2, Upload, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useBatchRedemption } from "@/hooks/useTicketing";
import type { BatchCouponInput, BatchResult } from "@/hooks/useTicketing";

const inputCls =
  "w-full rounded-[10px] border border-[#E8E4DE] px-3 py-2 text-sm text-[#2D2A26] placeholder:text-[#8A8580] focus:border-[#E87B5A] focus:outline-none focus:ring-1 focus:ring-[#E87B5A]";

const CONFIDENCE_BADGE: Record<string, { label: string; cls: string }> = {
  alta: { label: "Alta", cls: "bg-emerald-50 text-emerald-700" },
  media: { label: "Media", cls: "bg-amber-50 text-amber-700" },
  baja: { label: "Baja", cls: "bg-red-50 text-red-700" },
  conflicto: { label: "Conflicto", cls: "bg-purple-50 text-purple-700" },
};

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

interface CouponRow {
  code: string;
  email: string;
  phone: string;
  imageBase64?: string;
  imageName?: string;
}

export default function BatchRedemptionModal({ isOpen, onClose }: Props) {
  const batchMut = useBatchRedemption();
  const [rows, setRows] = useState<CouponRow[]>([
    { code: "", email: "", phone: "" },
  ]);
  const [results, setResults] = useState<BatchResult[] | null>(null);

  if (!isOpen) return null;

  const addRow = () => {
    if (rows.length >= 10) return;
    setRows((prev) => [...prev, { code: "", email: "", phone: "" }]);
  };

  const removeRow = (idx: number) => {
    setRows((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateRow = (idx: number, field: keyof CouponRow, value: string) => {
    setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, [field]: value } : r)));
  };

  const handleFileUpload = (idx: number, file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(",")[1];
      setRows((prev) =>
        prev.map((r, i) =>
          i === idx ? { ...r, imageBase64: base64, imageName: file.name } : r
        )
      );
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    const validRows = rows.filter((r) => r.code.trim() || r.imageBase64);
    if (validRows.length === 0) {
      toast.error("Anade al menos un cupon");
      return;
    }

    const coupons: BatchCouponInput[] = validRows.map((r) => ({
      code: r.code.trim(),
      email: r.email.trim() || undefined,
      phone: r.phone.trim() || undefined,
      imageBase64: r.imageBase64,
    }));

    try {
      const res = await batchMut.mutateAsync(coupons);
      setResults(res.results);
      toast.success(`${res.summary.created} cupones creados, ${res.summary.duplicates} duplicados`);
    } catch {
      toast.error("Error al procesar lote");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 overflow-y-auto py-8">
      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-xl mx-4">
        <div className="flex items-center justify-between border-b border-[#E8E4DE] px-6 py-4">
          <h2 className="text-lg font-semibold text-[#2D2A26]">
            Canjear Lote de Cupones
          </h2>
          <button onClick={onClose} className="rounded-[10px] p-1.5 text-[#8A8580] hover:bg-[#FAF9F7] transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {results ? (
            /* Results view */
            <div className="space-y-3">
              <p className="text-sm font-medium text-[#2D2A26]">Resultados del lote</p>
              {results.map((r) => (
                <div key={r.index} className="flex items-center justify-between rounded-lg border border-[#E8E4DE] px-4 py-3">
                  <div>
                    <p className="text-sm font-mono font-medium text-[#2D2A26]">{r.code}</p>
                    {r.ocrConfidence && (
                      <span className={`inline-flex rounded-[6px] px-2 py-0.5 text-xs font-medium mt-1 ${CONFIDENCE_BADGE[r.ocrConfidence]?.cls ?? ""}`}>
                        OCR: {CONFIDENCE_BADGE[r.ocrConfidence]?.label ?? r.ocrConfidence}
                      </span>
                    )}
                  </div>
                  <span className={`inline-flex rounded-[6px] px-2.5 py-1 text-xs font-medium ${
                    r.status === "created" ? "bg-emerald-50 text-emerald-700" :
                    r.status === "duplicate" ? "bg-amber-50 text-amber-700" :
                    "bg-red-50 text-red-700"
                  }`}>
                    {r.status === "created" ? "Creado" : r.status === "duplicate" ? "Duplicado" : "Error"}
                  </span>
                </div>
              ))}
              <button onClick={onClose} className="w-full rounded-[10px] bg-[#E87B5A] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#D56E4F] transition-colors">
                Cerrar
              </button>
            </div>
          ) : (
            /* Input view */
            <>
              {rows.map((row, idx) => (
                <div key={idx} className="rounded-lg border border-[#E8E4DE] p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-[#8A8580]">Cupon {idx + 1}</span>
                    {rows.length > 1 && (
                      <button onClick={() => removeRow(idx)} className="text-[#8A8580] hover:text-[#C75D4A]">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <input type="text" value={row.code} onChange={(e) => updateRow(idx, "code", e.target.value)} className={inputCls} placeholder="Codigo cupon" />
                    <input type="email" value={row.email} onChange={(e) => updateRow(idx, "email", e.target.value)} className={inputCls} placeholder="Email (opcional)" />
                    <input type="text" value={row.phone} onChange={(e) => updateRow(idx, "phone", e.target.value)} className={inputCls} placeholder="Teléfono (opt)" />
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-2 rounded-[10px] border border-dashed border-[#E8E4DE] px-3 py-2 text-xs text-[#8A8580] hover:border-[#E87B5A] hover:text-[#E87B5A] cursor-pointer transition-colors">
                      <Upload className="h-3.5 w-3.5" />
                      {row.imageName ?? "Subir imagen OCR"}
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handleFileUpload(idx, f);
                      }} />
                    </label>
                    {row.imageName && <span className="text-xs text-[#5B8C6D]">Listo</span>}
                  </div>
                </div>
              ))}

              <div className="flex items-center justify-between pt-2">
                <button onClick={addRow} disabled={rows.length >= 10} className="flex items-center gap-1 text-sm text-[#E87B5A] hover:text-[#D56E4F] disabled:opacity-50 transition-colors">
                  <Plus className="h-4 w-4" /> Añadir cupon ({rows.length}/10)
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={batchMut.isPending}
                  className="rounded-[10px] bg-[#E87B5A] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#D56E4F] disabled:opacity-50 transition-colors flex items-center gap-2"
                >
                  {batchMut.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  {batchMut.isPending ? "Procesando..." : "Canjear Lote"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
