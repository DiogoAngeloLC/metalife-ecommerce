/**
 * Baixa fotos do Admin legado (tmp/imagens-loja.csv) e vincula aos listings active.
 *
 * Uso:
 *   pnpm dlx tsx --env-file=.env.local scripts/sync-product-images.ts
 *   pnpm sync:images
 *
 * Requer SUPABASE_SERVICE_ROLE_KEY + NEXT_PUBLIC_SUPABASE_URL.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(process.cwd());
const CSV_PATH = resolve(ROOT, "tmp/imagens-loja.csv");
const BUCKET = "listing-images";
const FETCH_TIMEOUT_MS = 15_000;
const USER_AGENT = "Mozilla/5.0";

const PRINCIPAL_PATTERNS = [
  /\breformer\b/,
  /\bcadillac\b/,
  /\bstep\s*chair\b/,
  /\bladder\s*barrel\b/,
  /\bwall[\s-]*unit\b/,
  /\bwunda\s*chair\b/,
  /\beletric\s*chair\b/,
  /\belectric\s*chair\b/,
  /\bbau\s*chair\b/,
  /\bba[uú]\s*chair\b/,
  /\barm\s*chair\b/,
] as const;

const ACCESSORY_WORDS = [
  "caixa",
  "prancha",
  "plataforma",
  "conversor",
  "capa",
  "mola",
  "alca",
  "estofado",
  "apoio",
  "suporte",
  "roldana",
] as const;

const COLOR_SUFFIXES = [
  "cinza",
  "cinza escuro",
  "azul tuquesa",
  "azul turquesa",
  "bege",
  "bege claro",
  "bege cafe",
  "bege café",
  "preto",
  "branco",
  "bordô",
  "bordo",
  "marrom",
  "rosa",
  "turquesa",
] as const;

const ML = "https://metalifepilates.com.br/wp-content/uploads";

/**
 * Fallback quando a URL do CSV legado está 404 / domínio morto (.com.pt).
 * Fonte: imagens públicas atuais do site metalifepilates.com.br.
 * Ordem: primeiro match vence.
 */
