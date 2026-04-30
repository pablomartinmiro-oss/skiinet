export const LEAD_STAGES = [
  { id: "nuevo", label: "Nuevo", color: "bg-blue-500" },
  { id: "contactado", label: "Contactado", color: "bg-amber-500" },
  { id: "calificado", label: "Calificado", color: "bg-purple-500" },
  { id: "convertido", label: "Convertido", color: "bg-emerald-500" },
  { id: "perdido", label: "Perdido", color: "bg-rose-500" },
] as const;

export const LEAD_SOURCES = [
  { id: "manual", label: "Manual" },
  { id: "web", label: "Web" },
  { id: "import", label: "Importado" },
  { id: "storefront", label: "Tienda" },
  { id: "referral", label: "Referido" },
] as const;

export function scoreColor(score: number): string {
  if (score > 80) return "bg-emerald-100 text-emerald-700 border-emerald-200";
  if (score >= 50) return "bg-amber-100 text-amber-700 border-amber-200";
  return "bg-rose-100 text-rose-700 border-rose-200";
}

export function scoreCardBorder(score: number): string {
  if (score > 80) return "border-l-emerald-500";
  if (score >= 50) return "border-l-amber-500";
  return "border-l-rose-500";
}

export function statusBadgeClass(status: string): string {
  switch (status) {
    case "nuevo": return "bg-blue-100 text-blue-700";
    case "contactado": return "bg-amber-100 text-amber-700";
    case "calificado": return "bg-purple-100 text-purple-700";
    case "convertido": return "bg-emerald-100 text-emerald-700";
    case "perdido": return "bg-rose-100 text-rose-700";
    default: return "bg-slate-100 text-slate-700";
  }
}

export function timeSince(dateStr: string): string {
  const ms = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(ms / 60000);
  if (minutes < 1) return "ahora";
  if (minutes < 60) return `hace ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `hace ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `hace ${days} d`;
  const months = Math.floor(days / 30);
  if (months < 12) return `hace ${months} m`;
  const years = Math.floor(months / 12);
  return `hace ${years} a`;
}

export function sourceLabel(source: string): string {
  return LEAD_SOURCES.find((s) => s.id === source)?.label ?? source;
}
