"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Clock, MapPin, Shield } from "lucide-react";
import type { ListingWithImages } from "@/lib/listings";
import { conditionLabel, daysSince, listingAccent } from "@/lib/listings";
import { getListingImageUrl } from "@/lib/storage";
import { formatBRL } from "@/lib/format";
import { EquipmentVisual } from "@/components/reforma/equipment-visual";
import { ContactLeadDialog } from "@/components/reforma/contact-lead-dialog";

export function ListingDetailView({ listing }: { listing: ListingWithImages }) {
  const [contactOpen, setContactOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);

  const images = [...listing.listing_images].sort((a, b) => a.position - b.position);
  const accent = listingAccent(listing.id);
  const days = daysSince(listing.published_at);

  return (
    <div className="anim-in mx-auto max-w-7xl px-5 py-8 md:px-8 md:py-12">
      <Link
        href="/"
        className="mb-6 inline-flex items-center gap-2 text-sm text-[var(--ink-soft)] transition hover:text-[var(--ink)]"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar aos anúncios
      </Link>

      <div className="grid gap-8 md:grid-cols-12 md:gap-12">
        {/* GALERIA */}
        <div className="md:col-span-7">
          <div className="mb-3 aspect-[4/3] overflow-hidden rounded-3xl bg-[var(--bone)]">
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
          </div>
          {images.length > 1 && (
            <div className="grid grid-cols-5 gap-2">
              {images.slice(0, 5).map((img, i) => (
                <button
                  key={img.storage_path}
                  type="button"
                  onClick={() => setActiveIdx(i)}
                  className={`aspect-square overflow-hidden rounded-xl border-2 transition ${
                    activeIdx === i
                      ? "border-[var(--terra)]"
                      : "border-transparent opacity-60 hover:opacity-100"
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

        {/* INFO */}
        <div className="md:col-span-5">
          <div className="mb-3 text-xs uppercase tracking-[0.25em] text-[var(--text-muted)]">
            {listing.brand ? `${listing.brand} · ` : ""}
            {listing.equipment_type}
          </div>
          <h1 className="font-display mb-4 text-4xl leading-tight tracking-tight md:text-5xl">
            {listing.title}
          </h1>

          <div className="mb-6 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-[var(--bone)] px-3 py-1 text-xs text-[var(--ink-soft)]">
              {conditionLabel(listing.condition)}
            </span>
            {listing.year && (
              <span className="rounded-full bg-[var(--bone)] px-3 py-1 text-xs text-[var(--ink-soft)]">
                Ano {listing.year}
              </span>
            )}
            <span className="flex items-center gap-1.5 rounded-full bg-[var(--bone)] px-3 py-1 text-xs text-[var(--ink-soft)]">
              <MapPin className="h-3 w-3" />
              {listing.city}, {listing.state}
            </span>
          </div>

          <div className="my-6 border-y border-[var(--line)] py-6">
            {listing.has_fixed_price && listing.price ? (
              <>
                <div className="mb-1 text-xs uppercase tracking-wider text-[var(--text-muted)]">
                  Valor anunciado
                </div>
                <div className="font-display text-5xl text-[var(--terra)]">
                  {formatBRL(listing.price)}
                </div>
                {listing.is_negotiable && (
                  <div className="mt-1 text-sm text-[var(--ink-soft)]">
                    Negociável diretamente com o vendedor
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="mb-1 text-xs uppercase tracking-wider text-[var(--text-muted)]">
                  Valor
                </div>
                <div className="font-display text-4xl text-[var(--terra)]">
                  A combinar
                </div>
                <div className="mt-1 text-sm text-[var(--ink-soft)]">
                  Entre em contato para conhecer os valores
                </div>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={() => setContactOpen(true)}
            className="group flex w-full items-center justify-center gap-3 rounded-full bg-[var(--ink)] py-4 text-base font-medium text-white transition hover:bg-[var(--terra-dark)]"
          >
            Saber valores e contato
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </button>
          <div className="mt-4 flex items-center gap-2 text-xs text-[var(--text-muted)]">
            <Shield className="h-3.5 w-3.5 flex-shrink-0" />
            Você recebe os dados no seu WhatsApp em segundos.
          </div>

          {listing.description && (
            <div className="mt-8">
              <h3 className="font-display mb-3 text-xl">Sobre o equipamento</h3>
              <p className="text-[15px] leading-relaxed text-[var(--ink-soft)] whitespace-pre-line">
                {listing.description}
              </p>
            </div>
          )}

          <div className="mt-8 flex items-center gap-6 border-t border-[var(--line)] pt-6 text-sm text-[var(--text-muted)]">
            <div className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              {days === 0 ? "Publicado hoje" : `Publicado há ${days} ${days === 1 ? "dia" : "dias"}`}
            </div>
          </div>
        </div>
      </div>

      <ContactLeadDialog
        listing={listing}
        open={contactOpen}
        onOpenChange={setContactOpen}
      />
    </div>
  );
}
