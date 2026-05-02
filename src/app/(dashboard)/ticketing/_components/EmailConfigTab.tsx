"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, Mail, X } from "lucide-react";
import { toast } from "sonner";
import {
  useEmailConfigs,
  useCreateEmailConfig,
  useUpdateEmailConfig,
  useDeleteEmailConfig,
} from "@/hooks/useTicketing";
import type { CouponEmailConfig } from "@/hooks/useTicketing";
import { PageSkeleton } from "@/components/shared/LoadingSkeleton";

const inputCls =
  "w-full rounded-[10px] border border-[#E8E4DE] px-3 py-2 text-sm text-[#2D2A26] placeholder:text-[#8A8580] focus:border-[#E87B5A] focus:outline-none focus:ring-1 focus:ring-[#E87B5A]";

const EVENT_TRIGGERS = [
  { value: "redemption_received", label: "Cupon recibido" },
  { value: "reservation_created", label: "Reserva creada" },
  { value: "reservation_confirmed", label: "Reserva confirmada" },
  { value: "reservation_cancelled", label: "Reserva cancelada" },
  { value: "payment_received", label: "Pago recibido" },
  { value: "reminder_24h", label: "Recordatorio 24h" },
];

const EVENT_LABELS: Record<string, string> = Object.fromEntries(
  EVENT_TRIGGERS.map((t) => [t.value, t.label])
);

interface ConfigForm {
  templateId: string;
  eventTrigger: string;
  enabled: boolean;
}

function ConfigModal({ config, isOpen, onClose, onSave }: {
  config: CouponEmailConfig | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (d: ConfigForm & { id?: string }) => void;
}) {
  const [form, setForm] = useState<ConfigForm>(() =>
    config
      ? { templateId: config.templateId, eventTrigger: config.eventTrigger, enabled: config.enabled }
      : { templateId: "", eventTrigger: "redemption_received", enabled: true }
  );
  if (!isOpen) return null;
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ ...(config && { id: config.id }), ...form });
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-[#E8E4DE] px-6 py-4">
          <h2 className="text-lg font-semibold text-[#2D2A26]">
            {config ? "Editar Configuración" : "Nueva Configuración"}
          </h2>
          <button onClick={onClose} className="rounded-[10px] p-1.5 text-[#8A8580] hover:bg-[#FAF9F7] transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          <div>
            <label className="block text-sm font-medium text-[#2D2A26] mb-1">
              ID de Plantilla
            </label>
            <input
              type="text"
              value={form.templateId}
              onChange={(e) => setForm((p) => ({ ...p, templateId: e.target.value }))}
              className={inputCls}
              required
              placeholder="template_welcome_01"
            />
            <p className="text-xs text-[#8A8580] mt-1">
              Identificador de la plantilla de email
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#2D2A26] mb-1">
              Evento Disparador
            </label>
            <select
              value={form.eventTrigger}
              onChange={(e) => setForm((p) => ({ ...p, eventTrigger: e.target.value }))}
              className={inputCls}
            >
              {EVENT_TRIGGERS.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="cfg-enabled"
              checked={form.enabled}
              onChange={(e) => setForm((p) => ({ ...p, enabled: e.target.checked }))}
              className="h-4 w-4 rounded border-[#E8E4DE] text-[#E87B5A] focus:ring-[#E87B5A]"
            />
            <label htmlFor="cfg-enabled" className="text-sm font-medium text-[#2D2A26]">
              Habilitado
            </label>
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
              {config ? "Guardar Cambios" : "Crear Configuración"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function EmailConfigTab() {
  const { data, isLoading } = useEmailConfigs();
  const createCfg = useCreateEmailConfig();
  const updateCfg = useUpdateEmailConfig();
  const deleteCfg = useDeleteEmailConfig();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<CouponEmailConfig | null>(null);

  const configs = data?.configs ?? [];

  const handleAdd = () => { setEditing(null); setModalOpen(true); };
  const handleEdit = (c: CouponEmailConfig) => { setEditing(c); setModalOpen(true); };

  const handleToggle = async (c: CouponEmailConfig) => {
    try {
      await updateCfg.mutateAsync({ id: c.id, enabled: !c.enabled });
      toast.success(c.enabled ? "Configuración deshabilitada" : "Configuración habilitada");
    } catch {
      toast.error("Error al actualizar configuración");
    }
  };

  const handleDelete = async (c: CouponEmailConfig) => {
    if (!confirm("Eliminar esta configuración de email?")) return;
    try {
      await deleteCfg.mutateAsync(c.id);
      toast.success("Configuración eliminada");
    } catch {
      toast.error("Error al eliminar configuración");
    }
  };

  const handleSave = async (d: ConfigForm & { id?: string }) => {
    try {
      if (d.id) {
        await updateCfg.mutateAsync({ id: d.id, ...d });
        toast.success("Configuración actualizada");
      } else {
        await createCfg.mutateAsync(d);
        toast.success("Configuración creada");
      }
      setModalOpen(false);
    } catch {
      toast.error("Error al guardar configuración");
    }
  };

  if (isLoading) return <PageSkeleton />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-[#8A8580]">
            {configs.length} regla{configs.length !== 1 ? "s" : ""} de email configurada{configs.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={handleAdd}
          className="flex items-center gap-2 rounded-[10px] bg-[#E87B5A] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#D56E4F] transition-colors"
        >
          <Plus className="h-4 w-4" /> Añadir Regla
        </button>
      </div>

      {configs.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <Mail className="mx-auto h-10 w-10 text-[#8A8580] mb-3" />
          <p className="text-sm text-[#8A8580]">No hay reglas de email configuradas</p>
          <p className="text-xs text-[#8A8580] mt-1">
            Configura el envio automatico de emails al recibir cupones o crear reservas
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {configs.map((c) => (
            <div
              key={c.id}
              className="flex items-center justify-between glass-card px-6 py-4"
            >
              <div className="flex items-center gap-4">
                <div className={`flex h-10 w-10 items-center justify-center rounded-[10px] ${
                  c.enabled ? "bg-[#E87B5A]/10 text-[#E87B5A]" : "bg-gray-100 text-gray-400"
                }`}>
                  <Mail className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-[#2D2A26]">
                    {EVENT_LABELS[c.eventTrigger] ?? c.eventTrigger}
                  </p>
                  <p className="text-xs text-[#8A8580]">
                    Plantilla: <span className="font-mono">{c.templateId}</span>
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleToggle(c)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    c.enabled ? "bg-[#E87B5A]" : "bg-gray-200"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      c.enabled ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
                <button
                  onClick={() => handleEdit(c)}
                  className="rounded-[10px] p-1.5 text-[#8A8580] hover:bg-[#FAF9F7] hover:text-[#E87B5A] transition-colors"
                  title="Editar"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDelete(c)}
                  className="rounded-[10px] p-1.5 text-[#8A8580] hover:bg-red-50 hover:text-[#C75D4A] transition-colors"
                  title="Eliminar"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfigModal
        key={editing?.id ?? "new"}
        config={editing}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
      />
    </div>
  );
}
