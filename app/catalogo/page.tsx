import { createClient } from "@/lib/supabase/server";
import { CatalogContent } from "@/components/reforma/catalog-content";
import { getActiveBanners } from "@/lib/content";
import { getFooterConfig } from "@/lib/site-config";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Catálogo · Classificado Pilates",
  description: "Todos os equipamentos de Pilates disponíveis no marketplace.",
};

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: { categoria?: string; ordem?: string; busca?: string };
}) {
  const supabase = createClient();
  const [banners, footer] = await Promise.all([
    getActiveBanners("catalog_sidebar"),
    getFooterConfig(),
  ]);

  const orderCol = searchParams.ordem === "preco_asc" || searchParams.ordem === "preco_desc"
    ? "price"
    : "published_at";
  const ascending = searchParams.ordem === "preco_asc";

  let query = supabase
    .from("listings")
    .select("*, listing_images(storage_path, position)")
    .eq("status", "active")
    .order(orderCol, { ascending })
    .limit(60);

  if (searchParams.categoria) {
    query = query.ilike("equipment_type", `%${searchParams.categoria}%`);
  }
  if (searchParams.busca) {
    query = query.or(
      `title.ilike.%${searchParams.busca}%,brand.ilike.%${searchParams.busca}%`
    );
  }

  const { data: listings } = await query;

  return (
    <CatalogContent
      listings={listings ?? []}
      banners={banners}
      filters={searchParams}
      footer={footer}
    />
  );
}