const LIVE_IMAGE_FALLBACKS: Array<{ test: (n: string) => boolean; url: string; label: string }> = [
  // Acessórios ANTES dos equipamentos (anti-colisão caixa/prancha/plataforma/bau)
  {
    test: (n) => n.includes("caixa") && n.includes("reformer"),
    url: `${ML}/lj-caixa-reformer-infinity.webp`,
    label: "site: Caixa Reformer",
  },
  {
    test: (n) => n.includes("caixa") && n.includes("elevacao"),
    url: `${ML}/lj-caixa-elevacao-infinity.webp`,
    label: "site: Caixa Elevação",
  },
  {
    test: (n) => n.includes("prancha") && n.includes("salto"),
    url: `${ML}/lj-prancha-salto-infinity.webp`,
    label: "site: Prancha de Salto",
  },
  {
    test: (n) => n.includes("plataforma"),
    url: `${ML}/lj-plataforma-extensao-infinity.webp`,
    label: "site: Plataforma de Extensão",
  },
  {
    test: (n) => n.includes("bau") && n.includes("chair"),
    url: `${ML}/lj-bau-char-infinity.webp`,
    label: "site: Bau Chair",
  },
  // Infinity (equipamentos)
  {
    test: (n) => !n.includes("caixa") && n.includes("reformer") && n.includes("infinity"),
    url: `${ML}/reformer-inf-home.webp`,
    label: "site: Reformer Infinity",
  },
  {
    test: (n) => n.includes("cadillac") && n.includes("infinity"),
    url: `${ML}/cadillac-infinity01b.webp`,
    label: "site: Cadillac Infinity",
  },
  {
    test: (n) => n.includes("step") && n.includes("chair") && n.includes("infinity"),
    url: `${ML}/step-chair-infinity.webp`,
    label: "site: Step Chair Infinity",
  },
  {
    test: (n) => n.includes("ladder") && n.includes("barrel") && n.includes("infinity"),
    url: `${ML}/destaque-ladder-infinity.webp`,
    label: "site: Ladder Barrel Infinity",
  },
  // W23 ECO
  {
    test: (n) => !n.includes("caixa") && n.includes("reformer") && n.includes("w23"),
    url: `${ML}/reformer-w23eco-mlp.webp`,
    label: "site: Reformer W23 ECO",
  },
  {
    test: (n) => n.includes("cadillac") && n.includes("w23"),
    url: `${ML}/cadillac-w23eco.webp`,
    label: "site: Cadillac W23 ECO",
  },
  {
    test: (n) => n.includes("step") && n.includes("chair") && n.includes("w23"),
    url: `${ML}/step-chair-w23eco-mlp.webp`,
    label: "site: Step Chair W23 ECO",
  },
  {
    test: (n) => n.includes("ladder") && n.includes("barrel") && n.includes("w23"),
    url: `${ML}/ladder-barrel-w23eco-mlp.webp`,
    label: "site: Ladder Barrel W23 ECO",
  },
  // Classic / Original
  {
    test: (n) =>
      !n.includes("caixa") &&
      n.includes("reformer") &&
      (n.includes("classic") || n.includes("classica")),
    url: `${ML}/reformer-original-mlp.webp`,
    label: "site: Reformer Classic",
  },
  {
    test: (n) => n.includes("cadillac") && (n.includes("classic") || n.includes("classica")),
    url: `${ML}/cadillac-original-mlp.webp`,
    label: "site: Cadillac Classic",
  },
  {
    test: (n) =>
      n.includes("ladder") &&
      n.includes("barrel") &&
      (n.includes("classic") || n.includes("classica")),
    url: `${ML}/ladder-barrel-original-mlp.webp`,
    label: "site: Ladder Barrel Classic",
  },
  {
    test: (n) => n.includes("arm") && n.includes("chair"),
    url: `${ML}/armchair-original-lp.webp`,
    label: "site: Arm Chair Classic",
  },
  {
    test: (n) =>
      (n.includes("eletric") || n.includes("electric")) && n.includes("chair"),
    url: `${ML}/high-chair-original-mlp.webp`,
    label: "site: High/Eletric Chair Classic",
  },
  {
    test: (n) => n.includes("wunda"),
    url: `${ML}/wunda-chair-original-mlp.webp`,
    label: "site: Wunda Chair Classic",
  },
  {
    test: (n) => n.includes("rigid") && n.includes("mat"),
    url: `${ML}/rigid-mat-original-mlp.webp`,
    label: "site: Rigid Mat Classic",
  },
];

type CsvRow = {
  id: string;
  nome: string;
  imagem: string;
  link: string;
};

type ListingRow = {
  id: string;
  title: string;
  slug: string;
  equipment_type: string;
};

type MatchResult = {
  listing: ListingRow;
  csv: CsvRow | null;
  matchedName: string;
  imageUrl: string | null;
  domain: string;
  status: string;
  viaFallback?: boolean;
};

function requireEnv(name: string): string {
  const v = process.env[name]?.trim();
  if (!v) throw new Error(`Missing env ${name}`);
  return v;
}

function isValidServiceRole(key: string | undefined): boolean {
  const k = key?.trim() ?? "";
  return k.length > 40 && k.startsWith("eyJ") && !k.includes("COLE_AQUI");
}

function stripHtml(s: string): string {
  return s.replace(/<[^>]+>/g, " ").replace(/&nbsp;/gi, " ");
}

function normalizeName(input: string): string {
  let s = stripHtml(input)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[\/|_]+/g, " ")
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\b(20(2[3-9]|3[0-9]))\b/g, " ") // anos 2023+
    .replace(/\s+/g, " ")
    .trim();

  // remove color suffixes (longest first)
  const colors = [...COLOR_SUFFIXES].sort((a, b) => b.length - a.length);
  for (const c of colors) {
    const re = new RegExp(`(?:^|\\s)${c.replace(/\s+/g, "\\s+")}$`);
    s = s.replace(re, "").trim();
  }

  // common aliases
  s = s
    .replace(/\bmetalife\b/g, " ")
    .replace(/\bclassica\b/g, "classic")
    .replace(/\bclássica\b/g, "classic")
    .replace(/\bpe\s+alto\b/g, "pe alto")
    .replace(/\bpe\s+baixo\b/g, "pe baixo")
    .replace(/\blow\s+base\b/g, "pe baixo")
    .replace(/\bhigh\s+base\b/g, "pe alto")
    .replace(/\bhigt\s+base\b/g, "pe alto")
    .replace(/\bw23\s*eco\b/g, "w23 eco")
    .replace(/\bdisco\s+de\s+rotacao\b/g, "rotation disc")
    .replace(/\bbau\b/g, "bau")
    .replace(/\s+/g, " ")
    .trim();

  return s;
}

