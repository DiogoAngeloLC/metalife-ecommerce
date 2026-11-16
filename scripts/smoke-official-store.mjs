#!/usr/bin/env node
/**
 * Smoke test Loja Oficial Metalife (homologação):
 * listing + variante STR/STF sob encomenda → pedido B2B → pagamento mock → CSV Protheus → cleanup.
 *
 * Requer SUPABASE_SERVICE_ROLE_KEY + NEXT_PUBLIC_SUPABASE_URL no ambiente (.env.local).
 * Uso: node --env-file=.env.local scripts/smoke-official-store.mjs
 */
import { createClient } from "@supabase/supabase-js";
import { writeFileSync } from "node:fs";
import { randomUUID } from "node:crypto";

const OFFICIAL_VENDOR_ID = "a1111111-1111-4111-8111-111111111111";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

if (!url || !key || key.includes("COLE_AQUI") || key.length < 20) {
  console.error(
    "Defina NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY válidas (service_role)."
  );
  process.exit(1);
}

const sb = createClient(url, key, { auth: { persistSession: false } });

function cell(v) {
  const raw = v == null ? "" : String(v);
  const escaped = raw.replace(/"/g, '""');
  return /[;"\n\r]/.test(escaped) ? `"${escaped}"` : escaped;
}

function centsToDecimal(cents) {
  return (cents / 100).toFixed(2).replace(".", ",");
}

function buildCsv(order, item) {
  const headers = [
    "pedido",
    "documento",
    "razao_social",
    "inscricao_estadual",
    "produto",
    "protheus_code",
    "str_code",
    "stf_code",
    "quantidade",
    "total_item",
    "total_pedido",
  ];
  const addr = order.shipping_address ?? {};
  void addr;
  const line = [
    order.order_number,
    order.buyer_document,
    order.buyer_company_name,
    order.buyer_state_registration,
    item.title_snapshot,
    item.protheus_code_snapshot,
    item.str_code_snapshot,
    item.stf_code_snapshot,
    item.quantity,
    centsToDecimal(item.total_cents),
    centsToDecimal(order.total_cents),
  ]
    .map(cell)
    .join(";");
  return `\uFEFF${headers.join(";")}\r\n${line}\r\n`;
}

async function main() {
  const listingId = randomUUID();
  const variantId = randomUUID();
  const slug = `smoke-reformer-${Date.now()}`;
  let orderId = null;

  console.log("1) Verificando vendor oficial…");
  const { data: vendor, error: vErr } = await sb
    .from("vendors")
    .select("id, name, is_official")
    .eq("id", OFFICIAL_VENDOR_ID)
    .single();
  if (vErr || !vendor?.is_official) {
    throw new Error(`Vendor oficial ausente: ${vErr?.message ?? "not found"}`);
  }
  console.log("   OK", vendor.name);

  console.log("2) Criando produto + variante STR/STF (estoque 0, sob encomenda)…");
  const { error: lErr } = await sb.from("listings").insert({
    id: listingId,
    vendor_id: OFFICIAL_VENDOR_ID,
    slug,
    title: "SMOKE Reformer Metalife STR/STF",
    description: "Produto temporário do smoke test — pode excluir.",
    equipment_type: "Reformer",
    brand: "Metalife",
    condition: "novo",
    has_fixed_price: true,
    price: 18900,
    is_negotiable: false,
    city: "São Paulo",
    state: "SP",
    status: "active",
    published_at: new Date().toISOString(),
  });
  if (lErr) throw new Error(`listing: ${lErr.message}`);

  const { data: variant, error: varErr } = await sb
    .from("listing_variants")
    .insert({
      id: variantId,
      listing_id: listingId,
      sku: "SMOKE-STR-STF",
      structure_color: "Preto fosco",
      upholstery_color: "Cinza grafite",
      str_code: "STR-SMOKE-01",
      stf_code: "STF-SMOKE-01",
      protheus_code: "PRT-SMOKE-001",
      price_cents: 1890000,
      stock_qty: 0,
      is_made_to_order: true,
      production_days: 15,
      active: true,
    })
    .select("*")
    .single();
  if (varErr) throw new Error(`variant: ${varErr.message}`);
  console.log("   OK variante", variant.id, "stock=0 made_to_order=", variant.is_made_to_order);

  const { data: shipping } = await sb
    .from("shipping_rules")
    .select("id, price_cents")
    .eq("active", true)
    .limit(1)
    .maybeSingle();

  const shippingCents = shipping?.price_cents ?? 0;
  const unit = 1890000;
  const qty = 1;
  const total = unit * qty + shippingCents;

  console.log("3) Criando pedido B2B (CNPJ + Razão Social + IE)…");
  const { data: order, error: oErr } = await sb
    .from("orders")
    .insert({
      vendor_id: OFFICIAL_VENDOR_ID,
      buyer_name: "Smoke Test Comprador",
      buyer_email: "smoke@metalife.pilates",
      buyer_phone: "11999990000",
      buyer_document: "11222333000181",
      buyer_company_name: "Studio Smoke Test LTDA",
      buyer_state_registration: "ISENTO",
      shipping_address: {
        cep: "01310100",
        street: "Av. Paulista",
        number: "1000",
        complement: "Sala Smoke",
        neighborhood: "Bela Vista",
        city: "São Paulo",
        state: "SP",
      },
      subtotal_cents: unit * qty,
      shipping_cents: shippingCents,
      discount_cents: 0,
      total_cents: total,
      status: "pending_payment",
      payment_method: "pix",
      payment_provider: "mock",
      opt_in: true,
      accepted_terms_at: new Date().toISOString(),
      ip_address: "127.0.0.1",
    })
    .select("id, order_number, buyer_document, buyer_company_name, buyer_state_registration, total_cents, shipping_address")
    .single();
  if (oErr) throw new Error(`order: ${oErr.message}`);
  orderId = order.id;

  const { error: iErr } = await sb.from("order_items").insert({
    order_id: order.id,
    listing_id: listingId,
    variant_id: variantId,
    title_snapshot: "SMOKE Reformer Metalife STR/STF",
    variant_snapshot: {
      structure_color: "Preto fosco",
      upholstery_color: "Cinza grafite",
      is_made_to_order: true,
      production_days: 15,
    },
    protheus_code_snapshot: "PRT-SMOKE-001",
    str_code_snapshot: "STR-SMOKE-01",
    stf_code_snapshot: "STF-SMOKE-01",
    unit_price_cents: unit,
    quantity: qty,
    total_cents: unit * qty,
  });
  if (iErr) throw new Error(`order_items: ${iErr.message}`);
  console.log("   OK pedido", order.order_number);

  console.log("4) Simulando pagamento (mock paid)…");
  const { error: payErr } = await sb
    .from("orders")
    .update({
      status: "paid",
      external_payment_id: `mock_smoke_${order.order_number}`,
      payment_payload: { mock: true, simulated_at: new Date().toISOString() },
    })
    .eq("id", order.id);
  if (payErr) throw new Error(`payment: ${payErr.message}`);
  console.log("   OK status=paid");

  console.log("5) Export CSV Protheus…");
  const { data: item } = await sb
    .from("order_items")
    .select(
      "title_snapshot, quantity, total_cents, protheus_code_snapshot, str_code_snapshot, stf_code_snapshot"
    )
    .eq("order_id", order.id)
    .single();
  const csv = buildCsv(order, item);
  const out = `/tmp/protheus-smoke-${order.order_number}.csv`;
  writeFileSync(out, csv, "utf8");
  console.log("   OK", out);
  console.log(csv.slice(0, 200).replace(/\r/g, "\\r"));

  console.log("6) Validando RPC get_order_confirmation (token LGPD)…");
  const { data: orderAuth, error: tokenErr } = await sb
    .from("orders")
    .select("order_number, access_token")
    .eq("id", order.id)
    .single();
  if (tokenErr || !orderAuth?.access_token) {
    throw new Error(`access_token: ${tokenErr?.message ?? "ausente"}`);
  }

  // Cliente anon — simula a página pública de confirmação
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!anonKey) throw new Error("NEXT_PUBLIC_SUPABASE_ANON_KEY ausente");
  const anon = createClient(url, anonKey, { auth: { persistSession: false } });

  const { data: withToken, error: withErr } = await anon.rpc("get_order_confirmation", {
    p_order_number: orderAuth.order_number,
    p_access_token: orderAuth.access_token,
  });
  if (withErr) throw new Error(`RPC com token: ${withErr.message}`);
  if (!withToken) throw new Error("RPC com token retornou vazio");
  console.log("   OK com token — pedido", orderAuth.order_number);

  const { data: withoutToken, error: withoutErr } = await anon.rpc(
    "get_order_confirmation",
    {
      p_order_number: orderAuth.order_number,
      p_access_token: null,
    }
  );
  // Sem token a RPC deve negar acesso (null / erro) — a página trata como 404
  if (withoutToken) {
    throw new Error("RPC sem token NÃO deveria retornar dados do pedido");
  }
  console.log(
    "   OK sem token — acesso negado",
    withoutErr ? `(${withoutErr.message})` : "(null)"
  );

  const site = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(
    /\/$/,
    ""
  );
  try {
    const okPage = await fetch(
      `${site}/checkout/pedido/${orderAuth.order_number}?token=${orderAuth.access_token}`,
      { redirect: "manual" }
    );
    const badPage = await fetch(`${site}/checkout/pedido/${orderAuth.order_number}`, {
      redirect: "manual",
    });
    console.log(`   HTTP com token: ${okPage.status}`);
    console.log(`   HTTP sem token: ${badPage.status}`);
    if (okPage.status !== 200) {
      throw new Error(`página com token deveria ser 200, veio ${okPage.status}`);
    }
    if (badPage.status !== 404) {
      throw new Error(`página sem token deveria ser 404, veio ${badPage.status}`);
    }
  } catch (err) {
    if (String(err.message || err).includes("deveria")) throw err;
    console.warn("   AVISO: não foi possível validar HTTP local:", err.message || err);
  }

  console.log("7) Cleanup…");
  await sb.from("order_items").delete().eq("order_id", order.id);
  await sb.from("orders").delete().eq("id", order.id);
  await sb.from("listing_variants").delete().eq("id", variantId);
  await sb.from("listings").delete().eq("id", listingId);
  console.log("   OK limpeza concluída");
  console.log("\nSMOKE PASS");
}

main().catch(async (err) => {
  console.error("\nSMOKE FAIL:", err.message ?? err);
  process.exit(1);
});
