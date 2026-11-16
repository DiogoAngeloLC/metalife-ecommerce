"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { adminServiceDb } from "@/lib/admin/service-db";
import {
  OFFICIAL_VENDOR_ID,
  ensureUniqueSlug,
  slugifyTitle,
  syncListingPriceFromVariants,
} from "@/lib/admin/catalog";
import type { ListingStatus } from "@/lib/supabase/types";

function revalidateCatalog(listingId?: string, slug?: string) {
  revalidatePath("/admin/anuncios");
  revalidatePath("/admin");
  revalidatePath("/");
  revalidatePath("/catalogo");
  if (listingId) revalidatePath(`/admin/anuncios/${listingId}`);
  if (slug) revalidatePath(`/${slug}`);
}

export type ProductInput = {
  title: string;
  slug?: string;
  equipment_type: string;
  description?: string;
  status: "active" | "draft";
  price_reais?: number | null;
  brand?: string | null;
};

export async function createProductAction(
  input: ProductInput
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const { supabase } = await adminServiceDb();
  const title = input.title.trim();
  if (title.length < 3) return { ok: false, error: "Nome muito curto" };

  const baseSlug = slugifyTitle(input.slug?.trim() || title);
  const slug = await ensureUniqueSlug(supabase, baseSlug);
  const id = randomUUID();
  const price =
    input.price_reais != null && Number.isFinite(input.price_reais)
      ? input.price_reais
      : null;

  const { error } = await supabase.from("listings").insert({
    id,
    vendor_id: OFFICIAL_VENDOR_ID,
    slug,
    title: title.slice(0, 120),
    description: input.description?.trim() || null,
    equipment_type: input.equipment_type.trim() || "acessorios",
    brand: input.brand?.trim() || "Metalife",
    condition: "novo",
    has_fixed_price: price != null,
    price,
    is_negotiable: false,
    city: "São Paulo",
    state: "SP",
    status: input.status,
    published_at: input.status === "active" ? new Date().toISOString() : null,
  });

  if (error) return { ok: false, error: error.message };
  revalidateCatalog(id, slug);
  return { ok: true, id };
}

