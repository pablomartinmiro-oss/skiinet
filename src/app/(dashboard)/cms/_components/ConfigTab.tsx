"use client";

import { useState } from "react";
import { Plus, Pencil, Settings, X, Save } from "lucide-react";
import { toast } from "sonner";
import {
  useSiteSettings,
  useUpsertSiteSetting,
} from "@/hooks/useCms";
import type { SiteSetting } from "@/hooks/useCms";
import { PageSkeleton } from "@/components/shared/LoadingSkeleton";

const inputCls =
  "w-full rounded-[10px] border border-[#E8E4DE] px-3 py-2 text-sm text-[#2D2A26] placeholder:text-[#8A8580] focus:border-[#E87B5A] focus:outline-none focus:ring-1 focus:ring-[#E87B5A]";

interface SettingForm {
  key: string;
  valueJson: string;
}

function SettingModal({
  setting,
  isOpen,
  onClose,
  onSave,
}: {
  setting: SiteSetting | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (d: SettingForm) => void;
}) {
  const [form, setForm] = useState<SettingForm>(() =>
    setting
      ? {
          key: setting.key,
          valueJson: JSON.stringify(setting.value, null, 2),
        }
      : { key: "", valueJson: "{}" }
  );
  const [jsonError, setJsonError] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      JSON.parse(form.valueJson);
      setJsonError("");
      onSave(form);
    } catch {
      setJsonError("JSON invalido");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-[#E8E4DE] px-6 py-4">
          <h2 className="text-lg font-semibold text-[#2D2A26]">
            {setting ? "Editar Configuración" : "Nueva Configuración"}
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
              Clave
            </label>
            <input
              type="text"
              value={form.key}
              onChange={(e) =>
                setForm((p) => ({ ...p, key: e.target.value }))
              }
              className={inputCls}
              placeholder="site_name, primary_color, etc."
              required
              disabled={!!setting}
            />
            {setting && (
              <p className="text-xs text-[#8A8580] mt-1">
                La clave no se puede cambiar
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-[#2D2A26] mb-1">
              Valor (JSON)
            </label>
            <textarea
              value={form.valueJson}
              onChange={(e) => {
                setForm((p) => ({ ...p, valueJson: e.target.value }));
                setJsonError("");
              }}
              className={`${inputCls} min-h-[140px] resize-y font-mono text-xs`}
              placeholder='{ "valor": "ejemplo" }'
            />
            {jsonError && (
              <p className="text-xs text-[#C75D4A] mt-1">{jsonError}</p>
            )}
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
              <Save className="inline h-4 w-4 mr-1" />
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ConfigTab() {
  const { data, isLoading } = useSiteSettings();
  const upsertSetting = useUpsertSiteSetting();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<SiteSetting | null>(null);

  const settings = data?.settings ?? [];

  const handleAdd = () => {
    setEditing(null);
    setModalOpen(true);
  };
  const handleEdit = (s: SiteSetting) => {
    setEditing(s);
    setModalOpen(true);
  };

  const handleSave = async (d: SettingForm) => {
    try {
      const value = JSON.parse(d.valueJson) as Record<string, unknown>;
      await upsertSetting.mutateAsync({ key: d.key, value });
      toast.success("Configuración guardada");
      setModalOpen(false);
    } catch {
      toast.error("Error al guardar configuración");
    }
  };

  if (isLoading) return <PageSkeleton />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-[#8A8580]">
          {settings.length} clave{settings.length !== 1 ? "s" : ""} de
          configuración
        </p>
        <button
          onClick={handleAdd}
          className="flex items-center gap-2 rounded-[10px] bg-[#E87B5A] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#D56E4F] transition-colors"
        >
          <Plus className="h-4 w-4" /> Nueva Clave
        </button>
      </div>

      {settings.length === 0 ? (
        <div className="rounded-2xl bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-12 text-center">
          <Settings className="mx-auto h-10 w-10 text-[#8A8580] mb-3" />
          <p className="text-sm text-[#8A8580]">
            No hay configuraciónes del sitio
          </p>
          <p className="text-xs text-[#8A8580] mt-1">
            Anade claves como nombre del sitio, colores, etc.
          </p>
        </div>
      ) : (
        <div className="rounded-2xl bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#E8E4DE] bg-[#FAF9F7]/50">
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#8A8580] uppercase tracking-wider">
                    Clave
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#8A8580] uppercase tracking-wider">
                    Valor
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-[#8A8580] uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E4DE]">
                {settings.map((s) => (
                  <tr
                    key={s.id}
                    className="hover:bg-[#FAF9F7]/30 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <span className="font-mono text-sm font-medium text-[#2D2A26]">
                        {s.key}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <pre className="text-xs text-[#8A8580] max-w-md truncate font-mono">
                        {JSON.stringify(s.value)}
                      </pre>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleEdit(s)}
                        className="rounded-[10px] p-1.5 text-[#8A8580] hover:bg-[#FAF9F7] hover:text-[#E87B5A] transition-colors"
                        title="Editar"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <SettingModal
        key={editing?.id ?? "new"}
        setting={editing}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
      />
    </div>
  );
}