function isPrincipal(normalized: string): boolean {
  return PRINCIPAL_PATTERNS.some((re) => re.test(normalized));
}

function isAccessory(normalized: string): boolean {
  return ACCESSORY_WORDS.some((w) => new RegExp(`\\b${w}\\b`).test(normalized));
}

function itemKind(normalized: string): "principal" | "accessory" | "other" {
  const acc = isAccessory(normalized);
  const prin = isPrincipal(normalized);
  // "caixa reformer" → accessory wins over principal token
  if (acc) return "accessory";
  if (prin) return "principal";
  return "other";
}

function kindsCompatible(a: string, b: string): boolean {
  const ka = itemKind(a);
  const kb = itemKind(b);
  if (ka === "principal" && kb === "accessory") return false;
  if (ka === "accessory" && kb === "principal") return false;
  return true;
}

function domainOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

function urlPriority(url: string): number {
  const host = domainOf(url);
  if (host.endsWith("metalifepilates.com.br")) return 0;
  if (host === "metalifepilates.com") return 2;
  if (host.endsWith(".com.pt") || host.endsWith(".com.es")) return 3;
  return 1;
}

function tokenize(s: string): Set<string> {
  return new Set(s.split(/\s+/).filter((t) => t.length > 1));
}

function scoreMatch(listingNorm: string, csvNorm: string): number {
  if (!listingNorm || !csvNorm) return -1;
  if (!kindsCompatible(listingNorm, csvNorm)) return -1;

  if (listingNorm === csvNorm) return 1000;

  const lt = tokenize(listingNorm);
  const ct = tokenize(csvNorm);
  if (lt.size === 0 || ct.size === 0) return -1;

  let inter = 0;
  for (const t of lt) if (ct.has(t)) inter++;
  const union = new Set([...lt, ...ct]).size;
  const jaccard = inter / union;

  // require meaningful overlap
  if (inter < 2 && !(lt.size === 1 && ct.has([...lt][0]))) {
    // allow single-token exact for short names like "meia lua" (2 tokens)
    if (!(lt.size <= 2 && inter === lt.size)) return -1;
  }

  let score = Math.round(jaccard * 100);

  // bonus: listing contained in csv or vice-versa
  if (csvNorm.includes(listingNorm) || listingNorm.includes(csvNorm)) score += 40;

  // bonus for shared line tokens
  for (const key of ["infinity", "classic", "w23", "advanced"]) {
    if (lt.has(key) && ct.has(key)) score += 15;
  }
  for (const key of ["pe", "alto", "baixo"]) {
    if (lt.has(key) && ct.has(key)) score += 10;
  }

  // penalize extra noise on CSV (kits, combo, etc.)
  if (/\b(kit|combo|mentoria|certificacao|camiseta)\b/.test(csvNorm)) score -= 50;

  return score >= 45 ? score : -1;
}

function pickBestImageUrl(candidates: CsvRow[]): { row: CsvRow; url: string } | null {
  const withUrl = candidates
    .map((r) => ({ row: r, url: (r.imagem || "").trim() }))
    .filter((x) => /^https?:\/\//i.test(x.url));
  if (withUrl.length === 0) return null;

  const br = withUrl.filter((x) => domainOf(x.url).endsWith("metalifepilates.com.br"));
  const pool = br.length > 0 ? br : withUrl;
  pool.sort((a, b) => urlPriority(a.url) - urlPriority(b.url));
  return pool[0];
}

function parseCsv(path: string): CsvRow[] {
  const raw = readFileSync(path, "utf8").replace(/^\uFEFF/, "");
  const lines = raw.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];

  const header = lines[0].split(";").map((h) => h.trim().replace(/^"|"$/g, ""));
  const idx = (name: string) => header.indexOf(name);

  const iId = idx("id");
  const iNome = idx("nome");
  const iImg = idx("imagem");
  const iLink = idx("link");
  if (iNome < 0 || iImg < 0) {
    throw new Error(`CSV inválido. Colunas: ${header.join(", ")}`);
  }

  const rows: CsvRow[] = [];
  for (const line of lines.slice(1)) {
    const cols = splitCsvLine(line);
    const nome = stripHtml((cols[iNome] ?? "").replace(/^"|"$/g, "")).trim();
    const imagem = (cols[iImg] ?? "").replace(/^"|"$/g, "").trim();
    if (!nome || !imagem) continue;
    rows.push({
      id: (cols[iId] ?? "").replace(/^"|"$/g, ""),
      nome,
      imagem,
      link: (cols[iLink] ?? "").replace(/^"|"$/g, ""),
    });
  }
  return rows;
}

