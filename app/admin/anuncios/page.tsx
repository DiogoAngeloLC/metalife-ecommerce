import { requireAdmin } from "@/lib/supabase/auth";
import { createServiceClient } from "@/lib/supabase/server";
import { AdminCatalogManager } from "@/components/admin/admin-catalog-manager";
import { ADMIN_CATEGORIES } from "@/lib/admin/catalog";

export const dynamic = "force-dynamic";

export default async function AdminListingsPage({
  searchParams,
}: {
  searchParams: { status?: string; q?: string; categoria?: string; sem_foto?: string };
}) {
  await requireAdmin();
  const supabase = createServiceClient();

  const statusFilter = searchParams.status ?? "all";
  const query = (searchParams.q ?? "").trim();
  const categoria = (searchParams.categoria ?? "").trim();
  const semFoto = searchParams.sem_foto === "1";

  const [{ data: listingsRaw }, { count: totalCount }, { count: activeCount }, { count: draftCount }] =
    await Promise.all([
      supabase
        .from("listings")
        .select(
          "id, title, slug, status, equipment_type, brand, price, has_fixed_price, created_at, listing_images(id, storage_path, position), listing_variants(id, price_cents, active, sku, protheus_code)"
        )
        .order("created_at", { ascending: false })
        .limit(500),
      supabase.from("listings").select("*", { count: "exact", head: true }),
      supabase.from("listings").select("*", { count: "exact", head: true }).eq("status", "active"),
      supabase.from("listings").select("*", { count: "exact", head: true }).eq("status", "draft"),
    ]);

  let listings = listingsRaw ?? [];

  if (statusFilter === "active" || statusFilter === "draft") {
    listings = listings.filter((l) => l.status === statusFilter);
  }
  if (categoria) {
    listings = listings.filter(
      (l) => (l.equipment_type ?? "").toLowerCase() === categoria.toLowerCase()
    );
  }
  if (semFoto) {
    listings = listings.filter((l) => !l.listing_images || l.listing_images.length === 0);
  }
  if (query) {
    const q = query.toLowerCase();
    listings = listings.filter((l) => {
      const variants = l.listing_variants ?? [];
      const hay = [
        l.title,
        l.slug,
        l.equipment_type,
        l.brand,
        ...variants.map((v) => v.sku ?? ""),
        ...variants.map((v) => v.protheus_code ?? ""),
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }

  const withoutPhotoCount = (listingsRaw ?? []).filter(
    (l) => !l.listing_images || l.listing_images.length === 0
  ).length;

  return (
    <AdminCatalogManager
      listings={listings}
      counts={{
        all: totalCount ?? listings.length,
        active: activeCount ?? 0,
        draft: draftCount ?? 0,
        withoutPhoto: withoutPhotoCount,
      }}
      filters={{
        status: statusFilter,
        q: query,
        categoria,
        semFoto,
      }}
      categories={ADMIN_CATEGORIES.map((c) => ({ value: c.value, label: c.label }))}
    />
  );
}
