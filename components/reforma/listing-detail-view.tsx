"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ChevronRight,
  MessageCircle,
  ShoppingBag,
  ShieldCheck,
} from "lucide-react";
import type { ListingWithImages } from "@/lib/listings";
import { conditionLabel, daysSince } from "@/lib/listings";
import { getListingImageUrl } from "@/lib/storage";
import { formatBRL, formatCentsBRL } from "@/lib/format";
import { toCentsFromBRL } from "@/lib/cart/types";
import { useCart } from "@/lib/cart/cart-context";
import {
  isVariantUnavailable,
  madeToOrderLabel,
} from "@/lib/official-store";
import { EquipmentVisual } from "@/components/reforma/equipment-visual";
import { AdSlot } from "@/components/reforma/ad-slot";
import type { Database } from "@/lib/supabase/types";

type Banner = {
  id: string;
  image_url: string;
  link_url: string | null;
  alt_text: string;
};

type ListingVariant = Database["public"]["Tables"]["listing_variants"]["Row"];

function officialWhatsappUrl(message: string): string | null {
  const raw = process.env.NEXT_PUBLIC_OFFICIAL_WHATSAPP?.trim();
  if (!raw) return null;
  const phone = raw.replace(/\D/g, "");
  if (phone.length < 10) return null;
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

export function ListingDetailView({
  listing,
  vendorName,
  vendorVerified,
  banners = [],
  variants = [],
}: {
  listing: ListingWithImages & { is_featured?: boolean };
  vendorName?: string | null;
  vendorVerified?: boolean;
  banners?: Banner[];
  variants?: ListingVariant[];
}) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [structureColor, setStructureColor] = useState<string>("");
  const [upholsteryColor, setUpholsteryColor] = useState<string>("");
  const { addItem } = useCart();

  const images = [...(listing.listing_images ?? [])].sort((a, b) => a.position - b.position);
  const days = daysSince(listing.published_at);
  const activeVariants = variants.filter((v) => v.active);

  const structureOptions = useMemo(() => {
    const set = new Set(
      activeVariants.map((v) => v.structure_color).filter(Boolean) as string[]
    );
    return Array.from(set);
  }, [activeVariants]);

  const upholsteryOptions = useMemo(() => {
    const filtered = structureColor
      ? activeVariants.filter((v) => v.structure_color === structureColor)
      : activeVariants;
    const set = new Set(
      filtered.map((v) => v.upholstery_color).filter(Boolean) as string[]
    );
    return Array.from(set);
  }, [activeVariants, structureColor]);

  const hasVariants = activeVariants.length > 0;
  const selectionComplete =
    (!structureOptions.length || Boolean(structureColor)) &&
    (!upholsteryOptions.length || Boolean(upholsteryColor));

  const selectedVariant = useMemo(() => {
    if (!activeVariants.length || !selectionComplete) return null;
    return (
      activeVariants.find(
        (v) =>
          (!structureColor || v.structure_color === structureColor) &&
          (!upholsteryColor || v.upholstery_color === upholsteryColor)
      ) ?? null
    );
  }, [
    activeVariants,
    selectionComplete,
    structureColor,
    upholsteryColor,
  ]);

  const baseCanBuy =
    listing.has_fixed_price && listing.price != null && Number(listing.price) > 0;

  const unitPriceCents = selectedVariant
    ? selectedVariant.price_cents
    : !hasVariants && baseCanBuy
      ? toCentsFromBRL(Number(listing.price))
      : 0;

  const outOfStock =
    selectedVariant != null &&
    isVariantUnavailable({
      stockQty: selectedVariant.stock_qty,
      isMadeToOrder: selectedVariant.is_made_to_order,
    });

  const showMadeToOrder =
    selectedVariant != null && selectedVariant.is_made_to_order;

  const canAddToCart = hasVariants
    ? Boolean(selectedVariant) && unitPriceCents > 0 && !outOfStock
    : baseCanBuy;

  const waUrl = officialWhatsappUrl(
    `Olá! Tenho interesse no produto ${listing.title} (${listing.slug}) da Loja Oficial Metalife Pilates.`
  );

  const handleAddToCart = () => {
    if (!canAddToCart) return;
    if (hasVariants && !selectedVariant) return;

    const firstImage = images[0];
    addItem({
      listingId: listing.id,
      variantId: selectedVariant?.id ?? null,
      vendorId: listing.vendor_id,
      vendorName: vendorName ?? "Metalife Pilates",
      title: listing.title,
      slug: listing.slug,
      unitPriceCents,
      imageUrl: firstImage ? getListingImageUrl(firstImage.storage_path) : null,
      variant: selectedVariant
        ? {
            structure_color: selectedVariant.structure_color,
            upholstery_color: selectedVariant.upholstery_color,
            sku: selectedVariant.sku,
            str_code: selectedVariant.str_code,
            stf_code: selectedVariant.stf_code,
            protheus_code: selectedVariant.protheus_code,
            is_made_to_order: selectedVariant.is_made_to_order,
            production_days: selectedVariant.production_days,
          }
        : null,
    });
  };

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-6 md:py-8">
      <nav className="mb-4 flex items-center gap-1 text-label-bold text-[var(--text-muted)]">
        <Link href="/" className="hover:text-[var(--ink)]">
          Home
        </Link>
        <ChevronRight className="h-3 w-3" />
        <Link href="/catalogo" className="hover:text-[var(--ink)]">
          {listing.equipment_type}
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-[var(--ink)] truncate max-w-[200px]">
          {listing.title}
        </span>
      </nav>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="lg:col-span-8 flex flex-col gap-2">
          <div className="relative border border-[var(--line)] aspect-[4/3] overflow-hidden bg-[var(--bg-section)]">
            {images[activeIdx] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={getListingImageUrl(images[activeIdx].storage_path)}
                alt={listing.title}
                className="h-full w-full object-cover"
              />
            ) : (
              <EquipmentVisual
                equipment={listing.equipment_type}
                title={listing.title}
                className="h-full w-full"
              />
            )}
            {listing.is_featured && (
              <div className="absolute top-4 left-4 bg-primary text-white px-2 py-1 text-label-bold uppercase rounded-md">
                Destaque
              </div>
            )}
          </div>
          {images.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {images.slice(0, 4).map((img, i) => (
                <button
                  key={img.storage_path}
                  type="button"
                  onClick={() => setActiveIdx(i)}
                  className={`aspect-square overflow-hidden border-2 transition ${
                    activeIdx === i
                      ? "border-primary"
                      : "border-[var(--line)] opacity-70 hover:opacity-100"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={getListingImageUrl(img.storage_path)}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="lg:col-span-4 flex flex-col gap-4 lg:sticky lg:top-[100px] lg:self-start">
          <div className="border border-[var(--line)] bg-white p-6 flex flex-col gap-4 rounded-md">
            <div>
              <h1 className="font-display text-2xl font-bold uppercase leading-tight text-[var(--ink)] md:text-3xl">
                {listing.title}
              </h1>
              <div className="mt-2 flex items-center gap-2 flex-wrap">
                {vendorVerified && (
                  <span className="flex items-center gap-1 text-label-bold text-primary">
                    <ShieldCheck className="h-4 w-4" />
                    Loja Oficial Metalife
                  </span>
                )}
                <span className="text-label-bold text-[var(--text-muted)]">
                  {listing.city}, {listing.state}
                </span>
              </div>
            </div>

            <div className="border-y border-[var(--line)] py-4">
              {unitPriceCents > 0 ? (
                <div
                  className="font-display text-5xl font-extrabold tracking-tight text-primary"
                  style={{ letterSpacing: "-0.04em" }}
                >
                  {formatCentsBRL(unitPriceCents)}
                </div>
              ) : baseCanBuy && listing.price ? (
                <div
                  className="font-display text-5xl font-extrabold tracking-tight text-primary"
                  style={{ letterSpacing: "-0.04em" }}
                >
                  {formatBRL(listing.price)}
                </div>
              ) : (
                <div className="font-display text-2xl font-extrabold text-primary">
                  Sob consulta
                </div>
              )}
              {selectedVariant?.sku && (
                <p className="mt-2 text-xs text-[var(--text-muted)]">
                  SKU: <strong>{selectedVariant.sku}</strong>
                </p>
              )}
              {showMadeToOrder && (
                <p className="mt-2 text-sm font-semibold text-primary">
                  {madeToOrderLabel(selectedVariant?.production_days)}
                </p>
              )}
              {outOfStock && (
                <p className="mt-2 text-sm font-semibold text-[var(--danger)]">
                  Variação sem estoque
                </p>
              )}
            </div>

            {hasVariants && (
              <div className="space-y-3">
                {structureOptions.length > 0 && (
                  <div>
                    <label className="text-label-bold text-[var(--text-muted)] block mb-1.5">
                      Cor da Estrutura (STR)
                    </label>
                    <select
                      className="w-full rounded-md border border-[var(--line)] px-3 py-2.5 text-sm outline-none focus:border-primary"
                      value={structureColor}
                      onChange={(e) => {
                        setStructureColor(e.target.value);
                        setUpholsteryColor("");
                      }}
                    >
                      <option value="">Selecione</option>
                      {structureOptions.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                {upholsteryOptions.length > 0 && (
                  <div>
                    <label className="text-label-bold text-[var(--text-muted)] block mb-1.5">
                      Cor do Estofado (STF)
                    </label>
                    <select
                      className="w-full rounded-md border border-[var(--line)] px-3 py-2.5 text-sm outline-none focus:border-primary"
                      value={upholsteryColor}
                      onChange={(e) => setUpholsteryColor(e.target.value)}
                    >
                      <option value="">Selecione</option>
                      {upholsteryOptions.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                {selectedVariant && (
                  <p className="text-xs text-[var(--text-muted)]">
                    {[
                      selectedVariant.protheus_code &&
                        `Protheus: ${selectedVariant.protheus_code}`,
                      selectedVariant.str_code && `STR: ${selectedVariant.str_code}`,
                      selectedVariant.stf_code && `STF: ${selectedVariant.stf_code}`,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                )}
              </div>
            )}

            <div className="flex flex-col gap-2">
              {canAddToCart ? (
                <button
                  type="button"
                  onClick={handleAddToCart}
                  className="flex w-full items-center justify-center gap-2 rounded-md bg-primary py-4 font-display text-base font-extrabold uppercase tracking-widest text-white transition hover:bg-[var(--action-dark)] active:scale-[0.98]"
                >
                  <ShoppingBag className="h-5 w-5" />
                  Adicionar ao Carrinho
                </button>
              ) : (
                <p className="rounded-md bg-[var(--bg-section)] px-3 py-2 text-xs text-[var(--text-muted)]">
                  {hasVariants
                    ? "Selecione a variação disponível para comprar."
                    : "Produto sob consulta — fale com um especialista Metalife."}
                </p>
              )}

              {waUrl ? (
                <a
                  href={waUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex w-full items-center justify-center gap-2 rounded-md border border-[var(--line)] bg-white py-3.5 font-display text-sm font-bold uppercase tracking-wider text-[var(--ink)] transition hover:border-primary hover:text-primary active:scale-[0.98]"
                >
                  <MessageCircle className="h-4 w-4" />
                  Falar com Especialista
                </a>
              ) : (
                <p className="text-center text-xs text-[var(--text-muted)]">
                  WhatsApp comercial em configuração.
                </p>
              )}
            </div>

            <div className="flex flex-col gap-2 pt-2 text-sm">
              <DetailRow label="Condição" value={conditionLabel(listing.condition)} />
              {listing.year && (
                <DetailRow label="Ano" value={String(listing.year)} />
              )}
              <DetailRow
                label="Publicado"
                value={
                  days === 0 ? "Hoje" : `Há ${days} ${days === 1 ? "dia" : "dias"}`
                }
              />
            </div>
          </div>

          <div className="border border-[var(--line)] bg-[var(--bg-section)] p-4 flex items-center gap-3 rounded-md">
            <div className="w-10 h-10 bg-primary-100 flex items-center justify-center font-bold text-primary text-sm rounded-md">
              M
            </div>
            <div>
              <div className="text-label-bold text-[var(--ink)]">
                Loja Oficial Metalife Pilates
              </div>
              <div className="text-xs text-[var(--text-muted)]">Venda direta de fábrica</div>
            </div>
          </div>
        </div>
      </div>

      {listing.description && (
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8">
            <h2 className="font-display text-lg font-bold uppercase border-b-4 border-primary inline-block mb-4 pb-1">
              Descrição
            </h2>
            <div className="bg-[var(--bg-section)] border-l-4 border-primary p-4 rounded-md">
              <p className="text-base leading-relaxed text-[var(--ink-soft)] whitespace-pre-line">
                {listing.description}
              </p>
            </div>
          </div>
        </div>
      )}

      {banners.length > 0 && (
        <div className="mt-8 py-6">
          <AdSlot banners={banners} orientation="horizontal" />
        </div>
      )}
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center border-b border-[var(--line)] pb-1">
      <span className="text-[var(--text-muted)] text-xs">{label}</span>
      <span className="font-bold text-xs uppercase">{value}</span>
    </div>
  );
}
