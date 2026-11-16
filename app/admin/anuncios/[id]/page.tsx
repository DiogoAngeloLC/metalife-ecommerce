import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/supabase/auth";
import { createServiceClient } from "@/lib/supabase/server";
import { AdminProductEditor } from "@/components/admin/admin-product-editor";

export const dynamic = "force-dynamic";

type Props = { params: { id: string } };

export async function generateMetadata({ params }: Props) {
  return { title: `Produto ${params.id.slice(0, 8)} · Admin` };
}

export default async function AdminListingDetailPage({ params }: Props) {
  await requireAdmin();
  const supabase = createServiceClient();

  const { data: listing } = await supabase
    .from("listings")
    .select(
      "id, title, slug, description, price, has_fixed_price, status, equipment_type, brand"
    )
    .eq("id", params.id)
    .single();

  if (!listing) notFound();

  const [{ data: variants }, { data: images }] = await Promise.all([
    supabase
      .from("listing_variants")
      .select("*")
      .eq("listing_id", listing.id)
      .order("created_at", { ascending: true }),
    supabase
      .from("listing_images")
      .select("*")
      .eq("listing_id", listing.id)
      .order("position", { ascending: true }),
  ]);

  return (
    <AdminProductEditor
      mode="edit"
      listing={listing}
      images={images ?? []}
      variants={variants ?? []}
    />
  );
}
