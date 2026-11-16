import { createClient } from "@/lib/supabase/server";

export type HeroSettings = {
  image_url: string | null;
  eyebrow: string;
  title: string;
  subtitle: string;
};

export async function getHeroSettings(): Promise<HeroSettings> {
  const supabase = createClient();
  const { data } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", "hero")
    .maybeSingle();

  const value = (data?.value ?? {}) as Partial<HeroSettings>;
  return {
    image_url: value.image_url ?? null,
    eyebrow: value.eyebrow ?? "Loja Oficial Metalife",
    title: value.title ?? "Equipamentos oficiais direto da fábrica.",
    subtitle:
      value.subtitle ??
      "Equipamentos oficiais direto da fábrica Metalife. Personalize estrutura e estofado e compre online com entrega em todo o Brasil.",
  };
}

export async function getLegalPage(slug: string) {
  const supabase = createClient();
  const { data } = await supabase
    .from("legal_pages")
    .select("title, content_md, updated_at")
    .eq("slug", slug)
    .maybeSingle();
  return data;
}

export async function getActiveBanners(slotKey: string) {
  const supabase = createClient();
  const { data } = await supabase
    .from("ad_banners")
    .select("id, image_url, link_url, alt_text")
    .eq("slot_key", slotKey)
    .eq("active", true)
    .order("sort_order", { ascending: true })
    .limit(3);
  return data ?? [];
}

export function siteAssetUrl(storagePath: string): string {
  if (storagePath.startsWith("http")) return storagePath;
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  return `${base}/storage/v1/object/public/site-assets/${storagePath}`;
}
