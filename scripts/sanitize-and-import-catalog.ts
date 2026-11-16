/**
 * Saneamento + importação idempotente do catálogo legado Metalife.
 *
 * Uso:
 *   pnpm dlx tsx --env-file=.env.local scripts/sanitize-and-import-catalog.ts
 *   pnpm dlx tsx --env-file=.env.local scripts/sanitize-and-import-catalog.ts --dry-run
 *
 * Requer SUPABASE_SERVICE_ROLE_KEY para gravar no remoto.
 */
import { createClient } from "@supabase/supabase-js";
import { createHash, randomUUID } from "node:crypto";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const OFFICIAL_VENDOR_ID = "a1111111-1111-4111-8111-111111111111";
const ROOT = resolve(process.cwd());
const INPUT = resolve(ROOT, "tmp/catalogo-ecommerce-95d33ff8.csv");
const OUTPUT = resolve(ROOT, "tmp/catalogo-limpo-loja-oficial.csv");

const ENGLISH_TERMS = [
  "Black",
  "White",
  "Navy Blue",
  "Dark Grey",
  "Dark Brown",
  "Light Beige",
  "Coffee Beige",
  "Burgundy",
  "Turquoise",
  "Jungle Green",
  "Perugia Green",
  "Mustard",
  "Extension Platform",
  "Jump Board",
  "Reformer Box",
  "Small Barrel",
  "Spine Corrector",
  "Head Support",
] as const;

const COLOR_MAP: Record<string, string> = {
  PRETO: "Preto",
  BRANCO: "Branco",
  "CINZA ESCURO": "Cinza Escuro",
  BORDO: "Bordô",
  "BORDÔ": "Bordô",
  "BEGE CAFE": "Bege Café",
  "BEGE CAFÉ": "Bege Café",
  "AZUL TURQUESA": "Azul Turquesa",
  "ROSE CIPRIA": "Rosé Cipria",
  "ROSÊ CIPRIA": "Rosé Cipria",
  "ROSÉ CIPRIA": "Rosé Cipria",
  "AZUL MARINHO": "Azul Marinho",
  "VERDE PERUGIA": "Verde Perugia",
  "BEGE CLARO": "Bege Claro",
  "VERDE SELVA": "Verde Selva",
  "MARROM ESCURO": "Marrom Escuro",
  MOSTARDA: "Mostarda",
  MARROM: "Marrom",
  "VERDE ESCURO": "Verde Escuro",
  "BEGE ESCURO": "Bege Escuro",
  "VERMELHO ESCURO": "Vermelho Escuro",
  "MADEIRA PADRAO": "Madeira Padrão",
  "MADEIRA PADRÃO": "Madeira Padrão",
  PADRAO: "Padrão",
  "PADRÃO": "Padrão",
  "PADR??O": "Padrão",
};

type RawRow = Record<string, string>;

type CleanRow = {
  categoria_grupo: string;
  produto_pai: string;
  nome_original_admin: string;
  sku: string;
  structure_color: string;
  upholstery_color: string;
  str_code: string;
  stf_code: string;
  protheus_code: string;
  price_reais: string;
  production_days: string;
  image_url: string;
};

type Stats = {
  read: number;
  discardedAssistencia: number;
  discardedEscopo: number;
  discardedEnglish: number;
  discardedInvalid: number;
  duplicatesRemoved: number;
  kept: number;
  listingsCreated: number;
  listingsUpdated: number;
  variantsUpserted: number;
};

function parseCsv(text: string): { headers: string[]; rows: RawRow[] } {
  const normalized = text.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const lines = normalized.split("\n").filter((l) => l.length > 0);
  if (!lines.length) return { headers: [], rows: [] };

  const parseLine = (line: string): string[] => {
    const cells: string[] = [];
    let cur = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
        continue;
      }
      if (ch === ";" && !inQuotes) {
        cells.push(cur);
        cur = "";
        continue;
      }
      cur += ch;
    }
    cells.push(cur);
    return cells.map((c) => c.trim());
  };

  const headers = parseLine(lines[0]).map((h) => h.trim());
  const rows: RawRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cells = parseLine(lines[i]);
    if (cells.every((c) => !c)) continue;
    const row: RawRow = {};
    headers.forEach((h, idx) => {
      row[h] = cells[idx] ?? "";
    });
    rows.push(row);
  }
  return { headers, rows };
}

