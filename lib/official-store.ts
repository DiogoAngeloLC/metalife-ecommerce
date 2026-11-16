/** UUID fixo do vendor Loja Oficial Metalife (seed em 0012). */
export const OFFICIAL_VENDOR_ID = "a1111111-1111-4111-8111-111111111111";

export const OFFICIAL_VENDOR_NAME = "Metalife Pilates (Loja Oficial)";

export function madeToOrderLabel(productionDays: number | null | undefined): string {
  const days = productionDays != null && productionDays > 0 ? productionDays : 15;
  return `Fabricação sob encomenda: ${days} dias úteis`;
}

/** Bloqueia só quando não é sob encomenda e estoque insuficiente. */
export function isVariantUnavailable(opts: {
  stockQty: number;
  quantity?: number;
  isMadeToOrder: boolean;
}): boolean {
  if (opts.isMadeToOrder) return false;
  const needed = opts.quantity ?? 1;
  return opts.stockQty < needed;
}
