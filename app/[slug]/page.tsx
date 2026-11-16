import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ListingDetailView } from "@/components/reforma/listing-detail-view";
import { getActiveBanners } from "@/lib/content";
import type { ListingWithImages } from "@/lib/listings";

export const dynamic = "force-dynamic";

type Props = { params: { slug: string } };

/** Evita que /icon.png, *.css, *.js etc. caiam no handler dinâmico de produto. */
const STATIC_FILE_SLUG = /\.(?:png|jpe?g|gif|webp|ico|svg|css|js|map|txt|xml|woff2?|ttf|eot)$/i;

function assertProductSlug(slug: string) {
  if (!slug || STATIC_FILE_SLUG.test(slug) || slug.includes(".")) {
    notFound();
  }
}

export async function generateMetadata({ params }: Props) {
  assertProductSlug(params.slug);

  const supabase = createClient();
  const { data } = await supabase
    .from("listings")
    .select("title, description, city, state")
    .eq("slug", params.slug)
    .eq("status", "active")
    .single();

  if (!data) return { title: "Produto não encontrado · Metalife Pilates" };

  return {
    title: `${data.title} · Loja Oficial Metalife Pilates`,
    description:
      data.description?.slice(0, 160) ??
      `Equipamento de Pilates Metalife — ${data.city}, ${data.state}. Loja Oficial.`,
  };
}

export default async function ListingPage({ params }: Props) {
  assertProductSlug(params.slug);

  const supabase = createClient();

  const { data: listing } = await supabase
    .from("listings")
    .select("*, listing_images(storage_path, position)")
    .eq("slug", params.slug)
    .eq("status", "active")
    .single();

  if (!listing) notFound();

  const [{ data: vendor }, { data: variants }, banners] = await Promise.all([
    supabase
      .from("vendors")
      .select("name, is_verified")
      .eq("id", listing.vendor_id)
      .single(),
    supabase
      .from("listing_variants")
      .select("*")
      .eq("listing_id", listing.id)
      .eq("active", true)
      .order("created_at", { ascending: true }),
    getActiveBanners("listing_footer"),
  ]);

  return (
    <ListingDetailView
      listing={listing as ListingWithImages & { is_featured?: boolean }}
      vendorName={vendor?.name ?? "Metalife Pilates"}
      vendorVerified={vendor?.is_verified ?? true}
      banners={banners}
      variants={variants ?? []}
    />
  );
}
