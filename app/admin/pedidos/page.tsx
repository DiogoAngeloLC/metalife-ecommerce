import Link from "next/link";
import { requireAdmin } from "@/lib/supabase/auth";
import { createServiceClient } from "@/lib/supabase/server";
import { formatCentsBRL } from "@/lib/format";
import { AdminOrdersManager } from "@/components/admin/admin-orders-manager";
import type { OrderStatus } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";
export const metadata = { title: "Pedidos · Admin" };

const STATUS_LABEL: Record<string, string> = {
  pending_payment: "Aguardando pagamento",
  paid: "Pago",
  preparing: "Preparando",
  shipped: "Enviado",
  delivered: "Entregue",
  canceled: "Cancelado",
  refunded: "Reembolsado",
};

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  await requireAdmin();
  const supabase = createServiceClient();

  let query = supabase
    .from("orders")
    .select(
      "id, order_number, buyer_name, buyer_email, buyer_phone, buyer_document, buyer_company_name, buyer_state_registration, shipping_address, status, payment_method, total_cents, tracking_code, created_at, order_items(id, title_snapshot, quantity, unit_price_cents, total_cents, protheus_code_snapshot, str_code_snapshot, stf_code_snapshot)"
    )
    .order("created_at", { ascending: false })
    .limit(100);

  if (searchParams.status) {
    query = query.eq("status", searchParams.status as OrderStatus);
  }

  const { data: orders } = await query;

  return (
    <div className="p-6 md:p-8 max-w-6xl">
      <div className="mb-6">
        <div className="text-label-bold text-[var(--text-muted)] mb-1">OPERAÇÃO</div>
        <h1 className="font-display text-3xl font-bold uppercase">Pedidos</h1>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        <FilterChip href="/admin/pedidos" label="Todos" active={!searchParams.status} />
        {Object.entries(STATUS_LABEL).map(([value, label]) => (
          <FilterChip
            key={value}
            href={`/admin/pedidos?status=${value}`}
            label={label}
            active={searchParams.status === value}
          />
        ))}
      </div>

      <AdminOrdersManager
        orders={(orders ?? []).map((o) => ({
          ...o,
          total_label: formatCentsBRL(o.total_cents),
          status_label: STATUS_LABEL[o.status] ?? o.status,
        }))}
      />
    </div>
  );
}

function FilterChip({
  href,
  label,
  active,
}: {
  href: string;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={`rounded-md px-3 py-1.5 text-xs font-bold uppercase tracking-wider ${
        active
          ? "bg-primary text-white"
          : "border border-[var(--line)] bg-white text-[var(--ink-soft)] hover:border-primary"
      }`}
    >
      {label}
    </Link>
  );
}
