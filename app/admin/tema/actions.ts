"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/supabase/auth";
import type { ThemeTokens } from "@/lib/site-config";

const HEX_RE = /^#[0-9a-fA-F]{3,8}$/;
const ALLOWED_DISPLAY_FONTS = ["montserrat", "playfair", "inter", "bebas", "roboto", "open_sans"] as const;
const ALLOWED_BODY_FONTS = ["inter", "roboto", "source_sans", "open_sans"] as const;

export async function updateThemeAction(tokens: ThemeTokens) {
  const user = await requireAdmin();

  for (const [k, v] of Object.entries(tokens.colors)) {
    if (typeof v !== "string" || !HEX_RE.test(v)) {
      throw new Error(`Cor inválida em "${k}": "${v}"`);
    }
  }
  if (!ALLOWED_DISPLAY_FONTS.includes(tokens.typography.font_display as (typeof ALLOWED_DISPLAY_FONTS)[number])) {
    throw new Error(`Fonte display inválida: ${tokens.typography.font_display}`);
  }
  if (!ALLOWED_BODY_FONTS.includes(tokens.typography.font_body as (typeof ALLOWED_BODY_FONTS)[number])) {
    throw new Error(`Fonte body inválida: ${tokens.typography.font_body}`);
  }

  const supabase = createClient();
  const { error } = await supabase.from("site_settings").upsert(
    {
      key: "theme",
      value: tokens as unknown as Record<string, unknown>,
      updated_at: new Date().toISOString(),
      updated_by: user.id,
    },
    { onConflict: "key" }
  );
  if (error) throw new Error(error.message);

  revalidatePath("/", "layout");
}

export async function resetThemeAction() {
  await requireAdmin();
  const supabase = createClient();
  await supabase.from("site_settings").delete().eq("key", "theme");
  revalidatePath("/", "layout");
}
