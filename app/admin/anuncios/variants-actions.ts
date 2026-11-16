"use server";

import { revalidatePath } from "next/cache";
import { adminServiceDb } from "@/lib/admin/service-db";
import { syncListingPriceFromVariants } from "@/lib/admin/catalog";
import type { Database } from "@/lib/supabase/types";

type VariantRow = Database["public"]["Tables"]["listing_variants"]["Row"];
type VariantInput = {
  structure_color: string | null;
  upholstery_color: string | null;
  sku: string | null;
  str_code: string | null;
  stf_code: string | null;
  protheus_code: string | null;
  price_cents: number;
  stock_qty: number;
  is_made_to_order: boolean;
  production_days: number;
  active: boolean;
};

export async function createVariantAction(
  listingId: string,
  input: VariantInput
): Promise<{ ok: true; variant: VariantRow } | { ok: false; error: string }> {
  const { supabase } = await adminServiceDb();

  const { data, error } = await supabase
    .from("listing_variants")
    .insert({
      listing_id: listingId,
      ...input,
    })
    .select("*")
    .single();

  if (error || !data) return { ok: false, error: error?.message ?? "Falha ao criar" };

  await syncListingPriceFromVariants(supabase, listingId);
  revalidatePath(`/admin/anuncios/${listingId}`);
  revalidatePath("/admin/anuncios");
  revalidatePath("/");
  revalidatePath("/catalogo");
  return { ok: true, variant: data };
}

export async function updateVariantAction(
  variantId: string,
  input: VariantInput
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { supabase } = await adminServiceDb();

  const { data: existing } = await supabase
    .from("listing_variants")
    .select("listing_id")
    .eq("id", variantId)
    .single();

  const { error } = await supabase
    .from("listing_variants")
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq("id", variantId);

  if (error) return { ok: false, error: error.message };

  if (existing?.listing_id) {
    await syncListingPriceFromVariants(supabase, existing.listing_id);
    revalidatePath(`/admin/anuncios/${existing.listing_id}`);
  }
  revalidatePath("/admin/anuncios");
  revalidatePath("/");
  revalidatePath("/catalogo");
  return { ok: true };
}

export async function deleteVariantAction(
  variantId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { supabase } = await adminServiceDb();

  const { data: existing } = await supabase
    .from("listing_variants")
    .select("listing_id")
    .eq("id", variantId)
    .single();

  const { error } = await supabase
    .from("listing_variants")
    .delete()
    .eq("id", variantId);

  if (error) return { ok: false, error: error.message };

  if (existing?.listing_id) {
    await syncListingPriceFromVariants(supabase, existing.listing_id);
    revalidatePath(`/admin/anuncios/${existing.listing_id}`);
  }
  revalidatePath("/admin/anuncios");
  revalidatePath("/");
  revalidatePath("/catalogo");
  return { ok: true };
}

export async function duplicateVariantAction(
  variantId: string
): Promise<{ ok: true; variant: VariantRow } | { ok: false; error: string }> {
  const { supabase } = await adminServiceDb();
  const { data: source, error } = await supabase
    .from("listing_variants")
    .select("*")
    .eq("id", variantId)
    .single();
  if (error || !source) return { ok: false, error: error?.message ?? "Variante não encontrada" };

  const { data, error: iErr } = await supabase
    .from("listing_variants")
    .insert({
      listing_id: source.listing_id,
      sku: source.sku ? `${source.sku}-COPY` : null,
      structure_color: source.structure_color,
      upholstery_color: source.upholstery_color,
      str_code: source.str_code,
      stf_code: source.stf_code,
      protheus_code: source.protheus_code,
      price_cents: source.price_cents,
      stock_qty: source.stock_qty,
      is_made_to_order: source.is_made_to_order,
      production_days: source.production_days,
      active: source.active,
    })
    .select("*")
    .single();

  if (iErr || !data) return { ok: false, error: iErr?.message ?? "Falha ao duplicar" };
  await syncListingPriceFromVariants(supabase, source.listing_id);
  revalidatePath(`/admin/anuncios/${source.listing_id}`);
  return { ok: true, variant: data };
}

export async function bulkUpdateVariantsAction(
  listingId: string,
  input: { price_cents?: number | null; production_days?: number | null }
): Promise<{ ok: true; updated: number } | { ok: false; error: string }> {
  const { supabase } = await adminServiceDb();
  const patch: Database["public"]["Tables"]["listing_variants"]["Update"] = {
    updated_at: new Date().toISOString(),
  };
  if (input.price_cents != null && input.price_cents >= 0) {
    patch.price_cents = input.price_cents;
  }
  if (input.production_days != null && input.production_days >= 0) {
    patch.production_days = input.production_days;
  }
  if (patch.price_cents == null && patch.production_days == null) {
    return { ok: false, error: "Informe preço e/ou prazo para aplicar em lote" };
  }

  const { data, error } = await supabase
    .from("listing_variants")
    .update(patch)
    .eq("listing_id", listingId)
    .select("id");

  if (error) return { ok: false, error: error.message };
  await syncListingPriceFromVariants(supabase, listingId);
  revalidatePath(`/admin/anuncios/${listingId}`);
  revalidatePath("/admin/anuncios");
  revalidatePath("/");
  revalidatePath("/catalogo");
  return { ok: true, updated: data?.length ?? 0 };
}

