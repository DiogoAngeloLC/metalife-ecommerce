"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/supabase/auth";

async function uploadAsset(file: File, prefix: string): Promise<string | null> {
  if (!file?.size) return null;
  const supabase = createClient();
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "png";
  const safeExt = ["jpg", "jpeg", "png", "webp"].includes(ext) ? ext : "png";
  const path = `${prefix}/${Date.now()}.${safeExt}`;
  const { error } = await supabase.storage.from("site-assets").upload(path, file);
  if (error) return null;
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/site-assets/${path}`;
}

export async function updateBrandAction(formData: FormData) {
  const user = await requireAdmin();
  const supabase = createClient();

  const name = String(formData.get("name") ?? "").trim();
  const tagline = String(formData.get("tagline") ?? "").trim();
  if (!name) throw new Error("Nome é obrigatório.");

  const { data: current } = await supabase.from("site_settings").select("value").eq("key", "brand").single();
  const currentBrand = (current?.value ?? {}) as Record<string, unknown>;

  const logoFile = formData.get("logo") as File | null;
  const logoDarkFile = formData.get("logo_dark") as File | null;
  const faviconFile = formData.get("favicon") as File | null;
  const ogFile = formData.get("og_image") as File | null;

  const updates: Record<string, unknown> = { name, tagline };

  if (formData.get("remove_logo") === "1" || formData.get("remove_logo") === "on") updates.logo_url = null;
  if (formData.get("remove_logo_dark") === "1" || formData.get("remove_logo_dark") === "on") updates.logo_dark_url = null;
  if (formData.get("remove_favicon") === "1" || formData.get("remove_favicon") === "on") updates.favicon_url = null;
  if (formData.get("remove_og_image") === "1" || formData.get("remove_og_image") === "on") updates.og_image_url = null;

  if (logoFile && typeof logoFile === "object" && "size" in logoFile && logoFile.size > 0) {
    const url = await uploadAsset(logoFile, "brand/logo");
    if (url) updates.logo_url = url;
  }
  if (logoDarkFile && typeof logoDarkFile === "object" && "size" in logoDarkFile && logoDarkFile.size > 0) {
    const url = await uploadAsset(logoDarkFile, "brand/logo-dark");
    if (url) updates.logo_dark_url = url;
  }
  if (faviconFile && typeof faviconFile === "object" && "size" in faviconFile && faviconFile.size > 0) {
    const url = await uploadAsset(faviconFile, "brand/favicon");
    if (url) updates.favicon_url = url;
  }
  if (ogFile && typeof ogFile === "object" && "size" in ogFile && ogFile.size > 0) {
    const url = await uploadAsset(ogFile, "brand/og");
    if (url) updates.og_image_url = url;
  }

  const { error } = await supabase.from("site_settings").upsert(
    {
      key: "brand",
      value: { ...currentBrand, ...updates },
      updated_at: new Date().toISOString(),
      updated_by: user.id,
    },
    { onConflict: "key" }
  );
  if (error) throw new Error(error.message);

  revalidatePath("/", "layout");
  revalidatePath("/admin/identidade");
}
