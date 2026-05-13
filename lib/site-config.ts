import { createClient } from "@/lib/supabase/server";

export type ThemeTokens = {
  colors: Record<string, string>;
  typography: {
    font_display: "montserrat" | "playfair" | "inter" | "bebas" | "roboto" | "open_sans";
    font_body: "inter" | "roboto" | "source_sans" | "open_sans";
    weight_display: string;
    weight_body: string;
    scale: string;
  };
  shape: {
    radius_base: string;
    radius_card: string;
  };
};

export type Brand = {
  name: string;
  tagline: string;
  logo_url: string | null;
  logo_dark_url: string | null;
  favicon_url: string | null;
  og_image_url: string | null;
};

export type FooterConfig = {
  description: string;
  company: {
    name: string;
    cnpj: string | null;
    email: string | null;
    phone: string | null;
    address: string | null;
  };
  columns: Array<{
    title: string;
    links: Array<{ label: string; href: string }>;
  }>;
  social: Array<{ platform: string; url: string | null }>;
};

export type MenuItem = {
  label: string;
  href: string;
  external: boolean;
  order: number;
};

async function readSetting<T>(key: string, fallback: T): Promise<T> {
  const supabase = createClient();
  const { data } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", key)
    .maybeSingle();
  return (data?.value as T) ?? fallback;
}

export async function getThemeTokens(): Promise<ThemeTokens> {
  const raw = await readSetting<Partial<ThemeTokens> | null>("theme", null);
  if (!raw || !raw.colors || !raw.typography || !raw.shape) {
    return DEFAULT_THEME;
  }
  return {
    colors: { ...DEFAULT_THEME.colors, ...raw.colors },
    typography: { ...DEFAULT_THEME.typography, ...raw.typography },
    shape: { ...DEFAULT_THEME.shape, ...raw.shape },
  };
}

export async function getBrand(): Promise<Brand> {
  const raw = await readSetting<Partial<Brand> | null>("brand", null);
  return { ...DEFAULT_BRAND, ...raw };
}

export async function getFooterConfig(): Promise<FooterConfig> {
  const raw = await readSetting<Partial<FooterConfig> | null>("footer", null);
  if (!raw || typeof raw.description !== "string") {
    return DEFAULT_FOOTER;
  }
  const columns = Array.isArray(raw.columns) && raw.columns.length > 0 ? raw.columns : DEFAULT_FOOTER.columns;
  const social = Array.isArray(raw.social) && raw.social.length > 0 ? raw.social : DEFAULT_FOOTER.social;
  return {
    description: raw.description,
    company: { ...DEFAULT_FOOTER.company, ...raw.company },
    columns,
    social,
  };
}

export async function getMenuItems(): Promise<MenuItem[]> {
  const data = await readSetting<{ items?: MenuItem[] }>("menu", { items: DEFAULT_MENU });
  const items = data.items?.length ? data.items : DEFAULT_MENU;
  return [...items].sort((a, b) => a.order - b.order);
}

const DEFAULT_THEME: ThemeTokens = {
  colors: {
    action: "#e11d48",
    action_dark: "#be123c",
    trust: "#2563eb",
    ink: "#0f172a",
    ink_soft: "#475569",
    muted: "#64748b",
    bg: "#f7f9fb",
    bg_elevated: "#ffffff",
    bg_section: "#f1f5f9",
    bg_dark: "#0f172a",
    line: "#e2e8f0",
    line_strong: "#cbd5e1",
    success: "#16a34a",
    danger: "#dc2626",
  },
  typography: {
    font_display: "montserrat",
    font_body: "inter",
    weight_display: "900",
    weight_body: "400",
    scale: "1.0",
  },
  shape: { radius_base: "4px", radius_card: "0px" },
};

const DEFAULT_BRAND: Brand = {
  name: "Classificado Pilates",
  tagline: "Marketplace de equipamentos",
  logo_url: null,
  logo_dark_url: null,
  favicon_url: null,
  og_image_url: null,
};

const DEFAULT_FOOTER: FooterConfig = {
  description: "Marketplace de equipamentos de Pilates.",
  company: {
    name: "Classificado Pilates",
    cnpj: null,
    email: null,
    phone: null,
    address: null,
  },
  columns: [
    {
      title: "Compradores",
      links: [
        { label: "Catálogo", href: "/catalogo" },
        { label: "Reformers", href: "/catalogo?categoria=reformer" },
        { label: "Novidades", href: "/catalogo?ordem=recentes" },
      ],
    },
    {
      title: "Vendedores",
      links: [
        { label: "Como anunciar", href: "/dashboard/novo" },
        { label: "Painel", href: "/dashboard" },
        { label: "Cadastre-se", href: "/cadastro" },
      ],
    },
    {
      title: "Institucional",
      links: [
        { label: "Política de Privacidade", href: "/politica-de-privacidade" },
        { label: "Termos de Uso", href: "/termos-de-uso" },
      ],
    },
  ],
  social: [
    { platform: "instagram", url: null },
    { platform: "facebook", url: null },
    { platform: "linkedin", url: null },
    { platform: "youtube", url: null },
    { platform: "tiktok", url: null },
    { platform: "twitter", url: null },
  ],
};

const DEFAULT_MENU: MenuItem[] = [
  { label: "Catálogo", href: "/catalogo", external: false, order: 1 },
  { label: "Reformers", href: "/catalogo?categoria=reformer", external: false, order: 2 },
  { label: "Novidades", href: "/catalogo?ordem=recentes", external: false, order: 3 },
];

export function generateThemeCss(tokens: ThemeTokens): string {
  const c = tokens.colors;
  const t = tokens.typography;
  const s = tokens.shape;

  const colorLines = Object.entries(c)
    .map(([k, v]) => `  --${k.replace(/_/g, "-")}: ${v};`)
    .join("\n");

  const muted = c.muted ?? "#64748b";

  return `:root{
${colorLines}
  --text-muted: ${muted};
  --font-display: var(--font-${t.font_display});
  --font-body: var(--font-${t.font_body});
  --font-weight-display: ${t.weight_display};
  --font-weight-body: ${t.weight_body};
  --font-scale: ${t.scale};
  --radius-base: ${s.radius_base};
  --radius-card: ${s.radius_card};
}
body { font-size: calc(1rem * ${t.scale}); }`;
}
