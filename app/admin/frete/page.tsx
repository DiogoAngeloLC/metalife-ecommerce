import { requireAdmin } from "@/lib/supabase/auth";
import { createServiceClient } from "@/lib/supabase/server";
import { AdminShippingManager } from "@/components/admin/admin-shipping-manager";

export const dynamic = "force-dynamic";

export default async function AdminShippingPage() {
  await requireAdmin();
  const supabase = createServiceClient();
  const { data: rules } = await supabase
    .from("shipping_rules")
    .select("*")
    .order("uf", { ascending: true })
    .order("name", { ascending: true });

  return (
    <div className="p-6 md:p-8 max-w-5xl">
      <div className="mb-6">
        <div className="text-label-bold text-[var(--text-muted)] mb-2">LOJA OFICIAL</div>
        <h1 className="font-display text-3xl font-bold uppercase text-[var(--ink)]">
          Frete e Entrega
        </h1>
        <p className="mt-2 text-sm text-[var(--ink-soft)]">
          Gerencie modalidades e valores de frete por UF sem alterar o banco manualmente.
        </p>
      </div>
      <AdminShippingManager initialRules={rules ?? []} />
    </div>
  );
}
