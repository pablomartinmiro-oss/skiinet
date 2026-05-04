/**
 * Skicenter brand kit — used by template seeders to render
 * professional email and PDF templates with the company's
 * actual identity. Keep this file as the source of truth for
 * brand attributes.
 */

export const SKICENTER_BRAND = {
  name: "Skicenter",
  legalName: "Skicenter S.L.",
  tagline: "Todo tu viaje de esquí en un solo clic",
  // Visual
  primary: "#0F2A4A",        // Deep navy — corporate
  accent: "#FF6B35",         // Winter orange — CTA / highlights
  surface: "#FAFBFC",        // Off-white background
  textPrimary: "#1A1A1A",
  textSecondary: "#5A5A5A",
  border: "#E5E7EB",
  // Logo
  logoUrl: "https://skicenter.es/wp-content/uploads/2024/01/logo-skicenter.png",
  // Contact
  phone: "+34 91 904 19 47",
  email: "reservas@skicenter.es",
  hours: "Lunes–Viernes, 8:30–20:00",
  // Fiscal
  nif: "B-XXXXXXXX", // Placeholder — admin debe completar en Settings
  address: "Edificio Forum, C/ Jose Luis Perez Pujadas 14, 18006 Granada",
  registry: "C.I.AN nº 188002-3",
  // Web
  website: "https://skicenter.es",
} as const;

export type Brand = typeof SKICENTER_BRAND;