/** Minimal CSV splitter for `;` with quoted fields. */
function splitCsvLine(line: string): string[] {
  const out: string[] = [];
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
      out.push(cur);
      cur = "";
      continue;
    }
    cur += ch;
  }
  out.push(cur);
  return out;
}

function extFromContentType(ct: string, url: string): string {
  const mime = ct.split(";")[0].trim().toLowerCase();
  if (mime === "image/jpeg" || mime === "image/jpg") return "jpg";
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  if (mime === "image/gif") return "gif";
  const m = url.toLowerCase().match(/\.(jpe?g|png|webp|gif)(?:\?|$)/);
  return m ? m[1].replace("jpeg", "jpg") : "jpg";
}

async function ensureBucket(sb: SupabaseClient) {
  const { data: buckets, error } = await sb.storage.listBuckets();
  if (error) throw new Error(`listBuckets: ${error.message}`);
  const existing = buckets?.find((b) => b.id === BUCKET || b.name === BUCKET);
  if (existing) {
    if (!existing.public) {
      const { error: updErr } = await sb.storage.updateBucket(BUCKET, { public: true });
      if (updErr) console.warn(`aviso updateBucket public: ${updErr.message}`);
    }
    return;
  }
  const { error: createErr } = await sb.storage.createBucket(BUCKET, {
    public: true,
    fileSizeLimit: 10 * 1024 * 1024,
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"],
  });
  if (createErr) throw new Error(`createBucket: ${createErr.message}`);
}

function liveFallbackFor(title: string): { url: string; label: string } | null {
  const n = normalizeName(title);
  for (const row of LIVE_IMAGE_FALLBACKS) {
    if (row.test(n)) return { url: row.url, label: row.label };
  }
  return null;
}

