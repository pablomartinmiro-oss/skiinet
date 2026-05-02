"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { Client } from "@/hooks/useClients";
import { useUpdateClient } from "@/hooks/useClients";

const TS_RE = /^\[(\d{4}-\d{2}-\d{2}\s\d{2}:\d{2})\]/;

export function NotesTab({ client }: { client: Client }) {
  const update = useUpdateClient();
  const [draft, setDraft] = useState("");
  const [notes, setNotes] = useState(client.notes ?? "");

  useEffect(() => {
    setNotes(client.notes ?? "");
  }, [client.notes]);

  function handleAdd() {
    const text = draft.trim();
    if (!text) return;
    const stamp = new Date().toLocaleString("es-ES", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).replace(",", "");
    const entry = `[${stamp}] ${text}`;
    const merged = notes ? `${entry}\n\n${notes}` : entry;
    update.mutate(
      { id: client.id, notes: merged },
      {
        onSuccess: () => {
          setNotes(merged);
          setDraft("");
          toast.success("Nota añadida");
        },
        onError: () => toast.error("Error al guardar nota"),
      }
    );
  }

  const entries = parseNotes(notes);

  return (
    <div className="space-y-3">
      <div className="glass-card p-3">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={3}
          placeholder="Escribe una nueva nota..."
          className="w-full resize-none rounded-[10px] border border-[#E8E4DE] bg-[#FAF9F7] px-3 py-2 text-sm focus:border-[#E87B5A] focus:outline-none"
        />
        <div className="mt-2 flex justify-end">
          <Button
            onClick={handleAdd}
            disabled={!draft.trim() || update.isPending}
            className="bg-[#E87B5A] text-white hover:bg-[#D56E4F]"
          >
            {update.isPending ? "Guardando..." : "Añadir nota"}
          </Button>
        </div>
      </div>

      {entries.length === 0 ? (
        <p className="rounded-[10px] border border-dashed border-[#E8E4DE] bg-white px-3 py-6 text-center text-sm text-[#8A8580]">
          Sin notas todavía
        </p>
      ) : (
        <ul className="space-y-2">
          {entries.map((e, i) => (
            <li key={i} className="rounded-[10px] border border-[#E8E4DE] bg-white px-3 py-2">
              {e.timestamp && (
                <p className="text-[10px] font-medium uppercase tracking-wide text-[#8A8580]">
                  {e.timestamp}
                </p>
              )}
              <p className="mt-0.5 whitespace-pre-wrap text-sm text-[#2D2A26]">{e.text}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function parseNotes(raw: string): { timestamp: string | null; text: string }[] {
  if (!raw.trim()) return [];
  const blocks = raw.split(/\n{2,}/);
  return blocks.map((block) => {
    const m = block.match(TS_RE);
    if (m) {
      return { timestamp: m[1], text: block.slice(m[0].length).trim() };
    }
    return { timestamp: null, text: block.trim() };
  });
}
