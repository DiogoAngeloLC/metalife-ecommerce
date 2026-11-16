import { OFFICIAL_VENDOR_ID } from "@/lib/official-store";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

export { OFFICIAL_VENDOR_ID };

export const ADMIN_CATEGORIES = [
  { value: "reformer", label: "Reformer" },
  { value: "cadillac", label: "Cadillac" },
  { value: "wall-unit", label: "Wall Unit" },
  { value: "chair", label: "Chair" },
  { value: "barrel", label: "Barrel" },
  { value: "acessorios", label: "Acessórios" },
] as const;

export type AdminCategory = (typeof ADMIN_CATEGORIES)[number]["value"];

export function slugifyTitle(title: string): string {
  return title
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export async function ensureUniqueSlug(
  supabase: SupabaseClient<Database>,
  base: string,
  excludeId?: string
): Promise<string> {
  const slug = base || `produto-${Date.now()}`;
  for (let i = 0; i < 20; i++) {
    const candidate = i === 0 ? slug : `${slug}-${i + 1}`;
    let q = supabase.from("listings").select("id").eq("slug", candidate);
    if (excludeId) q = q.neq("id", excludeId);
    const { data } = await q.maybeSingle();
    if (!data) return candidate;
  }
  return `${slug}-${Date.now().toString(36)}`;
}

/** Recalcula listings.price (reais) a partir do menor price_cents das variantes ativas. */
export async function syncListingPriceFromVariants(
  supabase: SupabaseClient<Database>,
  listingId: string
): Promise<void> {
  const { data: variants } = await supabase
    .from("listing_variants")
    .select("price_cents")
    .eq("listing_id", listingId)
    .eq("active", true);

  if (!variants || variants.length === 0) return;

  const minCents = Math.min(...variants.map((v) => v.price_cents));
  if (!Number.isFinite(minCents) || minCents < 0) return;

  await supabase
    .from("listings")
    .update({
      price: minCents / 100,
      has_fixed_price: true,
      is_negotiable: false,
      updated_at: new Date().toISOString(),
    })
    .eq("id", listingId);
}
