import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ListingDetailView } from "@/components/reforma/listing-detail-view";
import type { ListingWithImages } from "@/lib/listings";

export const dynamic = "force-dynamic";

type Props = { params: { slug: string } };

export async function generateMetadata({ params }: Props) {
  const supabase = createClient();
  const { data } = await supabase
    .from("listings")
    .select("title, description, city, state")
    .eq("slug", params.slug)
    .eq("status", "active")
    .single();

  if (!data) return { title: "Anúncio não encontrado · Classificado Pilates" };

  return {
    title: `${data.title} · Classificado Pilates`,
    description:
      data.description?.slice(0, 160) ??
      `Equipamento de Pilates em ${data.city}, ${data.state}. Anúncio direto do vendedor.`,
  };
}

export default async function ListingPage({ params }: Props) {
  const supabase = createClient();

  const { data: listing } = await supabase
    .from("listings")
    .select("*, listing_images(storage_path, position)")
    .eq("slug", params.slug)
    .eq("status", "active")
    .single();

  if (!listing) notFound();

  return <ListingDetailView listing={listing as ListingWithImages} />;
}
