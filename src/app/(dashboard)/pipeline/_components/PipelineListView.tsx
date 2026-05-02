"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, Clock, CircleDollarSign } from "lucide-react";
import { cn } from "@/lib/utils";
import type { GHLOpportunity, GHLPipelineStage } from "@/lib/ghl/types";

interface PipelineListViewProps {
  stages: GHLPipelineStage[];
  oppsByStage: Map<string, GHLOpportunity[]>;
  onCardClick?: (opp: GHLOpportunity) => void;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function getDaysInStage(createdAt: string): number {
  return Math.floor((Date.now() - new Date(createdAt).getTime()) / 86400000);
}

const STATUS_BADGE: Record<string, string> = {
  open: "bg-blue-50 text-blue-700",
  won: "bg-green-50 text-green-700",
  lost: "bg-red-50 text-red-700",
  abandoned: "bg-slate-100 text-slate-500",
};

const COLUMN_DOT_COLORS = [
  "bg-coral",
  "bg-sage",
  "bg-gold",
  "bg-soft-blue",
  "bg-muted-red",
];

interface AccordionSectionProps {
  stage: GHLPipelineStage;
  opportunities: GHLOpportunity[];
  dotColor: string;
  onCardClick?: (opp: GHLOpportunity) => void;
  defaultOpen?: boolean;
}

function AccordionSection({ stage, opportunities, dotColor, onCardClick, defaultOpen }: AccordionSectionProps) {
  const [open, setOpen] = useState(defaultOpen ?? true);
  const total = opportunities.reduce((sum, o) => sum + o.monetaryValue, 0);

  return (
    <div className="glass-card overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <div className={cn("h-2.5 w-2.5 rounded-full shrink-0", dotColor)} />
          <span className="text-sm font-semibold text-slate-900">{stage.name}</span>
          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-slate-100 px-1.5 text-[10px] font-bold text-slate-500">
            {opportunities.length}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500">{formatCurrency(total)}</span>
          {open ? (
            <ChevronDown className="h-4 w-4 text-slate-400" />
          ) : (
            <ChevronRight className="h-4 w-4 text-slate-400" />
          )}
        </div>
      </button>

      {open && (
        <div className="divide-y divide-border/50 border-t border-border/50">
          {opportunities.length === 0 ? (
            <p className="px-4 py-3 text-xs text-slate-400 text-center">Sin oportunidades</p>
          ) : (
            opportunities.map((opp) => {
              const days = getDaysInStage(opp.createdAt);
              const daysBadge =
                days <= 3
                  ? "bg-green-50 text-green-700"
                  : days <= 7
                  ? "bg-amber-50 text-amber-700"
                  : "bg-red-50 text-red-700";

              return (
                <button
                  key={opp.id}
                  onClick={() => onCardClick?.(opp)}
                  className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-slate-50 transition-colors min-h-[52px]"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-900 truncate">
                      {opp.contactName || opp.name}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500 truncate">{opp.name}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="flex items-center gap-1 text-sm font-bold text-slate-900">
                      <CircleDollarSign className="h-3.5 w-3.5 text-slate-400" />
                      {formatCurrency(opp.monetaryValue)}
                    </div>
                    <span className={cn("flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[10px] font-medium", daysBadge)}>
                      <Clock className="h-2.5 w-2.5" />
                      {days}d
                    </span>
                    <span className={cn("rounded-md px-1.5 py-0.5 text-[10px] font-medium capitalize", STATUS_BADGE[opp.status] ?? "bg-slate-100 text-slate-500")}>
                      {opp.status}
                    </span>
                  </div>
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

export function PipelineListView({ stages, oppsByStage, onCardClick }: PipelineListViewProps) {
  const sorted = [...stages].sort((a, b) => a.position - b.position);

  return (
    <div className="space-y-2">
      {sorted.map((stage, idx) => (
        <AccordionSection
          key={stage.id}
          stage={stage}
          opportunities={oppsByStage.get(stage.id) ?? []}
          dotColor={COLUMN_DOT_COLORS[idx % COLUMN_DOT_COLORS.length]}
          onCardClick={onCardClick}
          defaultOpen={idx === 0}
        />
      ))}
    </div>
  );
}
