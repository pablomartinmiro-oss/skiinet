"use client";

import Link from "next/link";
import { AlertTriangle, Clock, MapPin, ChevronRight } from "lucide-react";

interface AttentionQuote {
  id: string;
  clientName: string;
  destination: string;
  totalAmount: number;
  expiresAt: string | null;
  status: string;
}

interface NeedsAttentionProps {
  quotes: AttentionQuote[];
  loading?: boolean;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
  }).format(value);
}

function daysUntil(dateStr: string): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - now.getTime()) / 86_400_000);
}

function expiryLabel(days: number): string {
  if (days < 0) return "Vencido";
  if (days === 0) return "Vence hoy";
  if (days === 1) return "Vence manana";
  return `Vence en ${days} dias`;
}

const STATION_LABELS: Record<string, string> = {
  baqueira: "Baqueira Beret",
  sierra_nevada: "Sierra Nevada",
  valdesqui: "Valdesqui",
  la_pinilla: "La Pinilla",
  grandvalira: "Grandvalira",
  formigal: "Formigal",
  alto_campoo: "Alto Campoo",
};

export function NeedsAttention({ quotes, loading }: NeedsAttentionProps) {
  // Filter quotes that are "enviado" and expiring within 3 days
  const urgent = quotes
    .filter((q) => {
      if (q.status !== "enviado" || !q.expiresAt) return false;
      const days = daysUntil(q.expiresAt);
      return days <= 3;
    })
    .sort((a, b) => {
      const dA = daysUntil(a.expiresAt!);
      const dB = daysUntil(b.expiresAt!);
      return dA - dB;
    })
    .slice(0, 5);

  if (loading) {
    return (
      <div className="animate-fade-in glass-card p-5">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gold/10">
            <AlertTriangle className="h-4 w-4 text-amber-700" />
          </div>
          <h2 className="text-base font-semibold text-slate-900">Necesita atención</h2>
        </div>
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-slate-100" />
          ))}
        </div>
      </div>
    );
  }

  if (urgent.length === 0) {
    return (
      <div className="animate-fade-in glass-card p-5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sage/10">
            <AlertTriangle className="h-4 w-4 text-green-700" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-900">Necesita atención</h2>
            <p className="text-xs text-slate-500">Sin elementos pendientes</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in glass-card p-5 hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)] transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gold/10">
            <AlertTriangle className="h-4 w-4 text-amber-700" />
          </div>
          <h2 className="text-base font-semibold text-slate-900">Necesita atención</h2>
        </div>
        <span className="rounded-full bg-gold/10 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
          {urgent.length}
        </span>
      </div>

      <div className="space-y-2">
        {urgent.map((q) => {
          const days = daysUntil(q.expiresAt!);
          const isOverdue = days < 0;
          const isToday = days === 0;
          const urgencyColor = isOverdue || isToday
            ? "border-l-muted-red"
            : "border-l-gold";
          const badgeColor = isOverdue || isToday
            ? "bg-muted-red/10 text-muted-red"
            : "bg-gold/10 text-amber-700";

          return (
            <Link
              key={q.id}
              href="/presupuestos"
              className={`group flex items-center justify-between rounded-xl border border-border border-l-[3px] ${urgencyColor} bg-white p-3 transition-colors hover:bg-slate-100/50`}
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-slate-900 truncate">
                  {q.clientName}
                </p>
                <div className="mt-0.5 flex items-center gap-3 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {STATION_LABELS[q.destination] ?? q.destination}
                  </span>
                  <span className="font-medium">{formatCurrency(q.totalAmount)}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0 ml-3">
                <span className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${badgeColor}`}>
                  <Clock className="h-3 w-3" />
                  {expiryLabel(days)}
                </span>
                <ChevronRight className="h-4 w-4 text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
