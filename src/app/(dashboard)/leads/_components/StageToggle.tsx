"use client";

import { Kanban, List } from "lucide-react";
import { cn } from "@/lib/utils";

export type ViewMode = "pipeline" | "list";

export function StageToggle({
  value,
  onChange,
}: {
  value: ViewMode;
  onChange: (mode: ViewMode) => void;
}) {
  return (
    <div className="inline-flex rounded-lg border border-border bg-white p-0.5">
      <button
        onClick={() => onChange("pipeline")}
        className={cn(
          "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
          value === "pipeline"
            ? "bg-slate-900 text-white"
            : "text-slate-600 hover:text-slate-900"
        )}
      >
        <Kanban className="h-4 w-4" />
        Pipeline
      </button>
      <button
        onClick={() => onChange("list")}
        className={cn(
          "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
          value === "list"
            ? "bg-slate-900 text-white"
            : "text-slate-600 hover:text-slate-900"
        )}
      >
        <List className="h-4 w-4" />
        Lista
      </button>
    </div>
  );
}
