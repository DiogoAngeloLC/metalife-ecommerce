import type { Database } from "@/lib/supabase/types";

export type Listing = Database["public"]["Tables"]["listings"]["Row"];
export type ListingImage = Database["public"]["Tables"]["listing_images"]["Row"];

export type ListingWithImages = Listing & {
  listing_images: Pick<ListingImage, "storage_path" | "position">[];
};

export const EQUIPMENT_FILTERS = [
  "todos",
  "reformer",
  "cadillac",
  "wall unit",
  "chair",
  "barrel",
  "acessórios",
] as const;

export type EquipmentFilter = (typeof EQUIPMENT_FILTERS)[number];

/**
 * Cor de acento determinística pra card (visual fallback quando sem foto)
 * Baseado no primeiro char hex do uuid.
 */
export function listingAccent(id: string): "sage" | "terracota" {
  const c = id.charAt(0).toLowerCase();
  const hex = parseInt(c, 16);
  return isNaN(hex) || hex % 2 === 0 ? "sage" : "terracota";
}

/**
 * Filtra listings no client-side (busca + categoria).
 */
export function filterListings(
  listings: ListingWithImages[],
  filter: string,
  query: string
): ListingWithImages[] {
  return listings.filter((l) => {
    if (filter !== "todos") {
      if (!l.equipment_type.toLowerCase().includes(filter.toLowerCase())) {
        return false;
      }
    }
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      const hay = `${l.title} ${l.brand ?? ""} ${l.equipment_type} ${l.city}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

/**
 * Texto humano pra condition.
 */
export function conditionLabel(c: Listing["condition"]): string {
  return {
    novo: "Novo",
    seminovo: "Seminovo",
    usado_bom: "Usado · Bom estado",
    usado_regular: "Usado · Estado regular",
  }[c];
}

/**
 * Dias desde a publicação (pra "Publicado há X dias")
 */
export function daysSince(iso: string | null): number {
  if (!iso) return 0;
  const diff = Date.now() - new Date(iso).getTime();
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
}
