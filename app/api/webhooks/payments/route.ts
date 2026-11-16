import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import {
  getWebhookToken,
  normalizePaymentWebhook,
} from "@/lib/payments/provider";
import type { OrderStatus } from "@/lib/supabase/types";

export const runtime = "nodejs";

function authorize(req: Request): boolean {
  const expected =
    getWebhookToken() ||
    process.env.NEXT_PUBLIC_ASAAS_WEBHOOK_TOKEN ||
    "dev-webhook-token";

  const headerToken =
    req.headers.get("asaas-access-token") ||
    req.headers.get("x-webhook-token") ||
    req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");

  return Boolean(headerToken && headerToken === expected);
}

export async function POST(req: Request) {
  if (!authorize(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const normalized = normalizePaymentWebhook(body);
  if (!normalized) {
    return NextResponse.json({ error: "Unrecognized payload" }, { status: 400 });
  }

  if (normalized.status === "ignored") {
    return NextResponse.json({ ok: true, ignored: true });
  }

  const supabase = createServiceClient();
  const { data: order, error } = await supabase
    .from("orders")
    .select("id, status, external_payment_id, payment_payload")
    .eq("external_payment_id", normalized.externalPaymentId)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  // Idempotência: já está no status alvo
  const target: OrderStatus =
    normalized.status === "paid" ? "paid" : "canceled";

  if (order.status === target) {
    return NextResponse.json({
      ok: true,
      idempotent: true,
      orderId: order.id,
      status: order.status,
    });
  }

  // Não reabrir pedido já pago/cancelado para outro estado conflitante
  if (
    (order.status === "paid" || order.status === "canceled" || order.status === "refunded") &&
    order.status !== target
  ) {
    return NextResponse.json({
      ok: true,
      idempotent: true,
      skipped: true,
      orderId: order.id,
      status: order.status,
    });
  }

  const prevPayload =
    order.payment_payload && typeof order.payment_payload === "object"
      ? (order.payment_payload as Record<string, unknown>)
      : {};

  const { error: updateErr } = await supabase
    .from("orders")
    .update({
      status: target,
      payment_payload: {
        ...prevPayload,
        last_webhook_event: normalized.rawEvent,
        last_webhook_at: new Date().toISOString(),
      },
    })
    .eq("id", order.id)
    .eq("external_payment_id", normalized.externalPaymentId);

  if (updateErr) {
    return NextResponse.json({ error: updateErr.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    orderId: order.id,
    status: target,
  });
}