export async function updateProductAction(
  listingId: string,
  input: ProductInput
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { supabase } = await adminServiceDb();
  const title = input.title.trim();
  if (title.length < 3) return { ok: false, error: "Nome muito curto" };

  const baseSlug = slugifyTitle(input.slug?.trim() || title);
  const slug = await ensureUniqueSlug(supabase, baseSlug, listingId);
  const price =
    input.price_reais != null && Number.isFinite(input.price_reais)
      ? input.price_reais
      : null;

  const { data: current } = await supabase
    .from("listings")
    .select("status, published_at")
    .eq("id", listingId)
    .single();

  const becomingActive = input.status === "active";
  const { error } = await supabase
    .from("listings")
    .update({
      title: title.slice(0, 120),
      slug,
      description: input.description?.trim() || null,
      equipment_type: input.equipment_type.trim() || "acessorios",
      brand: input.brand?.trim() || "Metalife",
      status: input.status,
      has_fixed_price: price != null,
      price,
      is_negotiable: false,
      published_at: becomingActive
        ? current?.published_at ?? new Date().toISOString()
        : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", listingId);

  if (error) return { ok: false, error: error.message };

  await syncListingPriceFromVariants(supabase, listingId);
  revalidateCatalog(listingId, slug);
  return { ok: true };
}

export async function toggleProductStatusAction(
  listingId: string,
  next: "active" | "draft"
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { supabase } = await adminServiceDb();
  const { data: listing } = await supabase
    .from("listings")
    .select("slug")
    .eq("id", listingId)
    .single();

  const { error } = await supabase
    .from("listings")
    .update({
      status: next as ListingStatus,
      published_at: next === "active" ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", listingId);

  if (error) return { ok: false, error: error.message };
  revalidateCatalog(listingId, listing?.slug);
  return { ok: true };
}

export async function duplicateProductAction(
  listingId: string
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const { supabase } = await adminServiceDb();

  const { data: source, error: sErr } = await supabase
    .from("listings")
    .select("*")
    .eq("id", listingId)
    .single();
  if (sErr || !source) return { ok: false, error: sErr?.message ?? "Produto não encontrado" };

  const { data: variants } = await supabase
    .from("listing_variants")
    .select("*")
    .eq("listing_id", listingId);

  const newId = randomUUID();
  const title = `${source.title} (Cópia)`.slice(0, 120);
  const slug = await ensureUniqueSlug(supabase, slugifyTitle(title));

  const { error: iErr } = await supabase.from("listings").insert({
    id: newId,
    vendor_id: OFFICIAL_VENDOR_ID,
    slug,
    title,
    description: source.description,
    equipment_type: source.equipment_type,
    brand: source.brand,
    year: source.year,
    condition: source.condition,
    has_fixed_price: source.has_fixed_price,
    price: source.price,
    is_negotiable: source.is_negotiable,
    city: source.city,
    state: source.state,
    status: "draft",
    published_at: null,
    is_featured: false,
  });
  if (iErr) return { ok: false, error: iErr.message };

  if (variants && variants.length > 0) {
    const rows = variants.map((v) => ({
      listing_id: newId,
      sku: v.sku ? `${v.sku}-COPY` : null,
      structure_color: v.structure_color,
      upholstery_color: v.upholstery_color,
      str_code: v.str_code,
      stf_code: v.stf_code,
      protheus_code: v.protheus_code,
      price_cents: v.price_cents,
      stock_qty: v.stock_qty,
      is_made_to_order: v.is_made_to_order,
      production_days: v.production_days,
      active: v.active,
    }));
    const { error: vErr } = await supabase.from("listing_variants").insert(rows);
    if (vErr) return { ok: false, error: vErr.message };
  }

  revalidateCatalog(newId);
  return { ok: true, id: newId };
}

export async function deleteProductAction(
  listingId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { supabase } = await adminServiceDb();

  const { count: orderItemCount, error: orderErr } = await supabase
    .from("order_items")
    .select("*", { count: "exact", head: true })
    .eq("listing_id", listingId);

  if (orderErr) return { ok: false, error: orderErr.message };
  if ((orderItemCount ?? 0) > 0) {
    return {
      ok: false,
      error:
        "Este produto possui pedidos vinculados e não pode ser excluído. Desative-o (status Rascunho) para preservar o histórico fiscal.",
    };
  }

  const { data: images } = await supabase
    .from("listing_images")
    .select("storage_path")
    .eq("listing_id", listingId);

  const { data: listing } = await supabase
    .from("listings")
    .select("slug")
    .eq("id", listingId)
    .single();

  const { error } = await supabase.from("listings").delete().eq("id", listingId);
  if (error) return { ok: false, error: error.message };

  const paths = (images ?? []).map((i) => i.storage_path).filter(Boolean);
  if (paths.length > 0) {
    await supabase.storage.from("listing-images").remove(paths);
  }

  revalidateCatalog(undefined, listing?.slug);
  return { ok: true };
}

export async function uploadProductImagesAction(
  listingId: string,
  formData: FormData
): Promise<{ ok: true; paths: string[] } | { ok: false; error: string }> {
  const { supabase } = await adminServiceDb();

  const { data: listing } = await supabase
    .from("listings")
    .select("slug")
    .eq("id", listingId)
    .single();
  if (!listing) return { ok: false, error: "Produto não encontrado" };

  const { data: existing } = await supabase
    .from("listing_images")
    .select("position")
    .eq("listing_id", listingId)
    .order("position", { ascending: false })
    .limit(1);

  let nextPos = (existing?.[0]?.position ?? -1) + 1;
  const files = formData.getAll("files").filter((f): f is File => f instanceof File);
  if (files.length === 0) return { ok: false, error: "Nenhum arquivo enviado" };

  const paths: string[] = [];
  for (const file of files) {
    const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
    const allowed = ["jpg", "jpeg", "png", "webp"];
    if (!allowed.includes(ext)) {
      return { ok: false, error: `Formato não suportado: ${ext}` };
    }
    const storagePath = `${listing.slug}-${Date.now()}-${nextPos}.${ext === "jpeg" ? "jpg" : ext}`;
    const buf = Buffer.from(await file.arrayBuffer());
    const { error: upErr } = await supabase.storage
      .from("listing-images")
      .upload(storagePath, buf, {
        contentType: file.type || `image/${ext}`,
        upsert: true,
      });
    if (upErr) return { ok: false, error: upErr.message };

    const { error: dbErr } = await supabase.from("listing_images").insert({
      listing_id: listingId,
      storage_path: storagePath,
      position: nextPos,
    });
    if (dbErr) return { ok: false, error: dbErr.message };

    paths.push(storagePath);
    nextPos++;
  }

  revalidateCatalog(listingId, listing.slug);
  return { ok: true, paths };
}

export async function setCoverImageAction(
  listingId: string,
  imageId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { supabase } = await adminServiceDb();

  const { data: images } = await supabase
    .from("listing_images")
    .select("id, position")
    .eq("listing_id", listingId)
    .order("position", { ascending: true });

  if (!images?.length) return { ok: false, error: "Sem imagens" };
  const cover = images.find((i) => i.id === imageId);
  if (!cover) return { ok: false, error: "Imagem não encontrada" };

  const reordered = [cover, ...images.filter((i) => i.id !== imageId)];
  for (let i = 0; i < reordered.length; i++) {
    const { error } = await supabase
      .from("listing_images")
      .update({ position: i })
      .eq("id", reordered[i].id);
    if (error) return { ok: false, error: error.message };
  }

  revalidateCatalog(listingId);
  return { ok: true };
}

export async function moveImageAction(
  listingId: string,
  imageId: string,
  direction: "left" | "right"
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { supabase } = await adminServiceDb();
  const { data: images } = await supabase
    .from("listing_images")
    .select("id, position")
    .eq("listing_id", listingId)
    .order("position", { ascending: true });

  if (!images?.length) return { ok: false, error: "Sem imagens" };
  const idx = images.findIndex((i) => i.id === imageId);
  if (idx < 0) return { ok: false, error: "Imagem não encontrada" };
  const swapWith = direction === "left" ? idx - 1 : idx + 1;
  if (swapWith < 0 || swapWith >= images.length) return { ok: true };

  const a = images[idx];
  const b = images[swapWith];
  const { error: e1 } = await supabase
    .from("listing_images")
    .update({ position: b.position })
    .eq("id", a.id);
  const { error: e2 } = await supabase
    .from("listing_images")
    .update({ position: a.position })
    .eq("id", b.id);
  if (e1 || e2) return { ok: false, error: e1?.message ?? e2?.message ?? "Erro" };

  revalidateCatalog(listingId);
  return { ok: true };
}

export async function deleteImageAction(
  listingId: string,
  imageId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { supabase } = await adminServiceDb();
  const { data: img } = await supabase
    .from("listing_images")
    .select("id, storage_path")
    .eq("id", imageId)
    .eq("listing_id", listingId)
    .single();
  if (!img) return { ok: false, error: "Imagem não encontrada" };

  const { error } = await supabase.from("listing_images").delete().eq("id", imageId);
  if (error) return { ok: false, error: error.message };

  await supabase.storage.from("listing-images").remove([img.storage_path]);
  revalidateCatalog(listingId);
  return { ok: true };
}