function toCsv(rows: CleanRow[]): string {
  const headers = [
    "categoria_grupo",
    "produto_pai",
    "nome_original_admin",
    "sku",
    "structure_color",
    "upholstery_color",
    "str_code",
    "stf_code",
    "protheus_code",
    "price_reais",
    "production_days",
    "image_url",
  ] as const;

  const esc = (v: string) => {
    if (/[;"\n\r]/.test(v)) return `"${v.replace(/"/g, '""')}"`;
    return v;
  };

  const lines = [headers.join(";")];
  for (const r of rows) {
    lines.push(headers.map((h) => esc(r[h] ?? "")).join(";"));
  }
  return `\uFEFF${lines.join("\n")}\n`;
}

function fixEncoding(value: string): string {
  return value
    .replace(/Padr\?\?o/gi, "Padrão")
    .replace(/Padrao/gi, "Padrão")
    .replace(/Ros[eêé] Cipria/gi, "Rosé Cipria")
    .replace(/Bege Cafe/gi, "Bege Café")
    .replace(/Bordo/gi, "Bordô")
    .trim();
}

function titleCaseColor(raw: string): string {
  const fixed = fixEncoding(raw);
  if (!fixed) return "";
  const key = fixed
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/\s+/g, " ")
    .trim();

  // map by accent-stripped upper key
  const byStripped: Record<string, string> = {};
  for (const [k, v] of Object.entries(COLOR_MAP)) {
    const sk = k
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toUpperCase()
      .replace(/\s+/g, " ");
    byStripped[sk] = v;
  }
  if (byStripped[key]) return byStripped[key];

  // generic title case with known accent fixes
  const titled = fixed
    .toLowerCase()
    .split(/\s+/)
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ")
    .replace(/\bCafe\b/g, "Café")
    .replace(/\bBordo\b/g, "Bordô")
    .replace(/\bRose\b/g, "Rosé")
    .replace(/\bPadrao\b/g, "Padrão")
    .replace(/\bPadrão\b/g, "Padrão");
  return titled;
}

function normalizeProdutoPai(raw: string): string {
  let s = fixEncoding(raw).replace(/\s+/g, " ").trim();
  // remove códigos numéricos residuais no fim / meio isolados
  s = s.replace(/\b\d{5,}\b/g, " ").replace(/\s+/g, " ").trim();
  // remove hífens órfãos
  s = s.replace(/\s*-\s*$/g, "").replace(/^\s*-\s*/g, "").trim();
  // Title Case para agrupar variantes de capitalização (W23 eco vs W23 Eco)
  s = s
    .split(" ")
    .map((w) => {
      if (!w) return w;
      const upper = w.toUpperCase();
      if (upper === "W23" || upper === "ECO" || upper === "FIVE" || upper === "LB") {
        return upper === "ECO" ? "ECO" : upper;
      }
      if (/^\d/.test(w)) return w;
      return w[0].toUpperCase() + w.slice(1).toLowerCase();
    })
    .join(" ");
  return s;
}

function isCommercialCategory(cat: string): boolean {
  const c = cat.trim();
  if (c === "Five" || c.startsWith("Five /") || c.startsWith("Five -")) return true;
  if (c.startsWith("Metalife - Equipamentos")) return true;
  if (c.startsWith("Metalife - Acessórios")) return true;
  if (c.startsWith("Metalife - Móveis") || c.startsWith("Metalife - Moveis")) return true;
  return false;
}

function isEnglishCatalog(row: RawRow): boolean {
  const blob = [
    row.nome_original_admin ?? "",
    row.produto_pai ?? "",
    row.structure_color ?? "",
    row.upholstery_color ?? "",
  ].join(" ");
  const lower = blob.toLowerCase();
  return ENGLISH_TERMS.some((t) => lower.includes(t.toLowerCase()));
}

function isWoodLine(cat: string, pai: string): boolean {
  const blob = `${cat} ${pai}`.toLowerCase();
  return (
    blob.includes("classic") ||
    blob.includes("clássic") ||
    blob.includes("classica") ||
    blob.includes("clássica") ||
    blob.includes("w23 eco") ||
    blob.includes("w23")
  );
}

function reaisToNumber(raw: string): number | null {
  const n = Number(String(raw).replace(",", ".").trim());
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n * 100) / 100;
}

function slugify(title: string): string {
  const base = title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return base || "produto";
}

function equipmentTypeFromCategory(cat: string): string {
  if (cat.includes("Acessórios") || cat.includes("Acessorios")) return "Acessório";
  if (cat.includes("Móveis") || cat.includes("Moveis")) return "Móvel";
  if (cat.startsWith("Five")) return "Five";
  return "Equipamento";
}

function brandFromCategory(cat: string): string {
  if (cat.startsWith("Five")) return "Five";
  return "Metalife";
}

function sanitize(rows: RawRow[]): { clean: CleanRow[]; stats: Stats } {
  const stats: Stats = {
    read: rows.length,
    discardedAssistencia: 0,
    discardedEscopo: 0,
    discardedEnglish: 0,
    discardedInvalid: 0,
    duplicatesRemoved: 0,
    kept: 0,
    listingsCreated: 0,
    listingsUpdated: 0,
    variantsUpserted: 0,
  };

  const filtered: CleanRow[] = [];

  for (const row of rows) {
    const cat = (row.categoria_grupo ?? "").trim();
    if (cat.startsWith("Assistência Técnica") || cat.startsWith("Assistencia Tecnica")) {
      stats.discardedAssistencia++;
      continue;
    }
    if (!isCommercialCategory(cat)) {
      stats.discardedEscopo++;
      continue;
    }
    if (isEnglishCatalog(row)) {
      stats.discardedEnglish++;
      continue;
    }

    const sku = (row.sku ?? "").trim();
    const pai = normalizeProdutoPai(row.produto_pai ?? "");
    if (!sku || !pai) {
      stats.discardedInvalid++;
      continue;
    }

    const price = reaisToNumber(row.price_reais ?? "");
    if (price == null || price <= 0) {
      stats.discardedInvalid++;
      continue;
    }

    let structure = titleCaseColor(row.structure_color ?? "");
    let upholstery = titleCaseColor(row.upholstery_color ?? "");
    const strCode = (row.str_code ?? "").trim();
    const stfCode = (row.stf_code ?? "").trim();

    if (
      isWoodLine(cat, pai) &&
      !strCode &&
      structure &&
      upholstery &&
      structure.toLowerCase() === upholstery.toLowerCase()
    ) {
      structure = "Madeira Padrão";
    }

    const daysRaw = parseInt((row.production_days ?? "15").replace(/\D/g, "") || "15", 10);

    filtered.push({
      categoria_grupo: cat,
      produto_pai: pai,
      nome_original_admin: fixEncoding(row.nome_original_admin ?? ""),
      sku,
      structure_color: structure,
      upholstery_color: upholstery,
      str_code: strCode,
      stf_code: stfCode,
      protheus_code: (row.protheus_code ?? "").trim(),
      price_reais: price.toFixed(2),
      production_days: String(Math.max(0, daysRaw)),
      image_url: (row.image_url ?? "").trim(),
    });
  }

  // Dedup (produto_pai, sku) — mantém primeira ocorrência
  const seen = new Set<string>();
  const clean: CleanRow[] = [];
  for (const row of filtered) {
    const key = `${row.produto_pai.toLowerCase()}::${row.sku}`;
    if (seen.has(key)) {
      stats.duplicatesRemoved++;
      continue;
    }
    seen.add(key);
    clean.push(row);
  }

  stats.kept = clean.length;
  return { clean, stats };
}

async function importToSupabase(clean: CleanRow[], stats: Stats) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key || key.includes("COLE_AQUI") || key.length < 20) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY ausente/inválida. CSV limpo gerado; configure a key para importar."
    );
  }

  const sb = createClient(url, key, { auth: { persistSession: false } });

  const { data: vendor, error: vErr } = await sb
    .from("vendors")
    .select("id, is_official")
    .eq("id", OFFICIAL_VENDOR_ID)
    .single();
  if (vErr || !vendor) {
    throw new Error(`Vendor oficial não encontrado: ${vErr?.message ?? "missing"}`);
  }

  // Agrupa por produto pai
  const byParent = new Map<string, CleanRow[]>();
  for (const row of clean) {
    const list = byParent.get(row.produto_pai) ?? [];
    list.push(row);
    byParent.set(row.produto_pai, list);
  }

  // Slug estável e único por produto_pai (evita colisão Cunha Grande vs CUNHA GRANDE)
  const usedSlugs = new Set<string>();
  const slugForParent = (produtoPai: string): string => {
    let base = slugify(produtoPai);
    if (!usedSlugs.has(base)) {
      usedSlugs.add(base);
      return base;
    }
    const h = createHash("sha1").update(produtoPai).digest("hex").slice(0, 6);
    const withHash = `${base}-${h}`;
    usedSlugs.add(withHash);
    return withHash;
  };

  for (const [produtoPai, variants] of Array.from(byParent.entries())) {
    const slug = slugForParent(produtoPai);
    const cat = variants[0].categoria_grupo;
    const prices = variants.map((v: CleanRow) => reaisToNumber(v.price_reais)!);
    const minPrice = Math.min(...prices);

    // Prefer match by exact title + vendor (idempotente entre reimports)
    const { data: existingByTitle } = await sb
      .from("listings")
      .select("id, slug")
      .eq("vendor_id", OFFICIAL_VENDOR_ID)
      .eq("title", produtoPai.slice(0, 120))
      .maybeSingle();

    const { data: existingBySlug } = existingByTitle
      ? { data: null }
      : await sb
          .from("listings")
          .select("id, slug")
          .eq("vendor_id", OFFICIAL_VENDOR_ID)
          .eq("slug", slug)
          .maybeSingle();

    const existing = existingByTitle ?? existingBySlug;
    let listingId: string;

    if (existing?.id) {
      listingId = existing.id;
      const { error } = await sb
        .from("listings")
        .update({
          title: produtoPai.slice(0, 120),
          slug: existing.slug || slug,
          description: `Catálogo Loja Oficial Metalife — ${cat}. Importado para revisão (rascunho).`,
          equipment_type: equipmentTypeFromCategory(cat),
          brand: brandFromCategory(cat),
          condition: "novo",
          has_fixed_price: true,
          price: minPrice,
          is_negotiable: false,
          city: "São Paulo",
          state: "SP",
          status: "draft",
          published_at: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", listingId);
      if (error) throw new Error(`Update listing ${produtoPai}: ${error.message}`);
      stats.listingsUpdated++;
    } else {
      listingId = randomUUID();
      let finalSlug = slug;
      const { data: slugHit } = await sb
        .from("listings")
        .select("id")
        .eq("slug", finalSlug)
        .maybeSingle();
      if (slugHit) {
        const h = createHash("sha1").update(produtoPai).digest("hex").slice(0, 6);
        finalSlug = `${slug}-${h}`;
      }

      const { error } = await sb.from("listings").insert({
        id: listingId,
        vendor_id: OFFICIAL_VENDOR_ID,
        slug: finalSlug,
        title: produtoPai.slice(0, 120),
        description: `Catálogo Loja Oficial Metalife — ${cat}. Importado para revisão (rascunho).`,
        equipment_type: equipmentTypeFromCategory(cat),
        brand: brandFromCategory(cat),
        condition: "novo",
        has_fixed_price: true,
        price: minPrice,
        is_negotiable: false,
        city: "São Paulo",
        state: "SP",
        status: "draft",
        published_at: null,
      });
      if (error) throw new Error(`Insert listing ${produtoPai}: ${error.message}`);
      stats.listingsCreated++;
    }

    for (const v of variants) {
      const priceCents = Math.round((reaisToNumber(v.price_reais) ?? 0) * 100);
      const productionDays = Math.max(0, parseInt(v.production_days, 10) || 15);
      const payload = {
        listing_id: listingId,
        sku: v.sku,
        structure_color: v.structure_color || null,
        upholstery_color: v.upholstery_color || null,
        str_code: v.str_code || null,
        stf_code: v.stf_code || null,
        protheus_code: v.protheus_code || null,
        price_cents: priceCents,
        production_days: productionDays,
        is_made_to_order: true,
        stock_qty: 0,
        active: true,
        updated_at: new Date().toISOString(),
      };

      const { data: existingVar } = await sb
        .from("listing_variants")
        .select("id")
        .eq("listing_id", listingId)
        .eq("sku", v.sku)
        .maybeSingle();

      if (existingVar?.id) {
        const { error } = await sb
          .from("listing_variants")
          .update(payload)
          .eq("id", existingVar.id);
        if (error) throw new Error(`Update variant ${v.sku}: ${error.message}`);
      } else {
        const { error } = await sb.from("listing_variants").insert(payload);
        if (error) throw new Error(`Insert variant ${v.sku}: ${error.message}`);
      }
      stats.variantsUpserted++;
    }
  }
}

function printSummary(stats: Stats, dryRun: boolean) {
  console.log("\n========== RESUMO IMPORTAÇÃO CATÁLOGO ==========");
  console.log(`Linhas lidas:                    ${stats.read}`);
  console.log(`Descartadas (Assistência Téc.):  ${stats.discardedAssistencia}`);
  console.log(`Descartadas (fora do escopo):    ${stats.discardedEscopo}`);
  console.log(`Descartadas (catálogo inglês):   ${stats.discardedEnglish}`);
  console.log(`Descartadas (inválidas):         ${stats.discardedInvalid}`);
  console.log(`Duplicidades removidas:          ${stats.duplicatesRemoved}`);
  console.log(`Linhas limpas (CSV):             ${stats.kept}`);
  if (!dryRun) {
    console.log(`Produtos pais criados:           ${stats.listingsCreated}`);
    console.log(`Produtos pais atualizados:       ${stats.listingsUpdated}`);
    console.log(`Variantes importadas (upsert):   ${stats.variantsUpserted}`);
  } else {
    console.log("(dry-run — nenhum write no Supabase)");
  }
  console.log(`CSV limpo: ${OUTPUT}`);
  console.log("================================================\n");
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  if (!existsSync(INPUT)) {
    throw new Error(`Arquivo de entrada não encontrado: ${INPUT}`);
  }

  mkdirSync(resolve(ROOT, "tmp"), { recursive: true });
  const rawText = readFileSync(INPUT, "utf8");
  const { rows } = parseCsv(rawText);
  const { clean, stats } = sanitize(rows);

  writeFileSync(OUTPUT, toCsv(clean), "utf8");
  console.log(`CSV limpo escrito: ${OUTPUT} (${clean.length} linhas)`);

  // JSON auxiliar para importação alternativa / auditoria
  writeFileSync(
    resolve(ROOT, "tmp/catalogo-limpo-loja-oficial.json"),
    JSON.stringify(clean, null, 2),
    "utf8"
  );

  if (!dryRun) {
    await importToSupabase(clean, stats);
  }

  printSummary(stats, dryRun);
}

main().catch((err) => {
  console.error("\nFALHA:", err instanceof Error ? err.message : err);
  process.exit(1);
});
