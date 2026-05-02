import type { Client } from "@/hooks/useClients";

const HEADERS = [
  "Nombre",
  "Email",
  "Teléfono",
  "DNI",
  "Nivel",
  "Estacion",
  "Talla bota",
  "Casco",
  "Altura",
  "Peso",
  "Idioma",
  "Fuente",
  "Gasto total (EUR)",
  "Visitas",
  "Ultima visita",
  "Fecha alta",
];

function escape(value: unknown): string {
  if (value === null || value === undefined) return "";
  const s = String(value);
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function fmtDate(d: string | null) {
  return d ? new Date(d).toISOString().split("T")[0] : "";
}

export function exportClientsCSV(clients: Client[]) {
  const rows = clients.map((c) => [
    c.name,
    c.email,
    c.phone,
    c.dni,
    c.skiLevel,
    c.preferredStation,
    c.bootSize,
    c.helmetSize,
    c.height,
    c.weight,
    c.language,
    c.conversionSource,
    (c.totalSpent / 100).toFixed(2),
    c.visitCount,
    fmtDate(c.lastVisit),
    fmtDate(c.createdAt),
  ]);
  const csv = [HEADERS, ...rows].map((r) => r.map(escape).join(",")).join("\n");
  const blob = new Blob([`﻿${csv}`], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `clientes-${new Date().toISOString().split("T")[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
