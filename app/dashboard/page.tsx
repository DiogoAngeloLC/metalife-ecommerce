import { requireVendor } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";
import { DashboardContent } from "@/components/reforma/dashboard-content";

export const metadata = { title: "Painel · Classificado Pilates" };

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { published?: string; updated?: string };
}) {
  const vendor = await requireVendor();
  const supabase = createClient();

  const { data: listingsRaw } = await supabase
    .from("listings")
    .select("*, listing_images(storage_path, position)")
    .eq("vendor_id", vendor.id)
    .order("created_at", { ascending: false });

  const listings = listingsRaw ?? [];

  // Stats
  const activeCount = listings.filter((l) => l.status === "active").length;
  const pendingCount = listings.filter((l) => l.status === "pending_review").length;

  const listingIds = listings.map((l) => l.id);
  let leadsCount = 0;
  if (listingIds.length > 0) {
    const { count } = await supabase
      .from("leads")
      .select("*", { count: "exact", head: true })
      .in("listing_id", listingIds);
    leadsCount = count ?? 0;
  }

  return (
    <DashboardContent
      vendor={vendor}
      listings={listings}
      stats={{ activeCount, pendingCount, leadsCount }}
      justPublished={searchParams.published === "1"}
      justUpdated={searchParams.updated === "1"}
    />
  );
}
