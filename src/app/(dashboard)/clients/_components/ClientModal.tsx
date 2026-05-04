"use client";

import { useState } from "react";
import { Client } from "@/hooks/useClients";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { X } from "lucide-react";

const SOURCES = ["Web", "Teléfono", "Email", "Groupon", "Referido", "Presencial", "Otro"];

interface ClientModalProps {
  client?: Client | null;
  onClose: () => void;
  onSave: (data: Partial<Client>) => void;
  saving: boolean;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-[#8A8580]">{label}</span>
      {children}
    </label>
  );
}

export function ClientModal({ client, onClose, onSave, saving }: ClientModalProps) {
  const [form, setForm] = useState({
    name: client?.name ?? "",
    email: client?.email ?? "",
    phone: client?.phone ?? "",
    birthDate: client?.birthDate ? client.birthDate.split("T")[0] : "",
    address: client?.address ?? "",
    notes: client?.notes ?? "",
    conversionSource: client?.conversionSource ?? "",
  });

  function set(key: string, val: string) {
    setForm((prev) => ({ ...prev, [key]: val }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) { toast.error("El nombre es obligatorio"); return; }
    onSave({
      name: form.name.trim(),
      email: form.email.trim() || null,
      phone: form.phone.trim() || null,
      birthDate: form.birthDate || null,
      address: form.address.trim() || null,
      notes: form.notes.trim() || null,
      conversionSource: form.conversionSource || null,
    });
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true">
      <form
        onSubmit={handleSubmit}
        className="mx-4 w-full max-w-md rounded-xl bg-white p-5 shadow-lg"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-[#2D2A26]">
            {client ? "Editar cliente" : "Nuevo cliente"}
          </h3>
          <button type="button" onClick={onClose} className="text-[#8A8580] hover:text-[#2D2A26]">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-3">
          <Field label="Nombre *">
            <Input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Nombre completo" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Email">
              <Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="email@ejemplo.com" />
            </Field>
            <Field label="Teléfono">
              <Input value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+34 600..." />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Fecha nacimiento">
              <Input type="date" value={form.birthDate} onChange={(e) => set("birthDate", e.target.value)} />
            </Field>
            <Field label="Fuente">
              <select
                value={form.conversionSource}
                onChange={(e) => set("conversionSource", e.target.value)}
                className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm"
              >
                <option value="">Sin especificar</option>
                {SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </Field>
          </div>
          <Field label="Dirección">
            <Input value={form.address} onChange={(e) => set("address", e.target.value)} placeholder="Dirección completa" />
          </Field>
          <Field label="Notas">
            <textarea
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              rows={2}
              className="w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm resize-none focus:border-ring focus:ring-3 focus:ring-ring/50 outline-none"
              placeholder="Notas internas..."
            />
          </Field>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
          <Button
            type="submit"
            disabled={saving}
            className="bg-[#E87B5A] text-white hover:bg-[#D56E4F]"
          >
            {saving ? "Guardando..." : client ? "Guardar" : "Crear"}
          </Button>
        </div>
      </form>
    </div>
  );
}

export function DeleteConfirm({ name, onCancel, onConfirm, deleting }: {
  name: string; onCancel: () => void; onConfirm: () => void; deleting: boolean;
}) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true">
      <div className="mx-4 w-full max-w-sm rounded-xl bg-white p-5 shadow-lg">
        <p className="text-sm font-semibold text-[#2D2A26] mb-2">Eliminar cliente</p>
        <p className="text-xs text-[#8A8580] mb-4">
          Se eliminara permanentemente a <span className="font-medium text-[#2D2A26]">{name}</span>. Esta accion no se puede deshacer.
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onCancel}>Cancelar</Button>
          <Button variant="destructive" onClick={onConfirm} disabled={deleting}>
            {deleting ? "Eliminando..." : "Eliminar"}
          </Button>
        </div>
      </div>
    </div>
  );
}
