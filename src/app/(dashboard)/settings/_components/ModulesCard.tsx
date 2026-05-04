"use client";

import { useState, useMemo, useCallback } from "react";
import { useModules } from "@/hooks/useModules";
import { MODULE_REGISTRY, SECTION_ORDER } from "@/lib/modules/registry";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  Lock,
  LayoutDashboard, Users, Package, CalendarCheck,
  Building2, Sparkles, UtensilsCrossed, Receipt, Truck,
  Scale, CreditCard, ShoppingCart, PanelsTopLeft, Ticket,
  Star, Boxes, ChevronDown, ChevronRight, AlertTriangle,
} from "lucide-react";

const ICON_MAP: Record<string, React.ElementType> = {
  LayoutDashboard, Users, Package, CalendarCheck,
  Building2, Sparkles, UtensilsCrossed, Receipt, Truck,
  Scale, CreditCard, ShoppingCart, PanelsTopLeft, Ticket,
  Star, Boxes,
};

interface ConfirmState {
  slug: string;
  action: "enable" | "disable";
  message: string;
  deps: string[];
}

export function ModulesCard() {
  const { modules, isLoading, toggleModule, isToggling } = useModules();
  const [confirm, setConfirm] = useState<ConfirmState | null>(null);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const moduleEnabled = useCallback(
    (slug: string) => {
      const m = modules.find((mod) => mod.slug === slug);
      return m ? m.isEnabled || m.isCore : false;
    },
    [modules]
  );

  // Group modules by section
  const sections = useMemo(() => {
    const grouped: Record<string, typeof MODULE_REGISTRY[string][]> = {};
    for (const mod of Object.values(MODULE_REGISTRY)) {
      if (!grouped[mod.section]) grouped[mod.section] = [];
      grouped[mod.section].push(mod);
    }
    return Object.entries(SECTION_ORDER)
      .sort(([, a], [, b]) => a.order - b.order)
      .map(([key, { label }]) => ({
        key,
        label,
        modules: grouped[key] || [],
      }))
      .filter((s) => s.modules.length > 0);
  }, []);

  // Find dependents: modules that depend on a given slug
  function getDependents(slug: string): string[] {
    return Object.values(MODULE_REGISTRY)
      .filter((m) => m.dependencies.includes(slug) && moduleEnabled(m.slug))
      .map((m) => m.name);
  }

  // Find missing deps: deps that aren't enabled yet
  function getMissingDeps(slug: string): string[] {
    const def = MODULE_REGISTRY[slug];
    if (!def) return [];
    return def.dependencies
      .filter((d) => !moduleEnabled(d))
      .map((d) => MODULE_REGISTRY[d]?.name ?? d);
  }

  function handleToggle(slug: string, currentlyEnabled: boolean) {
    if (currentlyEnabled) {
      // Disabling: check if any active modules depend on this one
      const dependents = getDependents(slug);
      if (dependents.length > 0) {
        setConfirm({
          slug,
          action: "disable",
          message: `Los siguientes modulos dependen de ${MODULE_REGISTRY[slug]?.name}: ${dependents.join(", ")}. Se desactivaran tambien.`,
          deps: dependents,
        });
        return;
      }
    } else {
      // Enabling: check if deps are missing
      const missing = getMissingDeps(slug);
      if (missing.length > 0) {
        setConfirm({
          slug,
          action: "enable",
          message: `Se activaran tambien las dependencias: ${missing.join(", ")}.`,
          deps: missing,
        });
        return;
      }
    }
    doToggle(slug, !currentlyEnabled);
  }

  function doToggle(slug: string, isEnabled: boolean) {
    setConfirm(null);
    toggleModule(
      { slug, isEnabled },
      {
        onSuccess: () => toast.success(isEnabled ? "Modulo activado" : "Modulo desactivado"),
        onError: () => toast.error("Error al cambiar el modulo"),
      }
    );
  }

  function confirmAction() {
    if (!confirm) return;
    doToggle(confirm.slug, confirm.action === "enable");
  }

  function toggleSection(key: string) {
    setCollapsed((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  if (isLoading) {
    return (
      <div className="glass-card p-5">
        <Skeleton className="h-5 w-40 mb-4" />
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full mb-2" />
        ))}
      </div>
    );
  }

  return (
    <div className="glass-card p-5">
      <h3 className="mb-1 text-base font-semibold text-slate-900">Modulos de la plataforma</h3>
      <p className="mb-5 text-sm text-slate-500">
        Activa o desactiva modulos segun las necesidades de tu negocio
      </p>

      <div className="space-y-4">
        {sections.map((section) => (
          <div key={section.key}>
            <button
              onClick={() => toggleSection(section.key)}
              className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-xs font-semibold uppercase tracking-wider text-[#8A8580] hover:bg-[#FAF9F7] transition-colors"
            >
              {collapsed[section.key] ? (
                <ChevronRight className="h-3.5 w-3.5" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5" />
              )}
              {section.label}
              <span className="ml-auto text-[10px] font-normal text-[#8A8580]/60">
                {section.modules.filter((m) => moduleEnabled(m.slug)).length}/{section.modules.length}
              </span>
            </button>

            {!collapsed[section.key] && (
              <div className="mt-1 space-y-1">
                {section.modules.map((mod) => {
                  const Icon = ICON_MAP[mod.icon] || Package;
                  const enabled = moduleEnabled(mod.slug);
                  const depNames = mod.dependencies
                    .map((d) => MODULE_REGISTRY[d]?.name)
                    .filter(Boolean);

                  return (
                    <div
                      key={mod.slug}
                      className="flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-[#FAF9F7] transition-colors"
                    >
                      <div
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                          enabled ? "bg-[#E87B5A]/10" : "bg-[#E8E4DE]/50"
                        }`}
                      >
                        <Icon
                          className={`h-4 w-4 ${enabled ? "text-[#E87B5A]" : "text-[#8A8580]"}`}
                        />
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-[#2D2A26]">{mod.name}</p>
                        <p className="text-xs text-[#8A8580] truncate">{mod.description}</p>
                        {depNames.length > 0 && (
                          <p className="text-[10px] text-[#8A8580]/70 mt-0.5">
                            Requiere: {depNames.join(", ")}
                          </p>
                        )}
                      </div>

                      {mod.isCore ? (
                        <div className="flex items-center gap-1.5 text-xs text-[#8A8580]">
                          <Lock className="h-3.5 w-3.5" />
                          <span>Siempre activo</span>
                        </div>
                      ) : (
                        <button
                          disabled={isToggling}
                          onClick={() => handleToggle(mod.slug, enabled)}
                          className={`relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200 ${
                            enabled ? "bg-[#E87B5A]" : "bg-[#E8E4DE]"
                          } ${isToggling ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                          aria-label={`${enabled ? "Desactivar" : "Activar"} ${mod.name}`}
                        >
                          <span
                            className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 ${
                              enabled ? "translate-x-5" : "translate-x-0"
                            }`}
                          />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Confirmation overlay */}
      {confirm && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setConfirm(null)}
        >
          <div className="w-full max-w-sm rounded-xl bg-white p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start gap-3 mb-4">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#D4A853]/15">
                <AlertTriangle className="h-4 w-4 text-[#D4A853]" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[#2D2A26]">
                  {confirm.action === "enable" ? "Activar dependencias" : "Desactivar modulo"}
                </p>
                <p className="mt-1 text-xs text-[#8A8580]">{confirm.message}</p>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setConfirm(null)}
                className="rounded-[10px] px-3 py-1.5 text-sm font-medium text-[#8A8580] hover:bg-[#FAF9F7] transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={confirmAction}
                className="rounded-[10px] bg-[#E87B5A] px-3 py-1.5 text-sm font-medium text-white hover:bg-[#D56E4F] transition-colors"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
