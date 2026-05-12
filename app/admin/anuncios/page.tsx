import { createClient } from "@/lib/supabase/server";
import { AdminListingsContent } from "@/components/admin/admin-listings-content";
import type { Database } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

type Status = Database["public"]["Tables"]["listings"]["Row"]["status"];

export default async function AdminListingsPage({
  searchParams,
}: {
  searchParams: { status?: string; q?: string };
}) {
  const supabase = createClient();
  const statusFilter = searchParams.status as Status | undefined;
  const query = searchParams.q ?? "";

  let queryBuilder = supabase
    .from("listings")
    .select("*, listing_images(storage_path, position), vendors(name, whatsapp, city)")
    .order("created_at", { ascending: false })
    .limit(100);

  if (statusFilter) queryBuilder = queryBuilder.eq("status", statusFilter);
  if (query) {
    queryBuilder = queryBuilder.or(
      `title.ilike.%${query}%,equipment_type.ilike.%${query}%,brand.ilike.%${query}%`
    );
  }

  const { data: listings } = await queryBuilder;

  return (
    <AdminListingsContent
      listings={listings ?? []}
      activeStatus={statusFilter ?? "all"}
      query={query}
    />
  );
}
