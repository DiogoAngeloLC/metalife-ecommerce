import { notFound } from "next/navigation";
import { requireVendor } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";
import { CreateListingForm, type InitialListingForEdit } from "@/components/reforma/create-listing-form";
import { isListingEditableByVendor } from "@/lib/listings";

export const metadata = { title: "Editar anúncio · Classificado Pilates" };

export default async function EditarAnuncioPage({ params }: { params: { id: string } }) {
  const vendor = await requireVendor();
  const supabase = createClient();

  const { data: row, error } = await supabase
    .from("listings")
    .select(
      "id, title, description, equipment_type, brand, year, condition, has_fixed_price, price, is_negotiable, city, state, vendor_id, status, listing_images(storage_path, position)"
    )
    .eq("id", params.id)
    .single();

  if (error || !row) notFound();
  if (row.vendor_id !== vendor.id) notFound();
  if (!isListingEditableByVendor(row.status)) notFound();

  const initial: InitialListingForEdit = {
    id: row.id,
    title: row.title,
    description: row.description,
    equipment_type: row.equipment_type,
    brand: row.brand,
    year: row.year,
    condition: row.condition,
    has_fixed_price: row.has_fixed_price,
    price: row.price,
    is_negotiable: row.is_negotiable,
    city: row.city,
    state: row.state,
    listing_images: (row.listing_images ?? []) as { storage_path: string; position: number }[],
  };

  return <CreateListingForm vendor={vendor} initialListing={initial} />;
}
