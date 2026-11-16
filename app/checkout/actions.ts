"use server";

import { headers } from "next/headers";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/auth";
import { CreateOrderSchema, type CreateOrderInput } from "@/lib/checkout/schema";
import { createPayment, isMockPaymentsEnabled } from "@/lib/payments/provider";
import { toCentsFromBRL } from "@/lib/cart/types";
import type { Database, OrderStatus, PaymentMethod } from "@/lib/supabase/types";

type ShippingRule = Database["public"]["Tables"]["shipping_rules"]["Row"];

/** Cliente exclusivo service_role — único caminho permitido para gravar orders/order_items. */
function serviceDb() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ?? "";
  const usable =
    key.length > 20 &&
    !key.includes("COLE_AQUI") &&
    !key.includes("placeholder");
  if (!usable) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY não configurada — necessária para checkout seguro (LGPD)."
    );
  }
  return createServiceClient();
}

export async function getShippingRulesAction(
  uf: string
): Promise<{ ok: true; rules: ShippingRule[] } | { ok: false; error: string }> {
  const state = uf.trim().toUpperCase();
  if (state.length !== 2) {
    return { ok: false, error: "UF inválida" };
  }

  const supabase = createClient();
  const { data, error } = await supabase
    .from("shipping_rules")
    .select("*")
    .eq("active", true)
    .or(`uf.eq.${state},uf.eq.ALL`)
    .order("price_cents", { ascending: true });

  if (error) return { ok: false, error: error.message };
  return { ok: true, rules: (data ?? []) as ShippingRule[] };
}

export type CreateOrderResult =
  | {
      ok: true;
      orderId: string;
      orderNumber: string;
      accessToken: string;
      payment: {
        method: PaymentMethod;
        status: string;
        provider: string;
        pixCopyPaste?: string | null;
        boletoDigitableLine?: string | null;
        boletoUrl?: string | null;
        mock: boolean;
      };
    }
  | { ok: false; error: string };

