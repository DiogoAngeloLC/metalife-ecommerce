import { createServiceClient } from "@/lib/supabase/server";
import { AdminLeadsContent } from "@/components/admin/admin-leads-content";

export const dynamic = "force-dynamic";

export default async function AdminLeadsPage() {
  const supabase = createServiceClient();

  const { data: leads } = await supabase
    .from("leads")
    .select("*, listings(title, slug, vendor_id, vendors(name, whatsapp))")
    .order("created_at", { ascending: false })
    .limit(200);

  return <AdminLeadsContent leads={leads ?? []} />;
}
