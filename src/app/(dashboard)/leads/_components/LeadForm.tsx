"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useCreateLead, useUpdateLead, type Lead } from "@/hooks/useLeads";
import { LEAD_STAGES, LEAD_SOURCES } from "./constants";
import { toast } from "sonner";

export function LeadForm({
  open,
  onClose,
  lead,
}: {
  open: boolean;
  onClose: () => void;
  lead?: Lead | null;
}) {
  const isEdit = !!lead;
  const createLead = useCreateLead();
  const updateLead = useUpdateLead();

  const [form, setForm] = useState({
    name: lead?.name ?? "",
    email: lead?.email ?? "",
    phone: lead?.phone ?? "",
    company: lead?.company ?? "",
    source: lead?.source ?? "manual",
    status: lead?.status ?? "nuevo",
    score: lead?.score ?? 0,
    notes: lead?.notes ?? "",
    tags: (lead?.tags ?? []).join(", "),
  });

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Nombre obligatorio");
      return;
    }
    const payload = {
      name: form.name.trim(),
      email: form.email.trim() || null,
      phone: form.phone.trim() || null,
      company: form.company.trim() || null,
      source: form.source,
      status: form.status,
      score: Number(form.score) || 0,
      notes: form.notes.trim() || null,
      tags: form.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
    };
    try {
      if (isEdit && lead) {
        await updateLead.mutateAsync({ id: lead.id, ...payload });
        toast.success("Lead actualizado");
      } else {
        await createLead.mutateAsync(payload);
        toast.success("Lead creado");
      }
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al guardar");
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar lead" : "Nuevo lead"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-3">
          <Field label="Nombre" required>
            <input
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm"
              required
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Email">
              <input
                type="email"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
                className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm"
              />
            </Field>
            <Field label="Teléfono">
              <input
                value={form.phone}
                onChange={(e) => update("phone", e.target.value)}
                className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm"
              />
            </Field>
          </div>

          <Field label="Empresa">
            <input
              value={form.company}
              onChange={(e) => update("company", e.target.value)}
              className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm"
            />
          </Field>

          <div className="grid grid-cols-3 gap-3">
            <Field label="Origen">
              <select
                value={form.source}
                onChange={(e) => update("source", e.target.value)}
                className="w-full rounded-lg border border-border bg-white px-2 py-2 text-sm"
              >
                {LEAD_SOURCES.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Estado">
              <select
                value={form.status}
                onChange={(e) => update("status", e.target.value)}
                className="w-full rounded-lg border border-border bg-white px-2 py-2 text-sm"
              >
                {LEAD_STAGES.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Score">
              <input
                type="number"
                min={0}
                max={100}
                value={form.score}
                onChange={(e) => update("score", Number(e.target.value))}
                className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm"
              />
            </Field>
          </div>

          <Field label="Etiquetas (separadas por coma)">
            <input
              value={form.tags}
              onChange={(e) => update("tags", e.target.value)}
              placeholder="vip, baqueira, familia"
              className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm"
            />
          </Field>

          <Field label="Notas">
            <textarea
              value={form.notes}
              onChange={(e) => update("notes", e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm"
            />
          </Field>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-border bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={createLead.isPending || updateLead.isPending}
              className="rounded-lg bg-coral px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
            >
              {isEdit ? "Guardar cambios" : "Crear lead"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-slate-700">
        {label}
        {required && <span className="ml-0.5 text-rose-500">*</span>}
      </span>
      {children}
    </label>
  );
}
