"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, Ticket, Link2, X } from "lucide-react";
import { toast } from "sonner";
import {
  usePlatforms,
  useCreatePlatform,
  useUpdatePlatform,
  useDeletePlatform,
  usePlatformProducts,
  useCreatePlatformProduct,
  useDeletePlatformProduct,
} from "@/hooks/useTicketing";
import type { Platform } from "@/hooks/useTicketing";
import { PageSkeleton } from "@/components/shared/LoadingSkeleton";

const inputCls =
  "w-full rounded-[10px] border border-[#E8E4DE] px-3 py-2 text-sm text-[#2D2A26] placeholder:text-[#8A8580] focus:border-[#E87B5A] focus:outline-none focus:ring-1 focus:ring-[#E87B5A]";

interface PlatformForm {
  name: string;
  type: string;
  commissionPercentage: number;
  active: boolean;
}

function PlatformModal({ platform, isOpen, onClose, onSave }: {
  platform: Platform | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (d: PlatformForm & { id?: string }) => void;
}) {
  const [form, setForm] = useState<PlatformForm>(() =>
    platform
      ? { name: platform.name, type: platform.type, commissionPercentage: platform.commissionPercentage, active: platform.active }
      : { name: "", type: "coupon", commissionPercentage: 0, active: true }
  );
  if (!isOpen) return null;
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ ...(platform && { id: platform.id }), ...form });
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-[#E8E4DE] px-6 py-4">
          <h2 className="text-lg font-semibold text-[#2D2A26]">
            {platform ? "Editar Plataforma" : "Nueva Plataforma"}
          </h2>
          <button onClick={onClose} className="rounded-[10px] p-1.5 text-[#8A8580] hover:bg-[#FAF9F7] transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          <div>
            <label className="block text-sm font-medium text-[#2D2A26] mb-1">Nombre</label>
            <input type="text" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} className={inputCls} required placeholder="Groupon, Smartbox..." />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#2D2A26] mb-1">Tipo</label>
              <select value={form.type} onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))} className={inputCls}>
                <option value="coupon">Cupon</option>
                <option value="affiliate">Afiliado</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#2D2A26] mb-1">Comision (%)</label>
              <input type="number" min="0" max="100" step="0.1" value={form.commissionPercentage} onChange={(e) => setForm((p) => ({ ...p, commissionPercentage: parseFloat(e.target.value) || 0 }))} className={inputCls} />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="plat-active" checked={form.active} onChange={(e) => setForm((p) => ({ ...p, active: e.target.checked }))} className="h-4 w-4 rounded border-[#E8E4DE] text-[#E87B5A] focus:ring-[#E87B5A]" />
            <label htmlFor="plat-active" className="text-sm font-medium text-[#2D2A26]">Activa</label>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="rounded-[10px] border border-[#E8E4DE] px-4 py-2 text-sm font-medium text-[#8A8580] hover:bg-[#FAF9F7] transition-colors">Cancelar</button>
            <button type="submit" className="rounded-[10px] bg-[#E87B5A] px-4 py-2 text-sm font-medium text-white hover:bg-[#D56E4F] transition-colors">
              {platform ? "Guardar Cambios" : "Crear Plataforma"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ProductsPanel({ platform, onClose }: { platform: Platform; onClose: () => void }) {
  const { data, isLoading } = usePlatformProducts(platform.id);
  const createProd = useCreatePlatformProduct(platform.id);
  const deleteProd = useDeletePlatformProduct(platform.id);
  const [productId, setProductId] = useState("");

  const products = data?.products ?? [];

  const handleLink = async () => {
    if (!productId.trim()) return;
    try {
      await createProd.mutateAsync({ productId: productId.trim() });
      toast.success("Producto vinculado");
      setProductId("");
    } catch { toast.error("Error al vincular producto"); }
  };

  const handleUnlink = async (prodId: string) => {
    try {
      await deleteProd.mutateAsync(prodId);
      toast.success("Producto desvinculado");
    } catch { toast.error("Error al desvincular"); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-[#E8E4DE] px-6 py-4">
          <h2 className="text-lg font-semibold text-[#2D2A26]">
            Productos de {platform.name}
          </h2>
          <button onClick={onClose} className="rounded-[10px] p-1.5 text-[#8A8580] hover:bg-[#FAF9F7] transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex gap-2">
            <input type="text" value={productId} onChange={(e) => setProductId(e.target.value)} className={inputCls} placeholder="ID del producto..." />
            <button onClick={handleLink} disabled={createProd.isPending} className="rounded-[10px] bg-[#E87B5A] px-4 py-2 text-sm font-medium text-white hover:bg-[#D56E4F] transition-colors whitespace-nowrap">
              <Link2 className="h-4 w-4 inline mr-1" />Vincular
            </button>
          </div>
          {isLoading ? (
            <p className="text-sm text-[#8A8580]">Cargando...</p>
          ) : products.length === 0 ? (
            <p className="text-sm text-[#8A8580] text-center py-4">
              No hay productos vinculados
            </p>
          ) : (
            <div className="space-y-2">
              {products.map((pp) => (
                <div key={pp.id} className="flex items-center justify-between rounded-[10px] border border-[#E8E4DE] px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-[#2D2A26]">{pp.product?.name ?? pp.productId}</p>
                    <p className="text-xs text-[#8A8580]">{pp.product?.category} {pp.product?.station ? `- ${pp.product.station}` : ""}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex rounded-[6px] px-2 py-0.5 text-xs font-medium ${
                      pp.status === "active" ? "bg-emerald-50 text-emerald-700" :
                      pp.status === "paused" ? "bg-amber-50 text-amber-700" :
                      "bg-gray-100 text-gray-500"
                    }`}>
                      {pp.status === "active" ? "Activo" : pp.status === "paused" ? "Pausado" : "Eliminado"}
                    </span>
                    <button onClick={() => handleUnlink(pp.id)} className="rounded-[10px] p-1.5 text-[#8A8580] hover:bg-red-50 hover:text-[#C75D4A] transition-colors">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function PlataformasTab() {
  const { data, isLoading } = usePlatforms();
  const createPlat = useCreatePlatform();
  const updatePlat = useUpdatePlatform();
  const deletePlat = useDeletePlatform();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Platform | null>(null);
  const [productsPlatform, setProductsPlatform] = useState<Platform | null>(null);

  const platforms = data?.platforms ?? [];

  const handleAdd = () => { setEditing(null); setModalOpen(true); };
  const handleEdit = (p: Platform) => { setEditing(p); setModalOpen(true); };

  const handleDelete = async (p: Platform) => {
    if (!confirm(`Eliminar la plataforma "${p.name}"?`)) return;
    try { await deletePlat.mutateAsync(p.id); toast.success("Plataforma eliminada"); }
    catch { toast.error("Error al eliminar plataforma"); }
  };

  const handleSave = async (d: PlatformForm & { id?: string }) => {
    try {
      if (d.id) {
        await updatePlat.mutateAsync({ id: d.id, ...d });
        toast.success("Plataforma actualizada");
      } else {
        await createPlat.mutateAsync(d);
        toast.success("Plataforma creada");
      }
      setModalOpen(false);
    } catch { toast.error("Error al guardar plataforma"); }
  };

  if (isLoading) return <PageSkeleton />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-[#8A8580]">{platforms.length} plataforma{platforms.length !== 1 ? "s" : ""}</p>
        <button onClick={handleAdd} className="flex items-center gap-2 rounded-[10px] bg-[#E87B5A] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#D56E4F] transition-colors">
          <Plus className="h-4 w-4" /> Añadir Plataforma
        </button>
      </div>

      {platforms.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <Ticket className="mx-auto h-10 w-10 text-[#8A8580] mb-3" />
          <p className="text-sm text-[#8A8580]">No hay plataformas configuradas</p>
          <p className="text-xs text-[#8A8580] mt-1">Crea tu primera plataforma para gestionar cupones y afiliados</p>
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#E8E4DE] bg-[#FAF9F7]/50">
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#8A8580] uppercase tracking-wider">Nombre</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-[#8A8580] uppercase tracking-wider">Tipo</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-[#8A8580] uppercase tracking-wider">Comision</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-[#8A8580] uppercase tracking-wider">Productos</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-[#8A8580] uppercase tracking-wider">Estado</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-[#8A8580] uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E4DE]">
                {platforms.map((p) => (
                  <tr key={p.id} className="hover:bg-[#FAF9F7]/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Ticket className="h-4 w-4 text-[#8A8580]" />
                        <span className="font-medium text-sm text-[#2D2A26]">{p.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex rounded-[6px] px-2 py-0.5 text-xs font-medium ${
                        p.type === "coupon" ? "bg-purple-50 text-purple-700" : "bg-blue-50 text-blue-700"
                      }`}>
                        {p.type === "coupon" ? "Cupon" : "Afiliado"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center text-sm text-[#2D2A26]">{p.commissionPercentage}%</td>
                    <td className="px-6 py-4 text-center">
                      <button onClick={() => setProductsPlatform(p)} className="text-sm text-[#E87B5A] hover:text-[#D56E4F] font-medium transition-colors">
                        {p._count?.products ?? 0} productos
                      </button>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex rounded-[6px] px-2 py-0.5 text-xs font-medium ${
                        p.active ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-500"
                      }`}>
                        {p.active ? "Activa" : "Inactiva"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => handleEdit(p)} className="rounded-[10px] p-1.5 text-[#8A8580] hover:bg-[#FAF9F7] hover:text-[#E87B5A] transition-colors" title="Editar">
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleDelete(p)} className="rounded-[10px] p-1.5 text-[#8A8580] hover:bg-red-50 hover:text-[#C75D4A] transition-colors" title="Eliminar">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <PlatformModal
        key={editing?.id ?? "new"}
        platform={editing}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
      />

      {productsPlatform && (
        <ProductsPanel
          key={productsPlatform.id}
          platform={productsPlatform}
          onClose={() => setProductsPlatform(null)}
        />
      )}
    </div>
  );
}
