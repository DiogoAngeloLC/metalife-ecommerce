"use server";

import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/supabase/auth";

export async function updateHeroAction(formData: FormData) {
  const user = await requireAdmin();
  const supabase = createServiceClient();

  let imageUrl: string | null = null;
  const file = formData.get("image") as File | null;
  if (file && file.size > 0) {
    const path = `hero/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage
      .from("site-assets")
      .upload(path, file, { upsert: true });
    if (!error) {
      imageUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/site-assets/${path}`;
    }
  }

  const { data: current } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", "hero")
    .single();

  const currentValue = (current?.value ?? {}) as Record<string, unknown>;
  const newValue = {
    ...currentValue,
    eyebrow: formData.get("eyebrow") as string,
    title: formData.get("title") as string,
    subtitle: formData.get("subtitle") as string,
    ...(imageUrl ? { image_url: imageUrl } : {}),
  };

  await supabase
    .from("site_settings")
    .upsert({
      key: "hero",
      value: newValue,
      updated_at: new Date().toISOString(),
      updated_by: user.id,
    });

  revalidatePath("/");
  revalidatePath("/admin/aparencia");
}
