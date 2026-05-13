import { createServiceClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/supabase/auth";
import { AdminUsersContent } from "@/components/admin/admin-users-content";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const admin = await requireAdmin();
  const supabase = createServiceClient();

  const { data: vendorsRaw } = await supabase
    .from("vendors")
    .select("*")
    .order("created_at", { ascending: false });

  const { data: adminIds } = await supabase.from("app_admins").select("user_id");
  const adminSet = new Set(adminIds?.map((a) => a.user_id) ?? []);

  const vendorsWithCounts = await Promise.all(
    (vendorsRaw ?? []).map(async (v) => {
      const [{ count }, authRes] = await Promise.all([
        supabase
          .from("listings")
          .select("*", { count: "exact", head: true })
          .eq("vendor_id", v.id),
        supabase.auth.admin.getUserById(v.id),
      ]);

      const u = authRes.data?.user;
      return {
        ...v,
        listings_count: count ?? 0,
        is_admin: adminSet.has(v.id),
        auth_email: u?.email ?? null,
        email_confirmed: Boolean(u?.email_confirmed_at),
        invited_at: u?.invited_at ?? null,
        last_sign_in_at: u?.last_sign_in_at ?? null,
      };
    })
  );

  return <AdminUsersContent vendors={vendorsWithCounts} currentAdminId={admin.id} />;
}
