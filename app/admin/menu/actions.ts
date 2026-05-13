"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/supabase/auth";
import type { MenuItem } from "@/lib/site-config";

export async function updateMenuAction(items: MenuItem[]) {
  const user = await requireAdmin();

  if (items.length > 8) throw new Error("Máximo 8 itens no menu");

  for (const item of items) {
    if (!item.label.trim()) throw new Error("Label é obrigatório");
    const href = item.href.trim();
    if (href.startsWith("/")) {
      // ok
    } else if (href.startsWith("https://")) {
      // ok
    } else if (href.startsWith("http://")) {
      throw new Error(`URL em "${item.label}": use https:// em links externos.`);
    } else {
      throw new Error(`URL inválida em "${item.label}": deve começar com / ou https://`);
    }
    if (item.external && !href.startsWith("https://")) {
      throw new Error(`Link externo em "${item.label}" deve usar https://`);
    }
  }

  const supabase = createClient();
  const { error } = await supabase.from("site_settings").upsert(
    {
      key: "menu",
      value: { items },
      updated_at: new Date().toISOString(),
      updated_by: user.id,
    },
    { onConflict: "key" }
  );
  if (error) throw new Error(error.message);

  revalidatePath("/", "layout");
}
