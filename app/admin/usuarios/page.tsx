import { createClient } from "@/lib/supabase/server";
import { AdminUsersContent } from "@/components/admin/admin-users-content";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const supabase = createClient();

  const { data: vendorsRaw } = await supabase
    .from("vendors")
    .select("*")
    .order("created_at", { ascending: false });

  const { data: adminIds } = await supabase.from("app_admins").select("user_id");
  const adminSet = new Set(adminIds?.map((a) => a.user_id) ?? []);

  const vendorsWithCounts = await Promise.all(
    (vendorsRaw ?? []).map(async (v) => {
      const { count } = await supabase
        .from("listings")
        .select("*", { count: "exact", head: true })
        .eq("vendor_id", v.id);
      return { ...v, listings_count: count ?? 0, is_admin: adminSet.has(v.id) };
    })
  );

  return <AdminUsersContent vendors={vendorsWithCounts} />;
}
