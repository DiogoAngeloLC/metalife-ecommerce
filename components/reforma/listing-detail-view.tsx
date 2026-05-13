"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronRight, Clock, ShieldCheck, MessageSquare } from "lucide-react";
import type { ListingWithImages } from "@/lib/listings";
import { conditionLabel, daysSince, listingAccent } from "@/lib/listings";
import { getListingImageUrl } from "@/lib/storage";
import { formatBRL } from "@/lib/format";
import { EquipmentVisual } from "@/components/reforma/equipment-visual";
import { ContactLeadDialog } from "@/components/reforma/contact-lead-dialog";
import { AdSlot } from "@/components/reforma/ad-slot";

type Banner = {
  id: string;
  image_url: string;
  link_url: string | null;
  alt_text: string;
};

export function ListingDetailView({
  listing,
  vendorName,
  vendorVerified,
  recentLeadsCount,
  banners = [],
}: {
  listing: ListingWithImages & { is_featured?: boolean };
  vendorName?: string | null;
  vendorVerified?: boolean;
  recentLeadsCount?: number;
  banners?: Banner[];
}) {
  const [contactOpen, setContactOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);

  const images = [...listing.listing_images].sort((a, b) => a.position - b.position);
  const accent = listingAccent(listing.id);
  const days = daysSince(listing.published_at);

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-6 md:py-8">
      {/* Breadcrumb */}
      <nav className="mb-4 flex items-center gap-1 text-label-bold text-[var(--text-muted)]">
        <Link href="/" className="hover:text-[var(--ink)]">Home</Link>
        <ChevronRight className="h-3 w-3" />
        <Link href="/" className="hover:text-[var(--ink)]">{listing.equipment_type}</Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-[var(--ink)] truncate max-w-[200px]">{listing.title}</span>
      </nav>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* GALLERY — 8 cols */}
        <div className="lg:col-span-8 flex flex-col gap-2">
          <div className="relative border border-[var(--line)] aspect-[4/3] overflow-hidden bg-[var(--bg-section)]">
            {images[activeIdx] ? (
              <img
                src={getListingImageUrl(images[activeIdx].storage_path)}
                alt={listing.title}
                className="h-full w-full object-cover"
              />
            ) : (
              <EquipmentVisual
                equipment={listing.equipment_type}
                accent={accent}
                className="h-full w-full"
              />
            )}
            {listing.is_featured && (
              <div className="absolute top-4 left-4 bg-[var(--action)] text-white px-2 py-1 text-label-bold uppercase">
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
                      ? "border-[var(--action)]"
                      : "border-[var(--line)] opacity-70 hover:opacity-100"
                  }`}
                >
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

        {/* INFO — 4 cols */}
        <div className="lg:col-span-4 flex flex-col gap-4 lg:sticky lg:top-[100px] lg:self-start">
          <div className="border border-[var(--line)] bg-white p-6 flex flex-col gap-4">
            <div>
              <h1 className="font-display text-2xl font-bold uppercase leading-tight text-[var(--ink)] md:text-3xl">
                {listing.title}
              </h1>
              <div className="mt-2 flex items-center gap-2 flex-wrap">
                {vendorVerified && (
                  <span className="flex items-center gap-1 text-label-bold text-[var(--trust)]">
                    <ShieldCheck className="h-4 w-4" />
                    Vendedor verificado
                  </span>
                )}
                <span className="text-label-bold text-[var(--text-muted)]">
                  {listing.city}, {listing.state}
                </span>
              </div>
            </div>

            {/* Price */}
            <div className="border-y border-[var(--line)] py-4">
              {listing.has_fixed_price && listing.price ? (
                <>
                  <div className="font-display text-5xl font-extrabold tracking-tight text-[var(--action)]" style={{ letterSpacing: "-0.04em" }}>
                    {formatBRL(listing.price)}
                  </div>
                  {listing.is_negotiable && (
                    <div className="mt-1 text-sm text-[var(--ink-soft)]">Negociável</div>
                  )}
                </>
              ) : (
                <div className="font-display text-4xl font-extrabold text-[var(--action)]">A combinar</div>
              )}
              {(recentLeadsCount ?? 0) >= 3 && (
                <div className="mt-2 text-label-bold text-[var(--danger)] flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {recentLeadsCount} pessoas interessadas hoje
                </div>
              )}
            </div>

            {/* CTAs */}
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => setContactOpen(true)}
                className="w-full bg-[var(--action)] py-4 font-display text-base font-extrabold uppercase tracking-widest text-white transition hover:bg-[var(--action-dark)] active:scale-[0.98]"
              >
                Ver contato
              </button>
              <button
                type="button"
                disabled
                className="w-full border border-[var(--line)] py-4 font-display text-base font-bold uppercase tracking-wide text-[var(--ink)] transition hover:bg-[var(--bg-section)]"
              >
                <span className="flex items-center justify-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Mensagem
                </span>
              </button>
            </div>

            {/* Details table */}
            <div className="flex flex-col gap-2 pt-2 text-sm">
              <DetailRow label="Condição" value={conditionLabel(listing.condition)} />
              {listing.year && <DetailRow label="Ano" value={String(listing.year)} />}
              <DetailRow label="Publicado" value={days === 0 ? "Hoje" : `Há ${days} ${days === 1 ? "dia" : "dias"}`} />
              <DetailRow label="ID" value={`#${listing.id.slice(0, 8).toUpperCase()}`} />
            </div>
          </div>

          {/* Seller card */}
          {vendorName && (
            <div className="border border-[var(--line)] bg-[var(--bg-section)] p-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-[var(--trust-light)] flex items-center justify-center font-bold text-[var(--trust)] text-sm">
                {vendorName.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="text-label-bold text-[var(--ink)]">{vendorName}</div>
                <div className="text-xs text-[var(--text-muted)]">Vendedor</div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Description */}
      {listing.description && (
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8">
            <h2 className="font-display text-lg font-bold uppercase border-b-4 border-[var(--action)] inline-block mb-4 pb-1">
              Descrição do vendedor
            </h2>
            <div className="bg-[var(--bg-section)] border-l-4 border-[var(--trust)] p-4">
              <p className="text-base leading-relaxed text-[var(--ink-soft)] whitespace-pre-line">
                {listing.description}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Banner ad slot */}
      {banners.length > 0 && (
        <div className="mt-8 py-6">
          <AdSlot banners={banners} orientation="horizontal" />
        </div>
      )}

      <ContactLeadDialog
        listing={listing}
        open={contactOpen}
        onOpenChange={setContactOpen}
        recentLeadsCount={recentLeadsCount}
      />
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
