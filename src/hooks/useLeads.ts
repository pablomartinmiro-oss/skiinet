"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface Lead {
  id: string;
  tenantId: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  source: string;
  status: string;
  score: number;
  assignedTo: string | null;
  pipelineStage: string;
  notes: string | null;
  tags: string[];
  customFields: Record<string, unknown> | null;
  lastContactedAt: string | null;
  convertedAt: string | null;
  lostReason: string | null;
  quoteId: string | null;
  createdAt: string;
  updatedAt: string;
  assignedUser?: { id: string; name: string | null; email: string } | null;
}

export interface LeadFilters {
  status?: string;
  source?: string;
  assignedTo?: string;
  minScore?: number;
  maxScore?: number;
  search?: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortDir?: "asc" | "desc";
}

export interface LeadStats {
  total: number;
  byStatus: Record<string, number>;
  avgScore: number;
  conversionRate: number;
}

async function fetchJSON<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error ?? `Fetch failed: ${res.status}`);
  }
  return res.json();
}

function buildQS(filters?: LeadFilters): string {
  if (!filters) return "";
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== null && value !== "") {
      params.set(key, String(value));
    }
  }
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export function useLeads(filters?: LeadFilters) {
  return useQuery({
    queryKey: ["leads", filters],
    queryFn: () =>
      fetchJSON<{ leads: Lead[]; total: number; page: number; pageSize: number }>(
        `/api/leads${buildQS(filters)}`
      ),
  });
}

export function useLead(id: string | null) {
  return useQuery({
    queryKey: ["lead", id],
    queryFn: () => fetchJSON<{ lead: Lead }>(`/api/leads/${id}`),
    select: (data) => data.lead,
    enabled: !!id,
  });
}

export function useLeadStats() {
  return useQuery({
    queryKey: ["leads", "stats"],
    queryFn: () => fetchJSON<LeadStats>("/api/leads/stats"),
  });
}

export function useCreateLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Lead>) =>
      fetchJSON<{ lead: Lead }>("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["leads"] });
    },
  });
}

export function useUpdateLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Partial<Lead>) =>
      fetchJSON<{ lead: Lead }>(`/api/leads/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["leads"] });
      qc.invalidateQueries({ queryKey: ["lead", vars.id] });
    },
  });
}

export function useDeleteLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      fetchJSON<{ success: boolean }>(`/api/leads/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["leads"] });
    },
  });
}

export function useConvertLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      ...payload
    }: { id: string } & Record<string, unknown>) =>
      fetchJSON<{ lead: Lead; quote: { id: string } }>(`/api/leads/${id}/convert`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["leads"] });
      qc.invalidateQueries({ queryKey: ["quotes"] });
    },
  });
}

export function useImportLeads() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (leads: Partial<Lead>[]) =>
      fetchJSON<{ count: number }>("/api/leads/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leads }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["leads"] });
    },
  });
}

export function useScoreLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (leadId: string) =>
      fetchJSON<{ lead: Lead; score: number }>("/api/leads/score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId }),
      }),
    onSuccess: (_data, leadId) => {
      qc.invalidateQueries({ queryKey: ["leads"] });
      qc.invalidateQueries({ queryKey: ["lead", leadId] });
    },
  });
}