function parseCsvLine(line: string): string[] {
  const cells: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (ch === ";" && !inQuotes) {
      cells.push(cur.trim());
      cur = "";
      continue;
    }
    cur += ch;
  }
  cells.push(cur.trim());
  return cells;
}

function reaisToCents(raw: string): number | null {
  const normalized = raw.replace(/\s/g, "").replace(/\./g, "").replace(",", ".").trim();
  if (!normalized) return null;
  const n = Number(normalized);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n * 100);
}

export type ImportVariantsResult =
  | {
      ok: true;
      inserted: number;
      updated: number;
      skipped: number;
      errors: string[];
      variants: VariantRow[];
    }
  | { ok: false; error: string };

/**
 * CSV `;` com cabeçalho:
 * sku;structure_color;upholstery_color;str_code;stf_code;protheus_code;price_reais;production_days
 * Upsert por (listing_id, sku).
 */
export async function importVariantsCsvAction(
  listingId: string,
  csvText: string
): Promise<ImportVariantsResult> {
  const { supabase } = await adminServiceDb();

  const text = csvText.replace(/^\uFEFF/, "").trim();
  if (!text) return { ok: false, error: "Arquivo CSV vazio" };

  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) {
    return { ok: false, error: "CSV precisa de cabeçalho e ao menos 1 linha de dados" };
  }

  const header = parseCsvLine(lines[0]).map((h) => h.toLowerCase());
  const required = [
    "sku",
    "structure_color",
    "upholstery_color",
    "str_code",
    "stf_code",
    "protheus_code",
    "price_reais",
    "production_days",
  ];
  const idx: Record<string, number> = {};
  for (const col of required) {
    const i = header.indexOf(col);
    if (i < 0) {
      return {
        ok: false,
        error: `Coluna obrigatória ausente: ${col}. Use: ${required.join(";")}`,
      };
    }
    idx[col] = i;
  }

  let inserted = 0;
  let updated = 0;
  let skipped = 0;
  const errors: string[] = [];
  const variants: VariantRow[] = [];

  for (let rowNum = 2; rowNum <= lines.length; rowNum++) {
    const cells = parseCsvLine(lines[rowNum - 1]);
    const sku = (cells[idx.sku] ?? "").trim();
    if (!sku) {
      skipped++;
      errors.push(`Linha ${rowNum}: SKU obrigatório para upsert`);
      continue;
    }

    const priceCents = reaisToCents(cells[idx.price_reais] ?? "");
    if (priceCents == null || priceCents <= 0) {
      skipped++;
      errors.push(`Linha ${rowNum}: price_reais inválido`);
      continue;
    }

    const productionDays = Math.max(
      0,
      parseInt((cells[idx.production_days] ?? "15").replace(/\D/g, "") || "15", 10)
    );

    const payload = {
      listing_id: listingId,
      sku,
      structure_color: (cells[idx.structure_color] ?? "").trim() || null,
      upholstery_color: (cells[idx.upholstery_color] ?? "").trim() || null,
      str_code: (cells[idx.str_code] ?? "").trim() || null,
      stf_code: (cells[idx.stf_code] ?? "").trim() || null,
      protheus_code: (cells[idx.protheus_code] ?? "").trim() || null,
      price_cents: priceCents,
      production_days: productionDays,
      is_made_to_order: true,
      stock_qty: 0,
      active: true,
      updated_at: new Date().toISOString(),
    };

    const { data: existing } = await supabase
      .from("listing_variants")
      .select("id")
      .eq("listing_id", listingId)
      .eq("sku", sku)
      .maybeSingle();

    if (existing?.id) {
      const { data, error } = await supabase
        .from("listing_variants")
        .update(payload)
        .eq("id", existing.id)
        .select("*")
        .single();
      if (error || !data) {
        skipped++;
        errors.push(`Linha ${rowNum}: ${error?.message ?? "falha ao atualizar"}`);
        continue;
      }
      updated++;
      variants.push(data);
    } else {
      const { data, error } = await supabase
        .from("listing_variants")
        .insert(payload)
        .select("*")
        .single();
      if (error || !data) {
        skipped++;
        errors.push(`Linha ${rowNum}: ${error?.message ?? "falha ao inserir"}`);
        continue;
      }
      inserted++;
      variants.push(data);
    }
  }

  await syncListingPriceFromVariants(supabase, listingId);
  revalidatePath(`/admin/anuncios/${listingId}`);
  revalidatePath("/admin/anuncios");
  revalidatePath("/");
  revalidatePath("/catalogo");

  return { ok: true, inserted, updated, skipped, errors, variants };
}
