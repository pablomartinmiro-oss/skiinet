/**
 * Map a product category (or QuoteItem variables) to the canonical module
 * that owns the cascade logic when a Reservation is confirmed.
 *
 *  - "rental"     → spin up RentalOrder + reserve RentalInventory units
 *  - "hotel"      → spin up LodgeStay + RoomBlock for the nights
 *  - "spa"        → spin up SpaSlot booking
 *  - "instructor" → spin up ActivityBooking (planning later assigns instructor)
 *  - "catalog"    → no sub-record (forfait, après-ski, taxi, menu, locker, pack, …)
 */
export type ModuleType = "catalog" | "rental" | "hotel" | "spa" | "instructor";

export const ALL_MODULE_TYPES: ModuleType[] = [
  "catalog",
  "rental",
  "hotel",
  "spa",
  "instructor",
];

interface CategoryHints {
  category?: string | null;
  alojamientoNombre?: string | null;
  regimen?: string | null;
}

export function categoryToModule(input: CategoryHints): ModuleType {
  const cat = (input.category ?? "").toLowerCase();

  if (cat === "alquiler" || cat === "rental") return "rental";
  if (cat === "hotel" || cat === "alojamiento" || input.alojamientoNombre || input.regimen) return "hotel";
  if (cat === "spa") return "spa";
  if (cat === "clase_particular" || cat === "escuela" || cat === "snowcamp" || cat === "instructor") {
    return "instructor";
  }
  return "catalog";
}
