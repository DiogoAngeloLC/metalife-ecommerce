"use server";

import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/supabase/auth";

export async function createBannerAction(formData: FormData) {
  const user = await requireAdmin();
  const supabase = createServiceClient();

  const file = formData.get("image") as File;
  if (!file || file.size === 0) throw new Error("Imagem obrigatória");

  const path = `banners/${Date.now()}-${file.name}`;
  const { error: uploadError } = await supabase.storage
    .from("site-assets")
    .upload(path, file, { upsert: true });
  if (uploadError) throw new Error(uploadError.message);

  const imageUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/site-assets/${path}`;

  const { error } = await supabase.from("ad_banners").insert({
    slot_key: formData.get("slot_key") as string,
    image_url: imageUrl,
    link_url: (formData.get("link_url") as string) || null,
    alt_text: (formData.get("alt_text") as string) || "Banner",
    sort_order: Number(formData.get("sort_order")) || 0,
    created_by: user.id,
  });

  if (error) throw new Error(error.message);

  revalidatePath("/admin/banners");
  revalidatePath("/catalogo");
}

export async function toggleBannerAction(id: string, active: boolean) {
  await requireAdmin();
  const supabase = createServiceClient();

  const { error } = await supabase
    .from("ad_banners")
    .update({ active })
    .eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePath("/admin/banners");
  revalidatePath("/catalogo");
}

export async function deleteBannerAction(id: string) {
  await requireAdmin();
  const supabase = createServiceClient();

  const { error } = await supabase
    .from("ad_banners")
    .delete()
    .eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePath("/admin/banners");
  revalidatePath("/catalogo");
}
