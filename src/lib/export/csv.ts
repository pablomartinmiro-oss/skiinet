export interface CsvColumn {
  key: string;
  label: string;
  format?: (v: unknown) => string;
}

function escapeCsvValue(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function exportToCSV(
  data: Record<string, unknown>[],
  filename: string,
  columns: CsvColumn[]
): void {
  const header = columns.map((c) => escapeCsvValue(c.label)).join(",");

  const rows = data.map((row) =>
    columns
      .map((col) => {
        const raw = row[col.key];
        const str = col.format ? col.format(raw) : String(raw ?? "");
        return escapeCsvValue(str);
      })
      .join(",")
  );

  const csv = [header, ...rows].join("\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
