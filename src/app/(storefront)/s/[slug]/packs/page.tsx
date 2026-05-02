"use client";

import { useParams } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import { useCart } from "../_components/CartContext";
import { formatEUR } from "../_components/utils";

interface PackLine {
  id: string;
  productId: string | null;
  roomTypeId: string | null;
  treatmentId: string | null;
  quantity: number;
  isRequired: boolean;
  isOptional: boolean;
  isClientEditable: boolean;
  overridePrice: number | null;
  sortOrder: number;
}

interface Pack {
  id: string;
  title: string;
  slug: string;
  price: number;
  images: string[];
  description: string | null;
  lines: PackLine[];
}

function lineLabel(line: PackLine): string {
  if (line.productId) return `Producto ${line.productId.slice(-6)}`;
  if (line.roomTypeId) return `Habitación ${line.roomTypeId.slice(-6)}`;
  if (line.treatmentId) return `Tratamiento ${line.treatmentId.slice(-6)}`;
  return "Componente";
}

function lineIcon(line: PackLine): string {
  if (line.roomTypeId) return "🏨";
  if (line.treatmentId) return "💆";
  return "🎿";
}

export default function PacksPage() {
  const { slug } = useParams<{ slug: string }>();
  const { addItem } = useCart();
  const [packs, setPacks] = useState<Pack[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPackId, setSelectedPackId] = useState<string | null>(null);
  const [optedIn, setOptedIn] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetch(`/api/storefront/${slug}/packs`)
      .then((r) => r.json())
      .then((data) => {
        const list = (data.packs ?? []) as Pack[];
        setPacks(list);
        if (list.length > 0) setSelectedPackId(list[0].id);
      })
      .catch(() => {
        // silent
      })
      .finally(() => setLoading(false));
  }, [slug]);

  const selectedPack = useMemo(
    () => packs.find((p) => p.id === selectedPackId) ?? null,
    [packs, selectedPackId],
  );

  // Reset opt-ins when pack changes; required lines auto-checked
  useEffect(() => {
    if (!selectedPack) return;
    const next: Record<string, boolean> = {};
    for (const line of selectedPack.lines) {
      next[line.id] = line.isRequired || !line.isOptional;
    }
    setOptedIn(next);
  }, [selectedPack]);

  const computedTotal = useMemo(() => {
    if (!selectedPack) return 0;
    const optionalAdds = selectedPack.lines
      .filter((l) => l.isOptional && optedIn[l.id])
      .reduce((sum, l) => sum + (l.overridePrice ?? 0) * l.quantity, 0);
    return selectedPack.price + optionalAdds;
  }, [selectedPack, optedIn]);

  const handleAdd = () => {
    if (!selectedPack) return;
    const extras = Object.entries(optedIn)
      .filter(([, v]) => v)
      .map(([k]) => k);
    addItem({
      id: selectedPack.id,
      type: "product",
      name: selectedPack.title,
      price: computedTotal,
      quantity: 1,
      meta: {
        variant: "pack",
        packLines: extras.join(","),
      },
    });
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-12">
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-gray-100 rounded w-1/3" />
          <div className="h-64 bg-gray-100 rounded" />
        </div>
      </div>
    );
  }

  if (packs.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-16 text-center">
        <h1 className="text-3xl font-bold text-[#001D3D] mb-3">
          Packs todavía no disponibles
        </h1>
        <p className="text-gray-600">
          Pronto encontrarás aquí packs combinados con clases, alquiler y alojamiento.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8 sm:py-12">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-[#001D3D] mb-2">
          Packs combinados
        </h1>
        <p className="text-gray-600">
          Configura tu pack: añade alojamiento, alquiler o spa con un solo click.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-8 border-b border-gray-200">
        {packs.map((pack) => (
          <button
            key={pack.id}
            onClick={() => setSelectedPackId(pack.id)}
            className={`px-4 py-3 text-sm font-medium transition-colors -mb-px border-b-2 ${
              selectedPackId === pack.id
                ? "border-[#42A5F5] text-[#42A5F5]"
                : "border-transparent text-gray-600 hover:text-[#001D3D]"
            }`}
          >
            {pack.title}
          </button>
        ))}
      </div>

      {selectedPack && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Constructor — left columns */}
          <div className="lg:col-span-2 space-y-6">
            {/* Hero */}
            <section className="rounded-xl overflow-hidden border border-gray-200 bg-white">
              <div className="h-48 sm:h-64 bg-gradient-to-br from-[#42A5F5]/15 via-[#001D3D]/5 to-white flex items-center justify-center text-7xl">
                📦
              </div>
              <div className="p-6">
                <h2 className="text-2xl font-bold text-[#001D3D] mb-2">
                  {selectedPack.title}
                </h2>
                {selectedPack.description && (
                  <p className="text-gray-600 leading-relaxed">
                    {selectedPack.description}
                  </p>
                )}
              </div>
            </section>

            {/* Components */}
            <section className="rounded-xl border border-gray-200 bg-white">
              <header className="px-6 py-4 border-b border-gray-100">
                <h3 className="text-base font-semibold text-[#001D3D]">
                  ¿Qué incluye?
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Marca lo que quieras añadir. Los componentes obligatorios ya van incluidos.
                </p>
              </header>
              <ul className="divide-y divide-gray-100">
                {selectedPack.lines.length === 0 && (
                  <li className="px-6 py-6 text-sm text-gray-500">
                    Este pack no tiene componentes configurados todavía.
                  </li>
                )}
                {selectedPack.lines.map((line) => {
                  const isOn = !!optedIn[line.id];
                  const editable = line.isOptional && line.isClientEditable;
                  const tag = line.isRequired
                    ? "Obligatorio"
                    : line.isOptional
                      ? "Opcional"
                      : "Incluido";
                  const tagClass = line.isRequired
                    ? "bg-[#001D3D] text-white"
                    : line.isOptional
                      ? "bg-amber-100 text-amber-800"
                      : "bg-emerald-100 text-emerald-700";
                  return (
                    <li
                      key={line.id}
                      className={`flex items-center gap-4 px-6 py-4 ${
                        line.isOptional ? "cursor-pointer hover:bg-gray-50" : ""
                      }`}
                      onClick={() => {
                        if (editable || line.isOptional)
                          setOptedIn((prev) => ({ ...prev, [line.id]: !prev[line.id] }));
                      }}
                    >
                      <div className="text-2xl shrink-0">{lineIcon(line)}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-semibold text-[#001D3D] truncate">
                            {lineLabel(line)}
                          </p>
                          <span
                            className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${tagClass}`}
                          >
                            {tag}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500">
                          Cantidad: {line.quantity}
                          {line.overridePrice !== null && line.overridePrice > 0
                            ? ` · ${formatEUR(line.overridePrice)} c/u`
                            : ""}
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={isOn}
                        readOnly={!line.isOptional}
                        disabled={line.isRequired}
                        onChange={(e) => {
                          if (line.isOptional)
                            setOptedIn((prev) => ({
                              ...prev,
                              [line.id]: e.target.checked,
                            }));
                        }}
                        className="h-5 w-5 rounded border-gray-300 text-[#42A5F5] focus:ring-[#42A5F5]"
                      />
                    </li>
                  );
                })}
              </ul>
            </section>
          </div>

          {/* Summary — right column */}
          <aside className="lg:col-span-1">
            <div className="sticky top-32 rounded-xl border border-gray-200 bg-white p-6">
              <p className="text-xs uppercase tracking-wider text-gray-500 mb-1">
                Total con tu configuración
              </p>
              <p className="text-3xl font-bold text-[#001D3D] mb-1 font-mono">
                {formatEUR(computedTotal)}
              </p>
              <p className="text-xs text-gray-500 mb-6">
                Base {formatEUR(selectedPack.price)}
                {computedTotal > selectedPack.price
                  ? ` + extras ${formatEUR(computedTotal - selectedPack.price)}`
                  : ""}
              </p>

              <button
                onClick={handleAdd}
                className="w-full px-6 py-3.5 text-base font-semibold text-white bg-[#E87B5A] rounded-lg hover:bg-[#D56E4F] transition-colors"
              >
                Añadir al carrito
              </button>

              <div className="mt-6 pt-6 border-t border-gray-100 space-y-2 text-xs text-gray-500">
                <p>✓ Cancelación gratuita hasta 48h antes</p>
                <p>✓ Pago seguro con Redsys</p>
                <p>✓ Confirmación instantánea por email</p>
              </div>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
