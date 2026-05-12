import { requireVendor } from "@/lib/supabase/auth";
import { CreateListingForm } from "@/components/reforma/create-listing-form";

export const metadata = { title: "Novo anúncio · Reforma" };

export default async function NovoAnuncioPage() {
  const vendor = await requireVendor();
  return <CreateListingForm vendor={vendor} />;
}
