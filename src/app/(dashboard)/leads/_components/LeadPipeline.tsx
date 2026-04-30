"use client";

import type { Lead } from "@/hooks/useLeads";
import { LEAD_STAGES, scoreColor, scoreCardBorder, sourceLabel, timeSince } from "./constants";
import { Mail, Phone, Building2, Target } from "lucide-react";

export function LeadPipeline({
  leads,
  onSelect,
}: {
  leads: Lead[];
  onSelect: (lead: Lead) => void;
}) {
  const grouped = LEAD_STAGES.map((stage) => ({
    ...stage,
    leads: leads.filter((l) => l.status === stage.id),
  }));

  return (
    <div className="grid auto-rows-fr grid-cols-1 gap-4 md:grid-cols-3 xl:grid-cols-5">
      {grouped.map((stage) => (
        <div
          key={stage.id}
          className="flex flex-col rounded-xl border border-border bg-slate-50/60"
        >
          <div className="flex items-center justify-between border-b border-border px-3 py-2.5">
            <div className="flex items-center gap-2">
              <span className={`h-2 w-2 rounded-full ${stage.color}`} />
              <span className="text-sm font-semibold text-slate-900">
                {stage.label}
              </span>
            </div>
            <span className="rounded-full bg-white px-2 py-0.5 text-xs font-medium text-slate-600 ring-1 ring-border">
              {stage.leads.length}
            </span>
          </div>

          <div className="flex-1 space-y-2 overflow-y-auto p-2 max-h-[calc(100vh-22rem)]">
            {stage.leads.length === 0 ? (
              <div className="flex h-24 items-center justify-center rounded-lg border border-dashed border-border text-xs text-slate-400">
                Sin leads
              </div>
            ) : (
              stage.leads.map((lead) => (
                <button
                  key={lead.id}
                  onClick={() => onSelect(lead)}
                  className={`group block w-full rounded-lg border border-border border-l-4 ${scoreCardBorder(
                    lead.score
                  )} bg-white p-3 text-left shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold text-slate-900">
                        {lead.name}
                      </div>
                      {lead.company && (
                        <div className="mt-0.5 flex items-center gap-1 truncate text-xs text-slate-500">
                          <Building2 className="h-3 w-3 shrink-0" />
                          {lead.company}
                        </div>
                      )}
                    </div>
                    <span
                      className={`shrink-0 rounded-md border px-1.5 py-0.5 text-xs font-bold ${scoreColor(
                        lead.score
                      )}`}
                    >
                      {lead.score}
                    </span>
                  </div>

                  <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
                    {lead.email && (
                      <span className="inline-flex items-center gap-1 truncate">
                        <Mail className="h-3 w-3" />
                        <span className="truncate max-w-[120px]">{lead.email}</span>
                      </span>
                    )}
                    {lead.phone && (
                      <span className="inline-flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {lead.phone}
                      </span>
                    )}
                  </div>

                  <div className="mt-2 flex items-center justify-between">
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-slate-600">
                      <Target className="h-2.5 w-2.5" />
                      {sourceLabel(lead.source)}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {timeSince(lead.createdAt)}
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
