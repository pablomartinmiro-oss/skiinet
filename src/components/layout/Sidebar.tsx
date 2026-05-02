"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  MessageSquare, Kanban, Users, Settings, ChevronLeft, ChevronRight, ChevronDown,
  LayoutDashboard, FileText, Package, CalendarCheck, Mountain, Building2, Sparkles,
  UtensilsCrossed, Receipt, Truck, Scale, CreditCard, ShoppingCart, PanelsTopLeft,
  Ticket, Star, Boxes, ClipboardList, UserCheck, Wallet, GraduationCap, Calendar,
  Clock, XCircle, User, Snowflake, CalendarCog, AlertTriangle, BarChart3, Award, ShieldAlert,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePermissions } from "@/hooks/usePermissions";
import { useModules } from "@/hooks/useModules";
import { useQuoteDraftCount } from "@/hooks/useQuotes";
import { Badge } from "@/components/ui/badge";
import { MODULE_REGISTRY, SECTION_ORDER } from "@/lib/modules/registry";
import type { PermissionKey } from "@/types/auth";

const ICON_MAP: Record<string, LucideIcon> = {
  LayoutDashboard, Settings, Users, Kanban, MessageSquare, Package, FileText,
  CalendarCheck, ClipboardList, Building2, Sparkles, UtensilsCrossed, Receipt,
  Truck, Scale, CreditCard, ShoppingCart, PanelsTopLeft, Ticket, Star, Boxes,
  UserCheck, Wallet, GraduationCap, Calendar, Clock, XCircle, User, Snowflake,
  CalendarCog, AlertTriangle, BarChart3, Award, ShieldAlert,
};

const GROUP_THRESHOLD = 4;

interface ResolvedNavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  permission: PermissionKey | null;
  roles?: string[];
  badge?: string;
  section: string;
  sectionLabel: string;
  sectionOrder: number;
  moduleSlug: string;
  moduleIcon: LucideIcon;
  moduleName: string;
}

