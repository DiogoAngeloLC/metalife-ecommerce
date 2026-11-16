import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatCentsBRL } from "@/lib/format";
import { getBrand } from "@/lib/site-config";
import { MockPayButton } from "@/components/checkout/mock-pay-button";
import type { OrderStatus, PaymentMethod, ShippingAddress } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

type Props = {
  params: { order_number: string };
  searchParams: { token?: string };
};

type OrderConfirmation = {
  order: {
    id: string;
    order_number: string;
    status: OrderStatus;
    payment_method: PaymentMethod | null;
    payment_provider: string | null;
    external_payment_id: string | null;
    total_cents: number;
    payment_payload: {
      pixCopyPaste?: string | null;
      boletoDigitableLine?: string | null;
      boletoUrl?: string | null;
    } | null;
    shipping_address: ShippingAddress;
    buyer_id?: string | null;
  };
  items: Array<{
    id: string;
    title_snapshot: string;
    quantity: number;
    total_cents: number;
  }>;
};

function parseAccessToken(raw: string | undefined): string | null {
  if (!raw?.trim()) return null;
  const token = raw.trim();
  // uuid v4-ish
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      token
    )
  ) {
    return null;
  }
  return token;
}

export async function generateMetadata({ params }: Props) {
  const brand = await getBrand();
  return { title: `Pedido ${params.order_number} · ${brand.name}` };
}

export default async function OrderConfirmationPage({
  params,
  searchParams,
}: Props) {
  const accessToken = parseAccessToken(searchParams.token);
  const supabase = createClient();

  // Sem token: ainda pode funcionar se o usuário for o buyer autenticado ou admin (RPC checa auth.uid)
  const { data, error } = await supabase.rpc("get_order_confirmation", {
    p_order_number: params.order_number,
    p_access_token: accessToken,
  });

  if (error || !data) notFound();

  const payload = data as OrderConfirmation;
  const order = payload.order;
  if (!order?.order_number) notFound();

  const pay = order.payment_payload ?? {};

  const statusLabel: Record<string, string> = {
    pending_payment: "Aguardando pagamento",
    paid: "Pago",
    preparing: "Em preparação",
    shipped: "Enviado",
    delivered: "Entregue",
    canceled: "Cancelado",
    refunded: "Reembolsado",
  };

  const pix = pay.pixCopyPaste;
  const qrUrl = pix
    ? `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(pix)}`
    : null;

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 md:py-14">
      <div className="text-label-bold text-primary mb-2">PEDIDO CONFIRMADO</div>
      <h1 className="font-display text-3xl font-bold uppercase text-[var(--ink)] mb-2">
        {order.order_number}
      </h1>
      <p className="text-sm text-[var(--text-muted)] mb-8">
        Status:{" "}
        <strong className="text-[var(--ink)]">
          {statusLabel[order.status] ?? order.status}
        </strong>
      </p>

      <div className="rounded-md border border-[var(--line)] bg-white p-6 space-y-4 mb-6">
        <div className="flex justify-between text-sm">
          <span className="text-[var(--text-muted)]">Total</span>
          <span className="font-display text-2xl font-bold text-primary">
            {formatCentsBRL(order.total_cents)}
          </span>
        </div>
        <div className="text-sm text-[var(--ink-soft)]">
          Pagamento:{" "}
          <strong className="uppercase">{order.payment_method ?? "—"}</strong>
          {order.payment_provider === "mock" && (
            <span className="ml-2 rounded bg-[var(--warning-bg)] px-2 py-0.5 text-xs text-[var(--warning)]">
              MOCK
            </span>
          )}
        </div>

        {order.payment_method === "pix" &&
          order.status === "pending_payment" &&
          pix && (
            <div className="space-y-3 border-t border-[var(--line)] pt-4">
              <p className="text-sm font-semibold">Pague com Pix</p>
              {qrUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={qrUrl}
                  alt="QR Code Pix"
                  className="mx-auto h-[220px] w-[220px] border border-[var(--line)]"
                />
              )}
              <div>
                <p className="text-xs text-[var(--text-muted)] mb-1">Copia e cola</p>
                <textarea
                  readOnly
                  className="w-full rounded-md border border-[var(--line)] bg-[var(--bg-section)] p-3 text-xs font-mono"
                  rows={4}
                  value={pix}
                />
              </div>
            </div>
          )}

        {order.payment_method === "boleto" &&
          order.status === "pending_payment" && (
            <div className="space-y-2 border-t border-[var(--line)] pt-4">
              <p className="text-sm font-semibold">Boleto bancário</p>
              {pay.boletoDigitableLine && (
                <p className="rounded-md bg-[var(--bg-section)] p-3 font-mono text-xs break-all">
                  {pay.boletoDigitableLine}
                </p>
              )}
              {pay.boletoUrl && (
                <a
                  href={pay.boletoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex text-sm text-primary underline"
                >
                  Abrir boleto
                </a>
              )}
            </div>
          )}

        {order.payment_method === "credit_card" && (
          <p className="text-sm text-[var(--ink-soft)] border-t border-[var(--line)] pt-4">
            {order.status === "paid"
              ? "Pagamento no cartão aprovado."
              : "Aguardando confirmação do cartão."}
          </p>
        )}

        {order.payment_provider === "mock" &&
          order.status === "pending_payment" && (
            <MockPayButton
              orderNumber={order.order_number}
              externalPaymentId={order.external_payment_id}
            />
          )}
      </div>

      <div className="rounded-md border border-[var(--line)] bg-white p-6 mb-8">
        <h2 className="font-display text-base font-bold uppercase mb-3">Itens</h2>
        <ul className="space-y-2 text-sm">
          {(payload.items ?? []).map((item) => (
            <li key={item.id} className="flex justify-between gap-3">
              <span>
                {item.quantity}× {item.title_snapshot}
              </span>
              <span className="font-semibold">
                {formatCentsBRL(item.total_cents)}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex flex-wrap gap-3">
        <Link
          href="/minha-conta/pedidos"
          className="rounded-md bg-primary px-5 py-3 text-sm font-bold uppercase tracking-wider text-white"
        >
          Meus pedidos
        </Link>
        <Link
          href="/catalogo"
          className="rounded-md border border-[var(--line)] px-5 py-3 text-sm font-bold uppercase tracking-wider text-[var(--ink)]"
        >
          Continuar comprando
        </Link>
      </div>
    </div>
  );
}
