import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/supabase/auth";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { formatCentsBRL } from "@/lib/format";
import { getBrand } from "@/lib/site-config";
import type { ShippingAddress } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const brand = await getBrand();
  return { title: `Meus pedidos · ${brand.name}` };
}

const STATUS_LABEL: Record<string, string> = {
  pending_payment: "Aguardando pagamento",
  paid: "Pago",
  preparing: "Em preparação",
  shipped: "Enviado",
  delivered: "Entregue",
  canceled: "Cancelado",
  refunded: "Reembolsado",
};

function db() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ?? "";
  const usable =
    key.length > 20 &&
    !key.includes("COLE_AQUI") &&
    !key.includes("placeholder");
  return usable ? createServiceClient() : createClient();
}

export default async function MyOrdersPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/minha-conta/pedidos");

  const supabase = db();
  const { data: orders } = await supabase
    .from("orders")
    .select(
      "id, order_number, status, total_cents, payment_method, tracking_code, created_at, shipping_address, order_items(title_snapshot, quantity)"
    )
    .eq("buyer_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-8">
        <div className="text-label-bold text-primary mb-2">MINHA CONTA</div>
        <h1 className="font-display text-3xl font-bold uppercase">Meus pedidos</h1>
      </div>

      {!orders?.length ? (
        <div className="rounded-md border border-[var(--line)] bg-white p-10 text-center">
          <p className="text-[var(--text-muted)] mb-4">Você ainda não fez pedidos.</p>
          <Link
            href="/catalogo"
            className="inline-flex rounded-md bg-primary px-5 py-3 text-sm font-bold uppercase tracking-wider text-white"
          >
            Ir ao catálogo
          </Link>
        </div>
      ) : (
        <ul className="space-y-4">
          {orders.map((order) => {
            const addr = order.shipping_address as ShippingAddress | null;
            return (
              <li
                key={order.id}
                className="rounded-md border border-[var(--line)] bg-white p-5 space-y-3"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <Link
                      href={`/checkout/pedido/${order.order_number}`}
                      className="font-display text-xl font-bold uppercase text-primary hover:underline"
                    >
                      {order.order_number}
                    </Link>
                    <p className="text-xs text-[var(--text-muted)]">
                      {new Date(order.created_at).toLocaleString("pt-BR")}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-bold uppercase text-[var(--ink-soft)]">
                      {STATUS_LABEL[order.status] ?? order.status}
                    </div>
                    <div className="font-bold text-primary">
                      {formatCentsBRL(order.total_cents)}
                    </div>
                  </div>
                </div>

                <ul className="text-sm text-[var(--ink-soft)]">
                  {(
                    order.order_items as Array<{
                      title_snapshot: string;
                      quantity: number;
                    }> | null
                  )?.map((item, idx) => (
                    <li key={`${order.id}-${idx}`}>
                      {item.quantity}× {item.title_snapshot}
                    </li>
                  ))}
                </ul>

                {order.tracking_code && (
                  <p className="text-sm">
                    Rastreio:{" "}
                    <strong className="font-mono">{order.tracking_code}</strong>
                  </p>
                )}

                {addr && (
                  <p className="text-xs text-[var(--text-muted)]">
                    Entrega: {addr.city}/{addr.state}
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