/** Tenta CSV (.com.br primeiro); se 404/offline, usa foto viva do site Metalife. */
async function resolveWorkingImage(opts: {
  csvUrl: string | null;
  listingTitle: string;
}): Promise<{ url: string; source: string; buffer: Buffer; contentType: string; ext: string }> {
  const attempts: Array<{ url: string; source: string }> = [];
  if (opts.csvUrl) attempts.push({ url: opts.csvUrl, source: "csv" });

  // Preferir espelho .com.br se CSV veio de .com.pt / .com.es
  if (opts.csvUrl) {
    const br = opts.csvUrl
      .replace("metalifepilates.com.pt", "metalifepilates.com.br")
      .replace("metalifepilates.com.es", "metalifepilates.com.br")
      .replace("://metalifepilates.com/", "://metalifepilates.com.br/");
    if (br !== opts.csvUrl) attempts.push({ url: br, source: "csv→.com.br" });
  }

  const live = liveFallbackFor(opts.listingTitle);
  if (live) attempts.push({ url: live.url, source: live.label });

  const errors: string[] = [];
  for (const attempt of attempts) {
    try {
      const dl = await downloadImage(attempt.url);
      return { url: attempt.url, source: attempt.source, ...dl };
    } catch (err) {
      errors.push(`${attempt.source}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
  throw new Error(errors.join(" | ") || "sem URL candidata");
}

async function downloadImage(url: string): Promise<{ buffer: Buffer; contentType: string; ext: string }> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "image/*,*/*;q=0.8",
      },
      redirect: "follow",
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    const contentType = (res.headers.get("content-type") || "").toLowerCase();
    if (!contentType.startsWith("image/")) {
      throw new Error(`Content-Type inválido: ${contentType || "(vazio)"}`);
    }
    const ab = await res.arrayBuffer();
    const buffer = Buffer.from(ab);
    if (buffer.byteLength < 100) throw new Error("Arquivo muito pequeno");
    return { buffer, contentType, ext: extFromContentType(contentType, url) };
  } finally {
    clearTimeout(timer);
  }
}

/** Usa Edge Function com SERVICE_ROLE injetada no projeto (quando .env.local não tem a key). */
async function uploadViaEdgeFunction(opts: {
  supabaseUrl: string;
  anonKey: string;
  listingId: string;
  slug: string;
  imageUrl: string;
}): Promise<{ storagePath: string }> {
  const endpoint = `${opts.supabaseUrl.replace(/\/$/, "")}/functions/v1/sync-listing-image`;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 45_000);
  try {
    const res = await fetch(endpoint, {
      method: "POST",
      signal: ctrl.signal,
      headers: {
        Authorization: `Bearer ${opts.anonKey}`,
        apikey: opts.anonKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        listingId: opts.listingId,
        slug: opts.slug,
        imageUrl: opts.imageUrl,
      }),
    });
    const json = (await res.json().catch(() => ({}))) as { error?: string; storagePath?: string };
    if (!res.ok) {
      throw new Error(json.error || `Edge Function HTTP ${res.status}`);
    }
    if (!json.storagePath) throw new Error("Edge Function sem storagePath");
    return { storagePath: json.storagePath };
  } finally {
    clearTimeout(timer);
  }
}

function findMatch(
  listing: ListingRow,
  csvRows: Array<CsvRow & { norm: string }>
): { csv: CsvRow; score: number } | null {
  const ln = normalizeName(listing.title);
  let best: { csv: CsvRow; score: number } | null = null;

  // group by normalized nome then pick URL later
  for (const row of csvRows) {
    const score = scoreMatch(ln, row.norm);
    if (score < 0) continue;
    if (!best || score > best.score) best = { csv: row, score };
  }
  return best;
}

function fallbackBaseTitle(title: string): string | null {
  const n = normalizeName(title);
  if (n.includes("reformer") && n.includes("pe alto") && n.includes("infinity")) {
    return "Reformer Infinity";
  }
  if (n.includes("cadillac") && n.includes("pe baixo") && n.includes("infinity")) {
    return "Cadillac Infinity";
  }
  return null;
}

async function upsertListingImage(
  sb: SupabaseClient,
  listingId: string,
  storagePath: string
) {
  const { data: existing } = await sb
    .from("listing_images")
    .select("id")
    .eq("listing_id", listingId)
    .eq("position", 0)
    .maybeSingle();

  if (existing?.id) {
    const { error } = await sb
      .from("listing_images")
      .update({ storage_path: storagePath })
      .eq("id", existing.id);
    if (error) throw new Error(`update listing_images: ${error.message}`);
    return;
  }

  const { error } = await sb.from("listing_images").insert({
    listing_id: listingId,
    storage_path: storagePath,
    position: 0,
  });
  if (error) throw new Error(`insert listing_images: ${error.message}`);
}

function pad(s: string, n: number) {
  return (s.length > n ? s.slice(0, n - 1) + "…" : s).padEnd(n);
}

async function main() {
  const url = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
  const anonKey = requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ?? "";
  const useLocalService = isValidServiceRole(serviceKey);

  const sb = createClient(url, useLocalService ? serviceKey : anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  console.log(`Lendo CSV: ${CSV_PATH}`);
  const csv = parseCsv(CSV_PATH);
  console.log(`CSV com imagem: ${csv.length} linhas`);
  if (!useLocalService) {
    console.warn(
      "AVISO: SUPABASE_SERVICE_ROLE_KEY inválida/ausente. A Edge Function sync-listing-image está DESABILITADA (410).\n" +
        "Configure a service_role em .env.local para novos uploads."
    );
  }
  console.log(useLocalService ? "Upload: SERVICE_ROLE local" : "Upload: bloqueado (sem service_role)");

  const csvIndexed = csv.map((r) => ({ ...r, norm: normalizeName(r.nome) }));

  if (useLocalService) {
    await ensureBucket(sb);
    console.log(`Bucket ${BUCKET} OK (público)`);
  }

  const { data: listings, error: listErr } = await sb
    .from("listings")
    .select("id, title, slug, equipment_type")
    .eq("status", "active")
    .order("title");
  if (listErr) throw new Error(listErr.message);
  const active = (listings ?? []) as ListingRow[];
  console.log(`Listings active: ${active.length}\n`);

  // Pre-group CSV by normalized name for URL prioritization among duplicates
  const byNorm = new Map<string, CsvRow[]>();
  for (const row of csvIndexed) {
    const arr = byNorm.get(row.norm) ?? [];
    arr.push(row);
    byNorm.set(row.norm, arr);
  }

  const results: MatchResult[] = [];

  for (const listing of active) {
    let match = findMatch(listing, csvIndexed);
    let viaFallback = false;

    // If multiple rows share the matched nome, re-pick by URL priority among same nome
    if (match) {
      const sameNome = csv.filter((r) => normalizeName(r.nome) === normalizeName(match!.csv.nome));
      const picked = pickBestImageUrl(sameNome.length ? sameNome : [match.csv]);
      if (picked) match = { csv: picked.row, score: match.score };
    }

    // Pe Alto / Pe Baixo fallback to base Infinity
    if (!match) {
      const base = fallbackBaseTitle(listing.title);
      if (base) {
        const baseNorm = normalizeName(base);
        const candidates = csvIndexed.filter(
          (r) =>
            kindsCompatible(normalizeName(listing.title), r.norm) &&
            (r.norm === baseNorm ||
              (r.norm.includes("infinity") &&
                ((baseNorm.includes("reformer") && r.norm.includes("reformer") && !r.norm.includes("pe")) ||
                  (baseNorm.includes("cadillac") && r.norm.includes("cadillac") && !r.norm.includes("pe")))))
        );
        const scored = candidates
          .map((r) => ({ csv: r, score: scoreMatch(baseNorm, r.norm) }))
          .filter((x) => x.score >= 0)
          .sort((a, b) => b.score - a.score);
        if (scored[0]) {
          match = scored[0];
          viaFallback = true;
        }
      }
    }

    // Sem match no CSV: ainda tenta fallback vivo do site
    const csvPicked = match
      ? pickBestImageUrl(
          csv.filter((r) => normalizeName(r.nome) === normalizeName(match!.csv.nome))
        ) ?? { row: match.csv, url: match.csv.imagem }
      : null;

    try {
      const resolved = await resolveWorkingImage({
        csvUrl: csvPicked?.url ?? null,
        listingTitle: listing.title,
      });

      if (!useLocalService) {
        throw new Error(
          "SERVICE_ROLE ausente — Edge Function sync-listing-image desabilitada (410)"
        );
      }

      const storagePath = `${listing.slug}.${resolved.ext}`;
      const { error: upErr } = await sb.storage.from(BUCKET).upload(storagePath, resolved.buffer, {
        contentType: resolved.contentType,
        upsert: true,
        cacheControl: "3600",
      });
      if (upErr) throw new Error(`upload: ${upErr.message}`);
      await upsertListingImage(sb, listing.id, storagePath);

      const usedLive = resolved.source.startsWith("site:");
      results.push({
        listing,
        csv: match?.csv ?? null,
        matchedName: match?.csv.nome ?? resolved.source,
        imageUrl: resolved.url,
        domain: domainOf(resolved.url) || "—",
        status: viaFallback || usedLive ? `OK (${resolved.source})` : "OK",
        viaFallback: viaFallback || usedLive,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      results.push({
        listing,
        csv: match?.csv ?? null,
        matchedName: match?.csv.nome ?? "—",
        imageUrl: csvPicked?.url ?? null,
        domain: csvPicked ? domainOf(csvPicked.url) || "—" : "—",
        status: match ? msg : `SEM MATCH / ${msg}`,
      });
    }
  }

  console.log(
    `${pad("Produto ativo", 38)} | ${pad("Matched", 36)} | ${pad("Domínio", 28)} | Status`
  );
  console.log("-".repeat(120));
  for (const r of results) {
    console.log(
      `${pad(r.listing.title, 38)} | ${pad(r.matchedName, 36)} | ${pad(r.domain, 28)} | ${r.status}`
    );
  }

  const without = results.filter((r) => !r.status.startsWith("OK"));
  const ok = results.filter((r) => r.status.startsWith("OK"));
  console.log("\n=== RESUMO ===");
  console.log(`OK: ${ok.length}`);
  console.log(`Falhas / sem match: ${without.length}`);
  console.log("\nProdutos active SEM FOTO após o script:");
  if (without.length === 0) {
    console.log("  (nenhum)");
  } else {
    for (const r of without) {
      console.log(`  - ${r.listing.title}  [${r.status}]`);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
