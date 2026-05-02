"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, Search, X, Calculator } from "lucide-react";
import { toast } from "sonner";
import {
  useRentalProfiles,
  useCreateRentalProfile,
  useUpdateRentalProfile,
  useDeleteRentalProfile,
} from "@/hooks/useRental";
import type { CustomerSizingProfile } from "@/hooks/useRental";
import { calculateDin } from "@/lib/rental/din-calculator";
import { PageSkeleton } from "@/components/shared/LoadingSkeleton";

const inputCls =
  "w-full rounded-[10px] border border-[#E8E4DE] px-3 py-2 text-sm text-[#2D2A26] placeholder:text-[#8A8580] focus:border-[#E87B5A] focus:outline-none focus:ring-1 focus:ring-[#E87B5A]";

const ABILITY_LABELS: Record<string, string> = {
  beginner: "Principiante",
  intermediate: "Intermedio",
  advanced: "Avanzado",
  expert: "Experto",
};

interface ProfileForm {
  clientEmail: string;
  clientName: string;
  clientPhone: string;
  height: string;
  weight: string;
  shoeSize: string;
  age: string;
  abilityLevel: string;
  bootSoleLength: string;
  preferredDinSetting: string;
  notes: string;
}

export default function ProfilesTab() {
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<CustomerSizingProfile | null>(null);
  const [showModal, setShowModal] = useState(false);

  const { data, isLoading } = useRentalProfiles(search || undefined);
  const createMut = useCreateRentalProfile();
  const updateMut = useUpdateRentalProfile();
  const deleteMut = useDeleteRentalProfile();

  if (isLoading) return <PageSkeleton />;

  const profiles = data?.profiles ?? [];

  const handleSave = async (form: ProfileForm & { id?: string }) => {
    try {
      const payload = {
        clientEmail: form.clientEmail,
        clientName: form.clientName,
        clientPhone: form.clientPhone || null,
        height: form.height ? parseFloat(form.height) : null,
        weight: form.weight ? parseFloat(form.weight) : null,
        shoeSize: form.shoeSize || null,
        age: form.age ? parseInt(form.age) : null,
        abilityLevel: form.abilityLevel || null,
        bootSoleLength: form.bootSoleLength
          ? parseFloat(form.bootSoleLength)
          : null,
        preferredDinSetting: form.preferredDinSetting
          ? parseFloat(form.preferredDinSetting)
          : null,
        notes: form.notes || null,
      };
      if (form.id) {
        await updateMut.mutateAsync({ id: form.id, ...payload });
        toast.success("Perfil actualizado");
      } else {
        await createMut.mutateAsync(payload);
        toast.success("Perfil creado");
      }
      setShowModal(false);
      setEditing(null);
    } catch {
      toast.error("Error al guardar perfil");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Eliminar este perfil?")) return;
    try {
      await deleteMut.mutateAsync(id);
      toast.success("Perfil eliminado");
    } catch {
      toast.error("Error al eliminar");
    }
  };

  return (
    <div className="space-y-4">
      {/* Search + action */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#8A8580]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre, email o telefono..."
            className={`${inputCls} pl-9`}
          />
        </div>
        <div className="flex-1" />
        <button
          onClick={() => { setEditing(null); setShowModal(true); }}
          className="flex items-center gap-2 rounded-[10px] bg-[#E87B5A] px-4 py-2 text-sm font-medium text-white hover:bg-[#D56E4F] transition-colors"
        >
          <Plus className="h-4 w-4" /> Nuevo Perfil
        </button>
      </div>

      {/* Table */}
      <div className="glass-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#E8E4DE] text-left text-[#8A8580]">
              <th className="px-4 py-3 font-medium">Nombre</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Talla Zapato</th>
              <th className="px-4 py-3 font-medium">Altura</th>
              <th className="px-4 py-3 font-medium">Peso</th>
              <th className="px-4 py-3 font-medium">Nivel</th>
              <th className="px-4 py-3 font-medium">DIN</th>
              <th className="px-4 py-3 font-medium" />
            </tr>
          </thead>
          <tbody>
            {profiles.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-[#8A8580]">
                  Sin perfiles de talla
                </td>
              </tr>
            )}
            {profiles.map((p) => (
              <tr
                key={p.id}
                className="border-b border-[#E8E4DE] last:border-0 hover:bg-[#FAF9F7]"
              >
                <td className="px-4 py-3 font-medium text-[#2D2A26]">{p.clientName}</td>
                <td className="px-4 py-3 text-[#8A8580]">{p.clientEmail}</td>
                <td className="px-4 py-3">{p.shoeSize ?? "—"}</td>
                <td className="px-4 py-3">{p.height ? `${p.height} cm` : "—"}</td>
                <td className="px-4 py-3">{p.weight ? `${p.weight} kg` : "—"}</td>
                <td className="px-4 py-3">{ABILITY_LABELS[p.abilityLevel ?? ""] ?? "—"}</td>
                <td className="px-4 py-3 font-medium">{p.preferredDinSetting ?? "—"}</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => { setEditing(p); setShowModal(true); }}
                      className="rounded-[6px] p-1.5 text-[#8A8580] hover:bg-[#FAF9F7] transition-colors"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(p.id)}
                      className="rounded-[6px] p-1.5 text-[#8A8580] hover:text-[#C75D4A] hover:bg-[#C75D4A]/10 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <ProfileModal
          profile={editing}
          onClose={() => { setShowModal(false); setEditing(null); }}
          onSave={handleSave}
        />
      )}
    </div>
  );
}

function ProfileModal({
  profile,
  onClose,
  onSave,
}: {
  profile: CustomerSizingProfile | null;
  onClose: () => void;
  onSave: (d: ProfileForm & { id?: string }) => void;
}) {
  const [form, setForm] = useState<ProfileForm>(() =>
    profile
      ? {
          clientEmail: profile.clientEmail,
          clientName: profile.clientName,
          clientPhone: profile.clientPhone ?? "",
          height: profile.height?.toString() ?? "",
          weight: profile.weight?.toString() ?? "",
          shoeSize: profile.shoeSize ?? "",
          age: profile.age?.toString() ?? "",
          abilityLevel: profile.abilityLevel ?? "",
          bootSoleLength: profile.bootSoleLength?.toString() ?? "",
          preferredDinSetting: profile.preferredDinSetting?.toString() ?? "",
          notes: profile.notes ?? "",
        }
      : {
          clientEmail: "",
          clientName: "",
          clientPhone: "",
          height: "",
          weight: "",
          shoeSize: "",
          age: "",
          abilityLevel: "",
          bootSoleLength: "",
          preferredDinSetting: "",
          notes: "",
        }
  );

  const handleCalcDin = () => {
    const w = parseFloat(form.weight);
    const h = parseFloat(form.height);
    const bsl = parseFloat(form.bootSoleLength);
    const a = parseInt(form.age);
    const ability = form.abilityLevel as
      | "beginner"
      | "intermediate"
      | "advanced"
      | "expert";

    if (!w || !h || !bsl || !a || !ability) {
      toast.error("Completa peso, altura, longitud suela, edad y nivel");
      return;
    }

    const din = calculateDin({
      weight: w,
      height: h,
      bootSoleLength: bsl,
      age: a,
      abilityLevel: ability,
    });
    setForm((p) => ({ ...p, preferredDinSetting: din.toString() }));
    toast.success(`DIN calculado: ${din}`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ ...(profile && { id: profile.id }), ...form });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-[#E8E4DE] px-6 py-4">
          <h2 className="text-lg font-semibold text-[#2D2A26]">
            {profile ? "Editar Perfil" : "Nuevo Perfil"}
          </h2>
          <button onClick={onClose} className="rounded-[10px] p-1.5 text-[#8A8580] hover:bg-[#FAF9F7] transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#2D2A26] mb-1">Nombre</label>
              <input type="text" value={form.clientName} onChange={(e) => setForm((p) => ({ ...p, clientName: e.target.value }))} className={inputCls} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#2D2A26] mb-1">Email</label>
              <input type="email" value={form.clientEmail} onChange={(e) => setForm((p) => ({ ...p, clientEmail: e.target.value }))} className={inputCls} required />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#2D2A26] mb-1">Teléfono</label>
            <input type="text" value={form.clientPhone} onChange={(e) => setForm((p) => ({ ...p, clientPhone: e.target.value }))} className={inputCls} />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#2D2A26] mb-1">Altura (cm)</label>
              <input type="number" min="50" max="250" value={form.height} onChange={(e) => setForm((p) => ({ ...p, height: e.target.value }))} className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#2D2A26] mb-1">Peso (kg)</label>
              <input type="number" min="10" max="200" value={form.weight} onChange={(e) => setForm((p) => ({ ...p, weight: e.target.value }))} className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#2D2A26] mb-1">Edad</label>
              <input type="number" min="2" max="100" value={form.age} onChange={(e) => setForm((p) => ({ ...p, age: e.target.value }))} className={inputCls} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#2D2A26] mb-1">Talla Zapato (EU)</label>
              <input type="text" value={form.shoeSize} onChange={(e) => setForm((p) => ({ ...p, shoeSize: e.target.value }))} className={inputCls} placeholder="Ej: 42" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#2D2A26] mb-1">Nivel</label>
              <select value={form.abilityLevel} onChange={(e) => setForm((p) => ({ ...p, abilityLevel: e.target.value }))} className={inputCls}>
                <option value="">Seleccionar</option>
                <option value="beginner">Principiante</option>
                <option value="intermediate">Intermedio</option>
                <option value="advanced">Avanzado</option>
                <option value="expert">Experto</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#2D2A26] mb-1">Long. Suela (mm)</label>
              <input type="number" min="150" max="400" value={form.bootSoleLength} onChange={(e) => setForm((p) => ({ ...p, bootSoleLength: e.target.value }))} className={inputCls} placeholder="Ej: 310" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#2D2A26] mb-1">DIN</label>
              <div className="flex gap-2">
                <input type="number" min="0.5" max="16" step="0.25" value={form.preferredDinSetting} onChange={(e) => setForm((p) => ({ ...p, preferredDinSetting: e.target.value }))} className={inputCls} />
                <button
                  type="button"
                  onClick={handleCalcDin}
                  className="flex-shrink-0 rounded-[10px] border border-[#E8E4DE] p-2 text-[#8A8580] hover:bg-[#FAF9F7] transition-colors"
                  title="Calcular DIN"
                >
                  <Calculator className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#2D2A26] mb-1">Notas</label>
            <input type="text" value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} className={inputCls} placeholder="Notas opcionales" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="rounded-[10px] px-4 py-2 text-sm text-[#8A8580] hover:bg-[#FAF9F7] transition-colors">
              Cancelar
            </button>
            <button type="submit" className="rounded-[10px] bg-[#E87B5A] px-4 py-2 text-sm font-medium text-white hover:bg-[#D56E4F] transition-colors">
              {profile ? "Guardar" : "Crear"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
