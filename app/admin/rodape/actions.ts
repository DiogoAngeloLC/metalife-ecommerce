"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/supabase/auth";
import type { FooterConfig } from "@/lib/site-config";

export async function updateFooterAction(config: FooterConfig) {
  const user = await requireAdmin();

  if (config.columns.length > 4) throw new Error("Máximo 4 colunas");
  if (config.columns.length < 1) throw new Error("Mínimo 1 coluna");

  for (const col of config.columns) {
    if (col.links.length > 8) throw new Error(`Máximo 8 links em "${col.title}"`);
    for (const link of col.links) {
      if (!link.label.trim() || !link.href.trim()) {
        throw new Error("Label e URL são obrigatórios em todos os links");
      }
      if (link.href.startsWith("/")) {
        // interno
      } else if (link.href.startsWith("https://")) {
        // externo
      } else {
        throw new Error(`URL inválida em "${link.label}": use caminho interno (/) ou URL https://`);
      }
    }
  }
  for (const s of config.social) {
    if (s.url && !s.url.startsWith("https://")) {
      throw new Error(`URL de ${s.platform} deve começar com https://`);
    }
  }

  const supabase = createClient();
  const { error } = await supabase.from("site_settings").upsert(
    {
      key: "footer",
      value: config as unknown as Record<string, unknown>,
      updated_at: new Date().toISOString(),
      updated_by: user.id,
    },
    { onConflict: "key" }
  );
  if (error) throw new Error(error.message);

  revalidatePath("/", "layout");
}
