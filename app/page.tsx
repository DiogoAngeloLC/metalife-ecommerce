import { createClient } from "@/lib/supabase/server";
import { HomePageContent } from "@/components/reforma/home-page-content";
import { getHeroSettings } from "@/lib/content";
import type { ListingWithImages } from "@/lib/listings";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const supabase = createClient();

  const [heroSettings, { data: listingsRaw }] = await Promise.all([
    getHeroSettings(),
    supabase
      .from("listings")
      .select("*, listing_images(storage_path, position)")
      .eq("status", "active")
      .order("published_at", { ascending: false })
      .limit(48),
  ]);

  const listings = (listingsRaw ?? []) as ListingWithImages[];

  // Stats reais
  const [{ count: totalListings }, { data: citiesData }, { count: totalVendors }] =
    await Promise.all([
      supabase.from("listings").select("*", { count: "exact", head: true }).eq("status", "active"),
      supabase.from("listings").select("city").eq("status", "active"),
      supabase
        .from("vendors")
        .select("*", { count: "exact", head: true })
        .eq("onboarding_completed", true),
    ]);

  const totalCities = new Set(citiesData?.map((l) => l.city) ?? []).size;

  return (
    <HomePageContent
      listings={listings}
      stats={{
        listings: totalListings ?? 0,
        cities: totalCities,
        vendors: totalVendors ?? 0,
      }}
      hero={heroSettings}
    />
  );
}
