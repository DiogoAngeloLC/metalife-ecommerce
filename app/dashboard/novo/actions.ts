"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { generateSlug, normalizeFreeText } from "@/lib/slug";
import {
  CreateListingSchema,
  UpdateListingSchema,
  type CreateListingInput,
  type UpdateListingInput,
} from "@/lib/validations";
import { isListingEditableByVendor, canVendorWithdrawListingToDraft } from "@/lib/listings";

export async function createListingAction(
  input: CreateListingInput
): Promise<{ slug: string }> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Não autenticado");

  const parsed = CreateListingSchema.parse(input);
  const slug = generateSlug(parsed.title);

  const { error: insertErr } = await supabase.from("listings").insert({
    id: parsed.id,
    vendor_id: user.id,
    slug,
    title: parsed.title,
    description: parsed.description || null,
    equipment_type: normalizeFreeText(parsed.equipment_type),
    brand: parsed.brand ? normalizeFreeText(parsed.brand) : null,
    year: parsed.year ?? null,
    condition: parsed.condition,
    has_fixed_price: parsed.has_fixed_price,
    price: parsed.has_fixed_price ? parsed.price ?? null : null,
    is_negotiable: parsed.is_negotiable,
    city: parsed.city,
    state: parsed.state,
    status: "pending_review",
    published_at: null,
  });

  if (insertErr) throw new Error(`Falha ao criar anúncio: ${insertErr.message}`);

  if (parsed.imagePaths.length > 0) {
    const { error: imgErr } = await supabase.from("listing_images").insert(
      parsed.imagePaths.map((path, i) => ({
        listing_id: parsed.id,
        storage_path: path,
        position: i,
      }))
    );
    if (imgErr) {
      // listing já foi criado; logar mas não falhar
      console.error("Erro ao salvar imagens:", imgErr);
    }
  }

  revalidatePath("/");
  revalidatePath("/dashboard");

  return { slug };
}

export async function updateListingAction(
  input: UpdateListingInput
): Promise<{ slug: string }> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Não autenticado");

  const parsed = UpdateListingSchema.parse(input);

  const { data: existing, error: fetchErr } = await supabase
    .from("listings")
    .select("id, vendor_id, title, slug, status")
    .eq("id", parsed.listing_id)
    .single();

  if (fetchErr || !existing) {
    throw new Error("Anúncio não encontrado.");
  }
  if (existing.vendor_id !== user.id) {
    throw new Error("Você não pode editar este anúncio.");
  }
  if (!isListingEditableByVendor(existing.status)) {
    throw new Error("Este anúncio não pode ser editado.");
  }

  const titleChanged = existing.title.trim() !== parsed.title.trim();
  const slug = titleChanged ? generateSlug(parsed.title) : existing.slug;

  const { error: updateErr } = await supabase
    .from("listings")
    .update({
      slug,
      title: parsed.title,
      description: parsed.description || null,
      equipment_type: normalizeFreeText(parsed.equipment_type),
      brand: parsed.brand ? normalizeFreeText(parsed.brand) : null,
      year: parsed.year ?? null,
      condition: parsed.condition,
      has_fixed_price: parsed.has_fixed_price,
      price: parsed.has_fixed_price ? parsed.price ?? null : null,
      is_negotiable: parsed.is_negotiable,
      city: parsed.city,
      state: parsed.state,
      status: "pending_review",
      published_at: null,
      reviewed_at: null,
      reviewed_by: null,
      rejection_reason: null,
    })
    .eq("id", parsed.listing_id)
    .eq("vendor_id", user.id);

  if (updateErr) throw new Error(`Falha ao atualizar: ${updateErr.message}`);

  const { error: delImgErr } = await supabase
    .from("listing_images")
    .delete()
    .eq("listing_id", parsed.listing_id);

  if (delImgErr) {
    console.error("Erro ao limpar imagens:", delImgErr);
  }

  if (parsed.imagePaths.length > 0) {
    const { error: imgErr } = await supabase.from("listing_images").insert(
      parsed.imagePaths.map((path, i) => ({
        listing_id: parsed.listing_id,
        storage_path: path,
        position: i,
      }))
    );
    if (imgErr) {
      console.error("Erro ao salvar imagens:", imgErr);
    }
  }

  revalidatePath("/");
  revalidatePath("/dashboard");
  revalidatePath("/catalogo");
  const oldSlug = existing.slug;
  revalidatePath(`/${oldSlug}`);
  if (slug !== oldSlug) {
    revalidatePath(`/${slug}`);
  }

  return { slug };
}

export async function withdrawListingToDraftAction(listingId: string): Promise<void> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Não autenticado");

  const { data: existing, error: fetchErr } = await supabase
    .from("listings")
    .select("id, vendor_id, status, slug")
    .eq("id", listingId)
    .single();

  if (fetchErr || !existing) {
    throw new Error("Anúncio não encontrado.");
  }
  if (existing.vendor_id !== user.id) {
    throw new Error("Você não pode alterar este anúncio.");
  }
  if (!canVendorWithdrawListingToDraft(existing.status)) {
    throw new Error("Este anúncio não pode ser guardado como rascunho.");
  }

  const { error: updateErr } = await supabase
    .from("listings")
    .update({
      status: "draft",
      published_at: null,
      reviewed_at: null,
      reviewed_by: null,
      rejection_reason: null,
      is_featured: false,
    })
    .eq("id", listingId)
    .eq("vendor_id", user.id);

  if (updateErr) throw new Error(`Falha ao atualizar: ${updateErr.message}`);

  revalidatePath("/");
  revalidatePath("/dashboard");
  revalidatePath("/catalogo");
  revalidatePath(`/${existing.slug}`);
}
