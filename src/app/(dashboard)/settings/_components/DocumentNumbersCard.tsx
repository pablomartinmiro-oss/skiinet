"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

function fetchJSON<T>(url: string): Promise<T> {
  return fetch(url).then((r) => {
    if (!r.ok) throw new Error(`Fetch failed: ${r.status}`);
    return r.json() as Promise<T>;
  });
}
import { Hash, Pencil, RotateCcw, ChevronDown, ChevronUp } from "lucide-react";

interface CounterRow {
  id: string | null;
  documentType: string;
  label: string;
  year: number;
  currentNumber: number;
  prefix: string;
  nextNumber: string;
}

function useDocCounters() {
  return useQuery({
    queryKey: ["doc-numbers"],
    queryFn: () =>
      fetchJSON<{ counters: CounterRow[] }>("/api/settings/doc-numbers"),
  });
}

function useUpdatePrefix() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      prefix,
    }: {
      id: string;
      prefix: string;
    }) => {
      const res = await fetch(`/api/settings/doc-numbers/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prefix }),
      });
      if (!res.ok) throw new Error("Error al actualizar prefijo");
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["doc-numbers"] });
      toast.success("Prefijo actualizado");
    },
    onError: () => toast.error("Error al actualizar prefijo"),
  });
}

function useResetCounter() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      newValue,
    }: {
      id: string;
      newValue: number;
    }) => {
      const res = await fetch(`/api/settings/doc-numbers/${id}/reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newValue }),
      });
      if (!res.ok) throw new Error("Error al resetear contador");
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["doc-numbers"] });
      toast.success("Contador reseteado");
    },
    onError: () => toast.error("Error al resetear contador"),
  });
}

function CounterRowCard({ counter }: { counter: CounterRow }) {
  const [editing, setEditing] = useState(false);
  const [prefix, setPrefix] = useState(counter.prefix);
  const updatePrefix = useUpdatePrefix();
  const resetCounter = useResetCounter();

  function handleSavePrefix() {
    if (!counter.id || prefix === counter.prefix) {
      setEditing(false);
      return;
    }
    updatePrefix.mutate(
      { id: counter.id, prefix },
      { onSuccess: () => setEditing(false) }
    );
  }

  function handleReset() {
    if (!counter.id) return;
    if (!confirm("¿Resetear este contador a 0? Esta acción no se puede deshacer.")) return;
    resetCounter.mutate({ id: counter.id, newValue: 0 });
  }

  return (
    <div className="flex items-center justify-between py-3 px-4 rounded-xl border border-border bg-white hover:bg-slate-50 transition-colors">
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 shrink-0">
          <Hash className="h-4 w-4 text-coral" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-900">{counter.label}</p>
          <p className="text-xs text-slate-500">
            Siguiente: <span className="font-mono">{counter.nextNumber}</span>
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {editing ? (
          <div className="flex items-center gap-1">
            <input
              type="text"
              value={prefix}
              onChange={(e) => setPrefix(e.target.value.toUpperCase())}
              className="w-20 rounded-lg border border-border px-2 py-1 text-xs font-mono"
              maxLength={10}
            />
            <button
              onClick={handleSavePrefix}
              disabled={updatePrefix.isPending}
              className="rounded-lg bg-coral px-2 py-1 text-xs text-white hover:bg-coral/90 disabled:opacity-50"
            >
              OK
            </button>
            <button
              onClick={() => { setPrefix(counter.prefix); setEditing(false); }}
              className="rounded-lg px-2 py-1 text-xs text-slate-500 hover:text-slate-700"
            >
              Cancelar
            </button>
          </div>
        ) : (
          <>
            <span className="font-mono text-xs text-slate-600 bg-slate-100 px-2 py-1 rounded-md">
              {counter.prefix}
            </span>
            <span className="text-xs text-slate-500">
              #{counter.currentNumber}
            </span>
            {counter.id && (
              <>
                <button
                  onClick={() => setEditing(true)}
                  className="p-1 rounded-md hover:bg-slate-100"
                  title="Editar prefijo"
                >
                  <Pencil className="h-3.5 w-3.5 text-slate-400" />
                </button>
                <button
                  onClick={handleReset}
                  disabled={resetCounter.isPending}
                  className="p-1 rounded-md hover:bg-red-50"
                  title="Resetear contador"
                >
                  <RotateCcw className="h-3.5 w-3.5 text-slate-400" />
                </button>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export function DocumentNumbersCard() {
  const { data, isLoading } = useDocCounters();
  const [expanded, setExpanded] = useState(false);

  if (isLoading) {
    return (
      <div className="glass-card p-6 animate-pulse">
        <div className="h-5 w-48 bg-slate-100 rounded" />
        <div className="mt-4 space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-12 bg-slate-50 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const counters = data?.counters ?? [];
  const visible = expanded ? counters : counters.slice(0, 4);

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">
            Numeración de documentos
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Configura prefijos y contadores para cada tipo de documento
          </p>
        </div>
      </div>

      <div className="space-y-2">
        {visible.map((counter) => (
          <CounterRowCard key={counter.documentType} counter={counter} />
        ))}
      </div>

      {counters.length > 4 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-3 flex items-center gap-1 text-xs text-coral hover:text-coral/80 mx-auto"
        >
          {expanded ? (
            <>
              <ChevronUp className="h-3.5 w-3.5" /> Mostrar menos
            </>
          ) : (
            <>
              <ChevronDown className="h-3.5 w-3.5" /> Ver todos ({counters.length})
            </>
          )}
        </button>
      )}
    </div>
  );
}
