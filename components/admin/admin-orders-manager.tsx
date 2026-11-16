"use client";

import { useState, useTransition } from "react";
import {
  updateOrderStatusAction,
  updateOrderTrackingAction,
} from "@/app/admin/pedidos/actions";
import {
  downloadProtheusCsv,
  type ProtheusExportOrder,
} from "@/lib/protheus-csv";
import type { OrderStatus, ShippingAddress } from "@/lib/supabase/types";
import { formatCentsBRL } from "@/lib/format";

type OrderRow = {
  id: string;
  order_number: string;
  buyer_name: string;
  buyer_email: string;
  buyer_phone: string;
  buyer_document: string;
  buyer_company_name: string | null;
  buyer_state_registration: string | null;
  shipping_address: ShippingAddress | null;
  status: string;
  status_label: string;
  payment_method: string | null;
  total_cents: number;
  total_label: string;
  tracking_code: string | null;
  created_at: string;
  order_items: Array<{
    id: string;
    title_snapshot: string;
    quantity: number;
    unit_price_cents: number;
    total_cents: number;
    protheus_code_snapshot: string | null;
    str_code_snapshot: string | null;
    stf_code_snapshot: string | null;
  }> | null;
};

export function AdminOrdersManager({ orders }: { orders: OrderRow[] }) {
  if (!orders.length) {
    return (
      <div className="rounded-md border border-[var(--line)] bg-white p-10 text-center text-sm text-[var(--text-muted)]">
        Nenhum pedido encontrado.
      </div>
    );
  }

  const handleExport = () => {
    const payload: ProtheusExportOrder[] = orders.map((o) => ({
      order_number: o.order_number,
      created_at: o.created_at,
      status: o.status,
      buyer_name: o.buyer_name,
      buyer_email: o.buyer_email,
      buyer_phone: o.buyer_phone,
      buyer_document: o.buyer_document,
      buyer_company_name: o.buyer_company_name,
      buyer_state_registration: o.buyer_state_registration,
      shipping_address: o.shipping_address,
      payment_method: o.payment_method,
      total_cents: o.total_cents,
      order_items: o.order_items,
    }));
    const stamp = new Date().toISOString().slice(0, 10);
    downloadProtheusCsv(payload, `protheus-pedidos-${stamp}.csv`);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleExport}
          className="rounded-md border border-[var(--line)] bg-white px-4 py-2 text-xs font-bold uppercase tracking-wider hover:border-primary"
        >
          Exportar CSV para Faturamento (Protheus)
        </button>
      </div>
      {orders.map((order) => (
        <OrderCard key={order.id} order={order} />
      ))}
    </div>
  );
}

function OrderCard({ order }: { order: OrderRow }) {
  const [tracking, setTracking] = useState(order.tracking_code ?? "");
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const addr = order.shipping_address;

  const saveTracking = () => {
    setMsg(null);
    startTransition(async () => {
      const r = await updateOrderTrackingAction(order.id, tracking);
      setMsg(r.ok ? "Rastreio salvo." : r.error);
    });
  };

  const setStatus = (status: OrderStatus) => {
    setMsg(null);
    startTransition(async () => {
      const r = await updateOrderStatusAction(order.id, status);
      setMsg(r.ok ? "Status atualizado." : r.error);
    });
  };

  return (
    <article className="rounded-md border border-[var(--line)] bg-white p-5 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="font-display text-xl font-bold uppercase">
            {order.order_number}
          </div>
          <div className="text-xs text-[var(--text-muted)]">
            {new Date(order.created_at).toLocaleString("pt-BR")} ·{" "}
            {order.payment_method?.toUpperCase() ?? "—"}
          </div>
        </div>
        <div className="text-right">
          <div className="rounded-md bg-primary-100 px-2 py-1 text-xs font-bold uppercase text-primary">
            {order.status_label}
          </div>
          <div className="mt-1 font-display text-lg font-bold text-[var(--ink)]">
            {order.total_label}
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 text-sm">
        <div>
          <div className="text-label-bold text-[var(--text-muted)] mb-1">Comprador</div>
          <p className="font-semibold">{order.buyer_name}</p>
          {order.buyer_company_name && (
            <p>
              <span className="text-[var(--text-muted)]">Razão Social:</span>{" "}
              {order.buyer_company_name}
            </p>
          )}
          {order.buyer_state_registration && (
            <p>
              <span className="text-[var(--text-muted)]">IE:</span>{" "}
              {order.buyer_state_registration}
            </p>
          )}
          <p>{order.buyer_email}</p>
          <p>{order.buyer_phone}</p>
          <p className="font-mono text-xs">{order.buyer_document}</p>
        </div>
        <div>
          <div className="text-label-bold text-[var(--text-muted)] mb-1">Entrega</div>
          {addr ? (
            <p>
              {addr.street}, {addr.number}
              {addr.complement ? ` — ${addr.complement}` : ""}
              <br />
              {addr.neighborhood} · {addr.city}/{addr.state}
              <br />
              CEP {addr.cep}
            </p>
          ) : (
            <p className="text-[var(--text-muted)]">—</p>
          )}
        </div>
      </div>

      <div>
        <div className="text-label-bold text-[var(--text-muted)] mb-1">Itens</div>
        <ul className="text-sm space-y-2">
          {(order.order_items ?? []).map((item) => (
            <li key={item.id} className="border-b border-[var(--line)] pb-2 last:border-0">
              <div>
                {item.quantity}× {item.title_snapshot}{" "}
                <span className="text-[var(--text-muted)]">
                  ({formatCentsBRL(item.total_cents)})
                </span>
              </div>
              {(item.protheus_code_snapshot ||
                item.str_code_snapshot ||
                item.stf_code_snapshot) && (
                <div className="mt-0.5 font-mono text-xs text-[var(--text-muted)]">
                  {item.protheus_code_snapshot
                    ? `Protheus: ${item.protheus_code_snapshot}`
                    : ""}
                  {item.str_code_snapshot
                    ? ` · STR: ${item.str_code_snapshot}`
                    : ""}
                  {item.stf_code_snapshot
                    ? ` · STF: ${item.stf_code_snapshot}`
                    : ""}
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>

      <div className="flex flex-wrap items-end gap-3 border-t border-[var(--line)] pt-4">
        <div className="flex-1 min-w-[200px]">
          <label className="text-label-bold text-[var(--text-muted)] block mb-1">
            Código de rastreio
          </label>
          <input
            className="w-full rounded-md border border-[var(--line)] px-3 py-2 text-sm outline-none focus:border-primary"
            value={tracking}
            onChange={(e) => setTracking(e.target.value)}
            placeholder="BR123456789BR"
          />
        </div>
        <button
          type="button"
          disabled={pending}
          onClick={saveTracking}
          className="rounded-md bg-primary px-4 py-2 text-xs font-bold uppercase tracking-wider text-white disabled:opacity-50"
        >
          Salvar rastreio
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => setStatus("preparing")}
          className="rounded-md border border-[var(--line)] px-4 py-2 text-xs font-bold uppercase tracking-wider"
        >
          Preparando
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => setStatus("delivered")}
          className="rounded-md border border-[var(--line)] px-4 py-2 text-xs font-bold uppercase tracking-wider"
        >
          Entregue
        </button>
      </div>
      {msg && <p className="text-xs text-[var(--ink-soft)]">{msg}</p>}
    </article>
  );
}
