export type CartVariantSnapshot = {
  structure_color?: string | null;
  upholstery_color?: string | null;
  sku?: string | null;
  str_code?: string | null;
  stf_code?: string | null;
  protheus_code?: string | null;
  is_made_to_order?: boolean;
  production_days?: number | null;
};

export type CartItem = {
  key: string; // listingId + variantId
  listingId: string;
  variantId: string | null;
  vendorId: string;
  vendorName: string | null;
  title: string;
  imageUrl: string | null;
  unitPriceCents: number;
  quantity: number;
  slug: string;
  variant: CartVariantSnapshot | null;
};

export type CartState = {
  items: CartItem[];
};

export type AddToCartInput = {
  listingId: string;
  variantId?: string | null;
  vendorId: string;
  vendorName?: string | null;
  title: string;
  imageUrl?: string | null;
  unitPriceCents: number;
  slug: string;
  quantity?: number;
  variant?: CartVariantSnapshot | null;
};

export function cartItemKey(listingId: string, variantId?: string | null): string {
  return `${listingId}::${variantId ?? "base"}`;
}

export function toCentsFromBRL(price: number): number {
  return Math.round(Number(price) * 100);
}

export function centsToBRL(cents: number): number {
  return cents / 100;
}