export function Sidebar({ unreadCount = 0, todayReservations = 0 }: { unreadCount?: number; todayReservations?: number }) {
  const [collapsed, setCollapsed] = useState(false);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const pathname = usePathname();
  const { can, roleName } = usePermissions();
  const { modules } = useModules();
  const isEnabled = (slug: string) => modules.some((m) => m.slug === slug && m.isEnabled);
  const { data: draftCount = 0 } = useQuoteDraftCount();

  const resolvedItems = useMemo(() => {
    const items: ResolvedNavItem[] = [];
    for (const mod of Object.values(MODULE_REGISTRY)) {
      if (!isEnabled(mod.slug)) continue;
      const sectionMeta = SECTION_ORDER[mod.section] ?? { label: mod.section, order: 99 };
      const ModIcon = ICON_MAP[mod.icon] ?? GraduationCap;
      for (const nav of mod.navItems) {
        const Icon = ICON_MAP[nav.icon];
        if (!Icon) continue;
        items.push({
          label: nav.label, href: nav.href, icon: Icon,
          permission: (nav.permission ?? null) as PermissionKey | null,
          roles: nav.roles, badge: nav.badge,
          section: mod.section, sectionLabel: sectionMeta.label, sectionOrder: sectionMeta.order,
          moduleSlug: mod.slug, moduleIcon: ModIcon, moduleName: mod.name,
        });
      }
    }
    items.sort((a, b) => a.sectionOrder - b.sectionOrder);
    return items;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modules]);

  const visibleItems = resolvedItems.filter((item) => {
    if (item.permission !== null && !can(item.permission)) return false;
    if (item.roles && item.roles.length > 0 && !item.roles.includes(roleName)) return false;
    return true;
  });

  const moduleGroups = useMemo(() => {
    const groups = new Map<string, ResolvedNavItem[]>();
    for (const item of visibleItems) {
      const arr = groups.get(item.moduleSlug) ?? [];
      arr.push(item);
      groups.set(item.moduleSlug, arr);
    }
    return groups;
  }, [visibleItems]);

  const activeModules = useMemo(() => {
    const active = new Set<string>();
    for (const item of visibleItems) {
      if (item.href === "/" ? pathname === "/" : pathname.startsWith(item.href)) active.add(item.moduleSlug);
    }
    return active;
  }, [visibleItems, pathname]);

  const toggleModule = (slug: string) => {
    setExpandedModules((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug); else next.add(slug);
      return next;
    });
  };

  function getBadgeCount(item: ResolvedNavItem): number {
    if (item.badge === "unreadMessages") return unreadCount;
    if (item.badge === "todayReservations") return todayReservations;
    if (item.badge === "draftQuotes") return draftCount;
    return 0;
  }

  let lastSection = "";
  const renderedModules = new Set<string>();

  const itemHover = "hover:bg-white/50 hover:text-[#0f172a]";
  const subBadge = "h-[18px] min-w-[18px] justify-center rounded-full px-1.5 text-[10px] font-semibold bg-indigo-100 text-indigo-700 border-0";

  return (
    <aside className={cn("glass-sidebar flex h-screen flex-col transition-all duration-200", collapsed ? "w-16" : "w-[220px]")}>
      <div className="flex h-14 items-center border-b px-4" style={{borderColor: 'rgba(255,255,255,0.75)'}}>
        {!collapsed && (
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg" style={{background: 'linear-gradient(135deg, #6366f1, #8b5cf6)'}}>
              <Mountain className="h-4 w-4 text-white" />
            </div>
            <span className="text-[15px] font-bold text-[#0f172a] tracking-tight">Skicenter</span>
          </div>
        )}
        {collapsed && (
          <div className="mx-auto flex h-7 w-7 items-center justify-center rounded-lg" style={{background: 'linear-gradient(135deg, #6366f1, #8b5cf6)'}}>
            <Mountain className="h-4 w-4 text-white" />
          </div>
        )}
        <button onClick={() => setCollapsed(!collapsed)} className={cn("rounded-md p-1.5 text-[#475569] transition-colors hover:bg-white/50 hover:text-[#0f172a]", collapsed ? "mx-auto mt-2" : "ml-auto")}>
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-2 py-3">
        {visibleItems.map((item) => {
          const moduleItems = moduleGroups.get(item.moduleSlug) ?? [];
          const isGrouped = moduleItems.length >= GROUP_THRESHOLD;

          let sectionHeader: React.ReactNode = null;
          if (item.sectionLabel && item.section !== lastSection && !collapsed) {
            lastSection = item.section;
            sectionHeader = <div key={`s-${item.section}`} className="px-3 pb-1.5 pt-5 text-[0.6rem] font-semibold uppercase tracking-[0.14em] text-[#64748b]">{item.sectionLabel}</div>;
          } else if (item.section !== lastSection) { lastSection = item.section; }

          if (isGrouped) {
            if (renderedModules.has(item.moduleSlug)) return null;
            renderedModules.add(item.moduleSlug);
            const isExpanded = expandedModules.has(item.moduleSlug) || activeModules.has(item.moduleSlug);
            const ModIcon = item.moduleIcon;

            return (
              <div key={`g-${item.moduleSlug}`}>
                {sectionHeader}
                <button onClick={() => toggleModule(item.moduleSlug)}
                  className={cn("flex w-full items-center gap-3 rounded-[10px] px-3 py-2 text-[13.5px] font-medium transition-all",
                    isExpanded ? "text-[#0f172a]" : cn("text-[#475569]", itemHover),
                    collapsed && "justify-center px-2")}
                  title={collapsed ? item.moduleName : undefined}>
                  <ModIcon className={cn("h-[18px] w-[18px] shrink-0", isExpanded ? "text-[#6366f1]" : "text-[#475569]")} />
                  {!collapsed && (
                    <>
                      <span className="flex-1 text-left">{item.moduleName}</span>
                      <ChevronDown className={cn("h-3.5 w-3.5 text-[#64748b] transition-transform", isExpanded && "rotate-180")} />
                    </>
                  )}
                </button>
                {isExpanded && !collapsed && (
                  <div className="ml-[15px] space-y-0.5 border-l pl-3 mt-0.5" style={{borderColor: 'rgba(255,255,255,0.75)'}}>
                    {moduleItems.map((sub) => {
                      const isActive = sub.href === "/" ? pathname === "/" : pathname.startsWith(sub.href);
                      const SubIcon = sub.icon;
                      const bc = getBadgeCount(sub);
                      return (
                        <Link key={sub.href} href={sub.href}
                          className={cn("flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[12.5px] font-medium transition-all",
                            isActive ? "glass-active-item text-[#0f172a]" : cn("text-[#475569]", itemHover))}>
                          <SubIcon className={cn("h-[15px] w-[15px] shrink-0", isActive ? "text-[#6366f1]" : "text-[#475569]")} />
                          <span className="flex-1">{sub.label}</span>
                          {bc > 0 && <Badge variant="secondary" className={subBadge}>{bc}</Badge>}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

          const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          const Icon = item.icon;
          const bc = getBadgeCount(item);
          return (
            <div key={item.href}>
              {sectionHeader}
              <Link href={item.href}
                className={cn("group relative flex items-center gap-3 rounded-[10px] px-3 py-2 text-[13.5px] font-medium transition-all border-l-2 border-transparent",
                  isActive ? "glass-active-item text-[#0f172a] border-[#0f172a]" : cn("text-[#475569]", itemHover),
                  collapsed && "justify-center px-2 border-l-0")}
                title={collapsed ? item.label : undefined}>
                <Icon className={cn("h-[18px] w-[18px] shrink-0", isActive ? "text-[#6366f1]" : "text-[#475569]")} />
                {!collapsed && (
                  <>
                    <span className="flex-1">{item.label}</span>
                    {bc > 0 && <Badge variant="secondary" className={subBadge}>{bc > 99 ? "99+" : bc}</Badge>}
                  </>
                )}
                {collapsed && bc > 0 && <span className="absolute right-1 top-0.5 h-2 w-2 rounded-full bg-indigo-500" />}
              </Link>
            </div>
          );
        })}
      </nav>

      <div className="border-t p-3" style={{borderColor: 'rgba(255,255,255,0.75)'}}>
        {!collapsed ? (
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
            </span>
            <p className="truncate text-[11px] font-medium text-[#64748b]">Skicenter v1.0</p>
          </div>
        ) : (
          <div className="flex justify-center">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
            </span>
          </div>
        )}
      </div>
    </aside>
  );
}
