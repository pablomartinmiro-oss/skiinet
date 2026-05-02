"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: React.ElementType;
  loading?: boolean;
  iconColor?: string;
  iconBg?: string;
  trend?: { value: number; label: string };
  sparkline?: number[];
}

function Sparkline({ data, positive }: { data: number[]; positive: boolean }) {
  if (data.length < 2) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const w = 56;
  const h = 24;
  const pad = 1;

  const pts = data.map((v, i) => {
    const x = pad + (i / (data.length - 1)) * (w - 2 * pad);
    const y = h - pad - ((v - min) / range) * (h - 2 * pad);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  const fillPts = [`${pad},${h}`, ...pts, `${w - pad},${h}`].join(" ");
  const color = positive ? "#16A34A" : "#DC2626";

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="opacity-70">
      <polygon points={fillPts} fill={color} fillOpacity={0.1} />
      <polyline
        points={pts.join(" ")}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function StatCard({
  title,
  value,
  description,
  icon: Icon,
  loading,
  iconColor = "text-blue-600",
  iconBg = "bg-blue-50",
  trend,
  sparkline,
}: StatCardProps) {
  const trendPositive = trend ? trend.value >= 0 : true;

  return (
    <div className="glass-card p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-150">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          {/* Label */}
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-3">
            {title}
          </p>

          {/* Value */}
          {loading ? (
            <Skeleton className="h-8 w-24 mb-2" />
          ) : (
            <p className="text-2xl font-bold text-slate-900 tracking-tight leading-none mb-2">
              {value}
            </p>
          )}

          {/* Trend + description */}
          {!loading && (description || trend) && (
            <div className="flex items-center gap-2">
              {trend && (
                <span
                  className={cn(
                    "inline-flex items-center gap-0.5 text-xs font-semibold px-1.5 py-0.5 rounded-md",
                    trendPositive
                      ? "bg-green-50 text-green-700"
                      : "bg-red-50 text-red-600"
                  )}
                >
                  {trendPositive ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  {Math.abs(trend.value)}%
                </span>
              )}
              {description && (
                <p className="text-xs text-slate-400">{description}</p>
              )}
            </div>
          )}
        </div>

        {/* Right side — icon + sparkline */}
        <div className="flex flex-col items-end gap-2 ml-3">
          <div
            className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
              iconBg
            )}
          >
            <Icon className={cn("h-4.5 w-4.5", iconColor)} />
          </div>
          {!loading && sparkline && sparkline.length >= 2 && (
            <Sparkline data={sparkline} positive={trendPositive} />
          )}
        </div>
      </div>
    </div>
  );
}
