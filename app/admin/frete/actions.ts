"use server";

import { revalidatePath } from "next/cache";
import { adminServiceDb } from "@/lib/admin/service-db";

export type ShippingRuleInput = {
  uf: string;
  name: string;
  price_cents: number;
  estimated_days: number | null;
  active: boolean;
};

export async function createShippingRuleAction(
  input: ShippingRuleInput
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { supabase } = await adminServiceDb();
  const uf = input.uf.trim().toUpperCase();
  if (!(uf.length === 2 || uf === "ALL")) {
    return { ok: false, error: "UF deve ter 2 letras ou ALL" };
  }
  if (!input.name.trim()) return { ok: false, error: "Nome obrigatório" };
  if (input.price_cents < 0) return { ok: false, error: "Valor inválido" };

  const { error } = await supabase.from("shipping_rules").insert({
    uf,
    name: input.name.trim(),
    price_cents: input.price_cents,
    estimated_days: input.estimated_days,
    active: input.active,
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/frete");
  revalidatePath("/checkout");
  return { ok: true };
}

export async function updateShippingRuleAction(
  id: string,
  input: ShippingRuleInput
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { supabase } = await adminServiceDb();
  const uf = input.uf.trim().toUpperCase();
  if (!(uf.length === 2 || uf === "ALL")) {
    return { ok: false, error: "UF deve ter 2 letras ou ALL" };
  }

  const { error } = await supabase
    .from("shipping_rules")
    .update({
      uf,
      name: input.name.trim(),
      price_cents: input.price_cents,
      estimated_days: input.estimated_days,
      active: input.active,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/frete");
  revalidatePath("/checkout");
  return { ok: true };
}

export async function toggleShippingRuleAction(
  id: string,
  active: boolean
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { supabase } = await adminServiceDb();
  const { error } = await supabase
    .from("shipping_rules")
    .update({ active, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/frete");
  revalidatePath("/checkout");
  return { ok: true };
}

export async function deleteShippingRuleAction(
  id: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { supabase } = await adminServiceDb();
  const { error } = await supabase.from("shipping_rules").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/frete");
  revalidatePath("/checkout");
  return { ok: true };
}
