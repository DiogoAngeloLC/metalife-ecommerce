"use server";

import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/supabase/auth";

export async function updateLegalPageAction(slug: string, title: string, contentMd: string) {
  const user = await requireAdmin();
  const supabase = createServiceClient();

  const { error } = await supabase
    .from("legal_pages")
    .update({
      title,
      content_md: contentMd,
      updated_at: new Date().toISOString(),
      updated_by: user.id,
    })
    .eq("slug", slug);

  if (error) throw new Error(error.message);

  revalidatePath(`/${slug}`);
  revalidatePath("/admin/paginas");
}
