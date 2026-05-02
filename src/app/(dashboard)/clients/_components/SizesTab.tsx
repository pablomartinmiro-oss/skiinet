"use client";

import { useState, useEffect } from "react";
import { Footprints, Ruler, Weight, HardHat } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { Client } from "@/hooks/useClients";
import { useUpdateClient } from "@/hooks/useClients";
import { HELMET_SIZES } from "./constants";

const KEYS = ["bootSize", "height", "weight", "helmetSize"] as const;

export function SizesTab({ client }: { client: Client }) {
  const update = useUpdateClient();
  const [form, setForm] = useState(() => initial(client));

  useEffect(() => {
    setForm(initial(client));
  }, [client]);

  function dirty() {
    const orig = initial(client);
    return KEYS.some((k) => form[k] !== orig[k]);
  }

  function handleSave() {
    update.mutate(
      {
        id: client.id,
        bootSize: form.bootSize.trim() || null,
        height: form.height ? Number(form.height) : null,
        weight: form.weight ? Number(form.weight) : null,
        helmetSize: (form.helmetSize || null) as Client["helmetSize"],
      },
      {
        onSuccess: () => toast.success("Tallas actualizadas"),
        onError: () => toast.error("Error al actualizar"),
      }
    );
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <SizeCard icon={Footprints} label="Talla bota (EU)" color="#E87B5A">
          <Input
            value={form.bootSize}
            onChange={(e) => setForm({ ...form, bootSize: e.target.value })}
            placeholder="ej. 42"
            className="text-center font-semibold"
          />
        </SizeCard>
        <SizeCard icon={HardHat} label="Casco" color="#D4A853">
          <select
            value={form.helmetSize}
            onChange={(e) => setForm({ ...form, helmetSize: e.target.value })}
            className="h-9 w-full rounded-[10px] border border-[#E8E4DE] bg-white px-3 text-center text-sm font-semibold text-[#2D2A26] focus:border-[#E87B5A] focus:outline-none"
          >
            <option value="">—</option>
            {HELMET_SIZES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </SizeCard>
        <SizeCard icon={Ruler} label="Altura (cm)" color="#5B8C6D">
          <Input
            type="number"
            min="50"
            max="250"
            value={form.height}
            onChange={(e) => setForm({ ...form, height: e.target.value })}
            placeholder="ej. 175"
            className="text-center font-semibold"
          />
        </SizeCard>
        <SizeCard icon={Weight} label="Peso (kg)" color="#7C9CB8">
          <Input
            type="number"
            min="10"
            max="300"
            value={form.weight}
            onChange={(e) => setForm({ ...form, weight: e.target.value })}
            placeholder="ej. 75"
            className="text-center font-semibold"
          />
        </SizeCard>
      </div>

      <div className="flex justify-end pt-2">
        <Button
          onClick={handleSave}
          disabled={!dirty() || update.isPending}
          className="bg-[#E87B5A] text-white hover:bg-[#D56E4F]"
        >
          {update.isPending ? "Guardando..." : "Guardar tallas"}
        </Button>
      </div>
    </div>
  );
}

function SizeCard({
  icon: Icon,
  label,
  color,
  children,
}: {
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  label: string;
  color: string;
  children: React.ReactNode;
}) {
  return (
    <div className="glass-card p-3">
      <div className="flex items-center gap-2 mb-2">
        <div
          className="flex h-7 w-7 items-center justify-center rounded-lg"
          style={{ backgroundColor: `${color}1A` }}
        >
          <Icon className="h-3.5 w-3.5" style={{ color }} />
        </div>
        <span className="text-xs font-medium text-[#8A8580]">{label}</span>
      </div>
      {children}
    </div>
  );
}

function initial(client: Client) {
  return {
    bootSize: client.bootSize ?? "",
    height: client.height != null ? String(client.height) : "",
    weight: client.weight != null ? String(client.weight) : "",
    helmetSize: client.helmetSize ?? "",
  };
}
