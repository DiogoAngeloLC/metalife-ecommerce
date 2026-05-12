"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { generateSlug, normalizeFreeText } from "@/lib/slug";
import { CreateListingSchema, type CreateListingInput } from "@/lib/validations";

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
    status: "active",
    published_at: new Date().toISOString(),
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