export async function createOrderAction(
  raw: CreateOrderInput
): Promise<CreateOrderResult> {
  try {
    const parsed = CreateOrderSchema.parse(raw);

    if (parsed.payment_method === "credit_card") {
      const num = (parsed.card_number ?? "").replace(/\D/g, "");
      if (num.length < 13 || !(parsed.card_holder ?? "").trim() || !(parsed.card_cvv ?? "").trim()) {
        return { ok: false, error: "Dados do cartão incompletos" };
      }
    }

    let supabase;
    try {
      supabase = serviceDb();
    } catch (err) {
      return {
        ok: false,
        error: err instanceof Error ? err.message : "Checkout indisponível",
      };
    }
    const user = await getCurrentUser();
    const h = headers();
    const ip =
      h.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      h.get("x-real-ip") ??
      null;

    // 1) Recalcular itens no servidor
    const listingIds = Array.from(
      new Set(parsed.items.map((i) => i.listingId))
    );
    const { data: listings, error: listingsErr } = await supabase
      .from("listings")
      .select("id, title, price, has_fixed_price, status, vendor_id, slug")
      .in("id", listingIds)
      .eq("status", "active");

    if (listingsErr || !listings?.length) {
      return { ok: false, error: "Não foi possível validar os produtos do carrinho" };
    }

    const listingMap = new Map(listings.map((l) => [l.id, l]));
    const vendorIds = new Set(listings.map((l) => l.vendor_id));
    if (vendorIds.size !== 1) {
      return { ok: false, error: "O pedido deve conter itens de um único vendedor" };
    }
    const vendorId = listings[0].vendor_id;

    const variantIds = parsed.items
      .map((i) => i.variantId)
      .filter((v): v is string => Boolean(v));

    const variantMap = new Map<
      string,
      {
        id: string;
        listing_id: string;
        price_cents: number;
        active: boolean;
        structure_color: string | null;
        upholstery_color: string | null;
        sku: string | null;
        stock_qty: number;
        str_code: string | null;
        stf_code: string | null;
        protheus_code: string | null;
        is_made_to_order: boolean;
        production_days: number;
      }
    >();

    if (variantIds.length) {
      const { data: variants, error: vErr } = await supabase
        .from("listing_variants")
        .select(
          "id, listing_id, price_cents, active, structure_color, upholstery_color, sku, stock_qty, str_code, stf_code, protheus_code, is_made_to_order, production_days"
        )
        .in("id", variantIds)
        .eq("active", true);

      if (vErr) return { ok: false, error: vErr.message };
      for (const v of variants ?? []) variantMap.set(v.id, v);
    }

    const lineItems: Array<{
      listing_id: string;
      variant_id: string | null;
      title_snapshot: string;
      variant_snapshot: unknown;
      protheus_code_snapshot: string | null;
      str_code_snapshot: string | null;
      stf_code_snapshot: string | null;
      unit_price_cents: number;
      quantity: number;
      total_cents: number;
    }> = [];

    let subtotalCents = 0;

    for (const item of parsed.items) {
      const listing = listingMap.get(item.listingId);
      if (!listing) {
        return { ok: false, error: "Um dos produtos não está mais disponível" };
      }

      let unitPriceCents = 0;
      let variantSnapshot: unknown = null;
      let protheus: string | null = null;
      let strCode: string | null = null;
      let stfCode: string | null = null;

      if (item.variantId) {
        const variant = variantMap.get(item.variantId);
        if (!variant || variant.listing_id !== listing.id) {
          return { ok: false, error: "Variante inválida no carrinho" };
        }
        if (
          !variant.is_made_to_order &&
          variant.stock_qty < item.quantity
        ) {
          return { ok: false, error: `Estoque insuficiente para ${listing.title}` };
        }
        unitPriceCents = variant.price_cents;
        variantSnapshot = {
          structure_color: variant.structure_color,
          upholstery_color: variant.upholstery_color,
          sku: variant.sku,
          str_code: variant.str_code,
          stf_code: variant.stf_code,
          protheus_code: variant.protheus_code,
          is_made_to_order: variant.is_made_to_order,
          production_days: variant.production_days,
        };
        protheus = variant.protheus_code;
        strCode = variant.str_code;
        stfCode = variant.stf_code;
      } else {
        if (!listing.has_fixed_price || listing.price == null) {
          return {
            ok: false,
            error: `O produto "${listing.title}" não tem preço fixo para compra online`,
          };
        }
        unitPriceCents = toCentsFromBRL(Number(listing.price));
      }

      const total = unitPriceCents * item.quantity;
      subtotalCents += total;
      lineItems.push({
        listing_id: listing.id,
        variant_id: item.variantId ?? null,
        title_snapshot: listing.title,
        variant_snapshot: variantSnapshot,
        protheus_code_snapshot: protheus,
        str_code_snapshot: strCode,
        stf_code_snapshot: stfCode,
        unit_price_cents: unitPriceCents,
        quantity: item.quantity,
        total_cents: total,
      });
    }

    // 2) Frete — preço real no banco
    const { data: shippingRule, error: shipErr } = await supabase
      .from("shipping_rules")
      .select("*")
      .eq("id", parsed.shipping_rule_id)
      .eq("active", true)
      .maybeSingle();

    if (shipErr || !shippingRule) {
      return { ok: false, error: "Opção de frete inválida" };
    }

    const uf = parsed.shipping_address.state;
    if (shippingRule.uf !== "ALL" && shippingRule.uf !== uf) {
      return { ok: false, error: "Frete incompatível com a UF informada" };
    }

    const shippingCents = shippingRule.price_cents;
    const discountCents = 0;
    const totalCents = subtotalCents + shippingCents - discountCents;

    if (totalCents <= 0) {
      return { ok: false, error: "Total do pedido inválido" };
    }

    const acceptedAt = new Date().toISOString();
    const docDigits = parsed.buyer_document;
    const isCnpj = docDigits.length === 14;
    const companyName = isCnpj ? parsed.buyer_company_name?.trim() || null : null;
    const stateReg = isCnpj
      ? parsed.ie_isento
        ? "ISENTO"
        : parsed.buyer_state_registration?.trim() || null
      : null;

    // 3) Inserir pedido — service_role only (anon sem INSERT desde 0014)
    const { data: order, error: orderErr } = await supabase
      .from("orders")
      .insert({
        buyer_id: user?.id ?? null,
        vendor_id: vendorId,
        buyer_name: parsed.buyer_name,
        buyer_email: parsed.buyer_email,
        buyer_phone: parsed.buyer_phone,
        buyer_document: parsed.buyer_document,
        buyer_company_name: companyName,
        buyer_state_registration: stateReg,
        shipping_address: parsed.shipping_address,
        subtotal_cents: subtotalCents,
        shipping_cents: shippingCents,
        discount_cents: discountCents,
        total_cents: totalCents,
        status: "pending_payment" satisfies OrderStatus,
        payment_method: parsed.payment_method,
        payment_provider: isMockPaymentsEnabled() ? "mock" : "asaas",
        opt_in: true,
        accepted_terms_at: acceptedAt,
        ip_address: ip,
      })
      .select("id, order_number, access_token")
      .single();

    if (orderErr || !order) {
      return {
        ok: false,
        error: orderErr?.message ?? "Falha ao criar pedido",
      };
    }

    const { error: itemsErr } = await supabase.from("order_items").insert(
      lineItems.map((li) => ({
        order_id: order.id,
        ...li,
      }))
    );

    if (itemsErr) {
      await supabase.rpc("attach_order_payment", {
        p_order_id: order.id,
        p_status: "canceled",
        p_payment_payload: { error: itemsErr.message },
      });
      return { ok: false, error: `Falha ao gravar itens: ${itemsErr.message}` };
    }

    // 4) Pagamento
    let payment;
    try {
      payment = await createPayment({
        orderId: order.id,
        orderNumber: order.order_number,
        totalCents,
        method: parsed.payment_method,
        customer: {
          name: parsed.buyer_name,
          email: parsed.buyer_email,
          phone: parsed.buyer_phone,
          document: parsed.buyer_document,
        },
        card:
          parsed.payment_method === "credit_card"
            ? {
                holderName: parsed.card_holder ?? parsed.buyer_name,
                number: parsed.card_number ?? "",
                expiry: parsed.card_expiry ?? "",
                cvv: parsed.card_cvv ?? "",
              }
            : null,
      });
    } catch (err) {
      await supabase.rpc("attach_order_payment", {
        p_order_id: order.id,
        p_status: "canceled",
        p_payment_payload: {
          error: err instanceof Error ? err.message : "payment_error",
        },
      });
      return {
        ok: false,
        error:
          err instanceof Error
            ? err.message
            : "Falha ao iniciar pagamento",
      };
    }

    const nextStatus: OrderStatus =
      payment.status === "paid" ? "paid" : "pending_payment";

    await supabase.rpc("attach_order_payment", {
      p_order_id: order.id,
      p_status: nextStatus,
      p_external_payment_id: payment.externalPaymentId,
      p_payment_provider: payment.provider,
      p_payment_payload: {
        ...((payment.raw as object) ?? {}),
        pixCopyPaste: payment.pixCopyPaste ?? null,
        pixQrCode: payment.pixQrCode ?? null,
        boletoDigitableLine: payment.boletoDigitableLine ?? null,
        boletoUrl: payment.boletoUrl ?? null,
      },
    });

    return {
      ok: true,
      orderId: order.id,
      orderNumber: order.order_number,
      accessToken: order.access_token,
      payment: {
        method: parsed.payment_method,
        status: payment.status,
        provider: payment.provider,
        pixCopyPaste: payment.pixCopyPaste,
        boletoDigitableLine: payment.boletoDigitableLine,
        boletoUrl: payment.boletoUrl,
        mock: payment.provider === "mock",
      },
    };
  } catch (err) {
    if (err && typeof err === "object" && "issues" in err) {
      const zodErr = err as { issues: Array<{ message: string }> };
      return { ok: false, error: zodErr.issues[0]?.message ?? "Dados inválidos" };
    }
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Erro ao criar pedido",
    };
  }
}
