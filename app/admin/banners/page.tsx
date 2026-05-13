import { requireAdmin } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";
import { BannersManager } from "./banners-manager";

export const dynamic = "force-dynamic";
export const metadata = { title: "Banners · Admin" };

export default async function BannersPage() {
  await requireAdmin();
  const supabase = createClient();

  const { data: banners } = await supabase
    .from("ad_banners")
    .select("*")
    .order("slot_key")
    .order("sort_order");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold uppercase">Banners</h1>
        <p className="text-sm text-[var(--text-muted)] mt-1">
          Gerencie banners publicitários nos slots do catálogo e páginas de anúncio.
        </p>
      </div>

      <BannersManager banners={banners ?? []} />
    </div>
  );
}
