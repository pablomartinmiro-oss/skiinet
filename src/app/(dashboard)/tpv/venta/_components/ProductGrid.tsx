"use client";

import { useState, useMemo } from "react";
import { Search, Package } from "lucide-react";
import type { Product } from "@/hooks/useProducts";
import {
  TPV_CATEGORIES,
  TPV_TABS,
  type TpvTabKey,
} from "./categories";

const fmt = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
});

interface Props {
  activeTab: TpvTabKey;
  onTabChange: (tab: TpvTabKey) => void;
  products: Product[];
  onAdd: (productId: string, name: string, unitPrice: number) => void;
}

export default function ProductGrid({
  activeTab,
  onTabChange,
  products,
  onAdd,
}: Props) {
  const [search, setSearch] = useState("");

  const visible = useMemo(() => {
    if (!search.trim()) return products;
    const q = search.toLowerCase();
    return products.filter((p) => p.name.toLowerCase().includes(q));
  }, [products, search]);

  return (
    <div className="flex flex-col overflow-hidden glass-card">
      {/* Tabs */}
      <div className="flex shrink-0 gap-1 border-b border-[#E8E4DE] px-3">
        {TPV_TABS.map((key) => (
          <button
            key={key}
            onClick={() => onTabChange(key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === key
                ? "border-[#E87B5A] text-[#E87B5A]"
                : "border-transparent text-[#8A8580] hover:text-[#2D2A26] hover:border-[#E8E4DE]"
            }`}
          >
            {TPV_CATEGORIES[key].label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="shrink-0 border-b border-[#E8E4DE] p-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8A8580]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar producto..."
            className="w-full rounded-[10px] border border-[#E8E4DE] bg-white pl-9 pr-3 py-2 text-sm focus:border-[#E87B5A] focus:outline-none"
          />
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto p-3">
        {visible.length === 0 ? (
          <div className="flex h-full items-center justify-center text-center">
            <div>
              <Package className="mx-auto mb-2 h-8 w-8 text-[#8A8580]" />
              <p className="text-sm text-[#8A8580]">
                {search.trim()
                  ? "Sin resultados"
                  : "No hay productos en esta categoria"}
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
            {visible.map((p) => (
              <button
                key={p.id}
                onClick={() => onAdd(p.id, p.name, p.price)}
                className="group flex flex-col rounded-[10px] border border-[#E8E4DE] bg-white p-3 text-left transition-all hover:border-[#E87B5A] hover:shadow-md active:scale-95"
              >
                <span className="text-sm font-medium text-[#2D2A26] line-clamp-2 min-h-[2.5rem]">
                  {p.name}
                </span>
                <span className="mt-2 text-base font-semibold text-[#E87B5A]">
                  {fmt.format(p.price)}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
