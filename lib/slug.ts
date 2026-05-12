import { customAlphabet } from "nanoid";

// Alfabeto sem ambíguos (0/O, 1/l/I) pra URL limpa
const nano = customAlphabet("23456789abcdefghjkmnpqrstuvwxyz", 6);

/**
 * Gera slug único a partir do título.
 * Ex: "Reformer Arktus Clássico" → "reformer-arktus-classico-x7k2nm"
 */
export function generateSlug(title: string): string {
  const base = title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

  // Fallback se título virar string vazia (ex: só emojis)
  const safeBase = base || "anuncio";

  return `${safeBase}-${nano()}`;
}

/**
 * Normaliza valor de campo string livre (equipment_type, brand) antes do insert.
 * Trim + colapsa espaços. Mantém capitalização que o usuário digitou
 * (buscas usam pg_trgm com ILIKE, então capitalização não importa).
 */
export function normalizeFreeText(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}
