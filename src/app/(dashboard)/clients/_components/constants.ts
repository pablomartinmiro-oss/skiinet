import type { SkiLevel, HelmetSize, ClientLanguage } from "@/hooks/useClients";

export const SKI_LEVELS: { value: SkiLevel; label: string; color: string }[] = [
  { value: "principiante", label: "Principiante", color: "#7C9CB8" },
  { value: "intermedio", label: "Intermedio", color: "#5B8C6D" },
  { value: "avanzado", label: "Avanzado", color: "#D4A853" },
  { value: "experto", label: "Experto", color: "#E87B5A" },
];

export const HELMET_SIZES: HelmetSize[] = ["S", "M", "L", "XL"];

export const CLIENT_LANGUAGES: { value: ClientLanguage; label: string }[] = [
  { value: "es", label: "Español" },
  { value: "en", label: "Inglés" },
  { value: "fr", label: "Francés" },
  { value: "de", label: "Alemán" },
  { value: "pt", label: "Portugués" },
];

export const SOURCES = [
  "Web",
  "Teléfono",
  "Email",
  "Groupon",
  "Referido",
  "Presencial",
  "Otro",
];

export const STATIONS_LIST = [
  { value: "baqueira", label: "Baqueira Beret" },
  { value: "sierra_nevada", label: "Sierra Nevada" },
  { value: "valdesqui", label: "Valdesquí" },
  { value: "la_pinilla", label: "La Pinilla" },
  { value: "grandvalira", label: "Grandvalira" },
  { value: "formigal", label: "Formigal" },
  { value: "alto_campoo", label: "Alto Campoo" },
];

export function skiLevelMeta(value: string | null) {
  return SKI_LEVELS.find((l) => l.value === value);
}

export function stationLabel(value: string | null) {
  return STATIONS_LIST.find((s) => s.value === value)?.label ?? value ?? "—";
}
