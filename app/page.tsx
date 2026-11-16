import { createClient } from "@/lib/supabase/server";
import { HomePageContent } from "@/components/reforma/home-page-content";
import { getHeroSettings } from "@/lib/content";
import { getFooterConfig } from "@/lib/site-config";
import type { ListingWithImages } from "@/lib/listings";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const supabase = createClient();

  const [heroSettings, { data: listingsRaw }, footer] = await Promise.all([
    getHeroSettings(),
    supabase
      .from("listings")
      .select("*, listing_images(storage_path, position)")
      .eq("status", "active")
      .order("published_at", { ascending: false })
      .limit(48),
    getFooterConfig(),
  ]);

  const listings = (listingsRaw ?? []) as ListingWithImages[];

  const [{ count: totalProducts }, { data: typeRows }, { data: activeIds }] =
    await Promise.all([
      supabase
        .from("listings")
        .select("*", { count: "exact", head: true })
        .eq("status", "active"),
      supabase.from("listings").select("equipment_type").eq("status", "active"),
      supabase.from("listings").select("id").eq("status", "active"),
    ]);

  const ids = (activeIds ?? []).map((r) => r.id);
  let totalVariants = 0;
  if (ids.length > 0) {
    const { count } = await supabase
      .from("listing_variants")
      .select("*", { count: "exact", head: true })
      .in("listing_id", ids)
      .eq("active", true);
    totalVariants = count ?? 0;
  }

  const totalLines = new Set(
    (typeRows ?? []).map((l) => (l.equipment_type ?? "").toLowerCase()).filter(Boolean)
  ).size;

  return (
    <HomePageContent
      listings={listings}
      stats={{
        products: totalProducts ?? listings.length,
        lines: totalLines,
        variants: totalVariants,
      }}
      hero={heroSettings}
      footer={footer}
    />
  );
}
