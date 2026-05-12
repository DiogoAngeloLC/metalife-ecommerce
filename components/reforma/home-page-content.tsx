"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { MapPin, Search } from "lucide-react";
import {
  EQUIPMENT_FILTERS,
  filterListings,
  listingAccent,
  type ListingWithImages,
} from "@/lib/listings";
import { formatBRL } from "@/lib/format";
import { getListingImageUrl } from "@/lib/storage";
import { EquipmentVisual } from "@/components/reforma/equipment-visual";
import { SiteFooter } from "@/components/reforma/site-footer";

const steps = [
  {
    n: "01",
    t: "Anuncie seu equipamento",
    d: "Cadastre fotos, descrição, cidade e valor. Seu telefone fica oculto.",
  },
  {
    n: "02",
    t: "Compradores demonstram interesse",
    d: "Quem quer saber valores deixa nome, WhatsApp e e-mail.",
  },
  {
    n: "03",
    t: "Contato direto via WhatsApp",
    d: "O comprador recebe seus dados no WhatsApp e fala diretamente com você.",
  },
];

export function HomePageContent({
  listings,
  stats,
}: {
  listings: ListingWithImages[];
  stats: { listings: number; cities: number; vendors: number };
}) {
  const [filter, setFilter] = useState<string>("todos");
  const [search, setSearch] = useState("");

  const visible = useMemo(
    () => filterListings(listings, filter, search),
    [listings, filter, search]
  );

  return (
    <div>
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="mx-auto max-w-7xl px-5 pb-12 pt-16 md:px-8 md:pb-20 md:pt-24">
          <div className="grid items-end gap-8 md:grid-cols-12">
            <div className="anim-in md:col-span-8">
              <div className="mb-6 inline-flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-[var(--terra)]">
                <span className="h-px w-8 bg-[var(--terra)]" />
                Equipamentos para estúdios
              </div>
              <h1 className="font-display text-balance text-5xl leading-[0.95] tracking-tight md:text-7xl lg:text-8xl">
                O ponto de{" "}
                <em className="italic text-[var(--terra)]">encontro</em> entre
                <br />
                estúdios de Pilates.
              </h1>
              <p className="mt-8 max-w-xl text-lg leading-relaxed text-[var(--ink-soft)]">
                Reformers, Cadillacs, Wall Units, Chairs. Equipamentos
                profissionais usados e seminovos, direto de quem cuida — para
                quem precisa.
              </p>
            </div>
            <div
              className="anim-in hidden md:col-span-4 md:block"
              style={{ animationDelay: "0.15s" }}
            >
              <div className="rounded-3xl border border-[var(--line)] bg-[var(--bg-card)] p-8">
                <div className="grid grid-cols-3 gap-6 text-center">
                  <Stat label="Anúncios" value={stats.listings} />
                  <Stat label="Cidades" value={stats.cities} />
                  <Stat label="Estúdios" value={stats.vendors} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FILTROS */}
      <section
        id="filtros"
        className="sticky top-[81px] z-20 border-y border-[var(--line)] bg-[var(--bg-card)]"
      >
        <div className="mx-auto flex max-w-7xl items-center gap-3 overflow-x-auto px-5 py-4 scrollbar-hide md:px-8">
          <div className="mr-2 flex flex-shrink-0 items-center gap-2 border-r border-[var(--line)] pr-4">
            <Search className="h-4 w-4 flex-shrink-0 text-[var(--text-muted)]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar equipamento, marca, cidade…"
              className="w-44 flex-shrink-0 bg-transparent text-sm outline-none placeholder:text-[var(--text-muted)] md:w-56"
            />
          </div>
          {EQUIPMENT_FILTERS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setFilter(t)}
              className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm capitalize transition ${
                filter === t
                  ? "bg-[var(--ink)] text-white"
                  : "text-[var(--ink-soft)] hover:bg-[var(--bone)]"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </section>

      {/* GRID */}
      <section className="mx-auto max-w-7xl px-5 py-12 md:px-8 md:py-16">
        <div className="mb-10 flex items-end justify-between">
          <div>
            <div className="mb-2 text-xs uppercase tracking-[0.25em] text-[var(--text-muted)]">
              Em destaque
            </div>
            <h2 className="font-display text-3xl md:text-4xl">
              Anúncios recentes
            </h2>
          </div>
          <div className="hidden text-sm text-[var(--text-muted)] md:block">
            {visible.length} {visible.length === 1 ? "anúncio" : "anúncios"}
          </div>
        </div>

        {visible.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-[var(--line)] rounded-3xl">
            <div className="font-display text-2xl mb-2">
              {listings.length === 0 ? "Em breve, novos anúncios" : "Nenhum resultado"}
            </div>
            <p className="text-[var(--text-muted)] text-sm">
              {listings.length === 0
                ? "Estamos começando agora. Volte em breve."
                : "Tente buscar com outros termos."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:gap-8 lg:grid-cols-3">
            {visible.map((l, i) => (
              <ListingCard key={l.id} listing={l} index={i} />
            ))}
          </div>
        )}
      </section>

      {/* COMO FUNCIONA */}
      <section
        id="como-funciona"
        className="border-t border-[var(--line)] bg-[var(--bg-card)]"
      >
        <div className="mx-auto max-w-7xl px-5 py-16 md:px-8 md:py-24">
          <div className="mb-12 grid gap-12 md:grid-cols-12">
            <div className="md:col-span-5">
              <div className="mb-4 text-xs uppercase tracking-[0.25em] text-[var(--terra)]">
                Como funciona
              </div>
              <h2 className="font-display text-4xl leading-tight md:text-5xl">
                Seu contato fica <em className="italic">protegido</em> até você
                decidir.
              </h2>
            </div>
            <div className="md:col-span-7 md:pt-4">
              <p className="text-lg leading-relaxed text-[var(--ink-soft)]">
                Nenhum dado de contato aparece publicamente. Compradores
                interessados deixam o WhatsApp deles e recebem seus dados em
                mãos. Você recebe leads qualificados, sem spam, sem ligação
                fria.
              </p>
            </div>
          </div>
          <div className="grid gap-px overflow-hidden rounded-2xl bg-[var(--line)] md:grid-cols-3">
            {steps.map((s) => (
              <div key={s.n} className="bg-[var(--bg-card)] p-8">
                <div className="font-display mb-4 text-5xl text-[var(--terra)] opacity-30">
                  {s.n}
                </div>
                <h3 className="font-display mb-2 text-xl">{s.t}</h3>
                <p className="text-sm leading-relaxed text-[var(--ink-soft)]">
                  {s.d}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="font-display text-3xl text-[var(--terra)]">{value}</div>
      <div className="mt-1 text-xs uppercase tracking-wider text-[var(--text-muted)]">
        {label}
      </div>
    </div>
  );
}

function ListingCard({ listing, index }: { listing: ListingWithImages; index: number }) {
  const sortedImages = [...listing.listing_images].sort((a, b) => a.position - b.position);
  const firstImage = sortedImages[0]?.storage_path;
  const accent = listingAccent(listing.id);

  return (
    <Link
      href={`/${listing.slug}`}
      className="group anim-in block cursor-pointer"
      style={{ animationDelay: `${index * 0.05}s` }}
    >
      <div className="aspect-[4/5] rounded-2xl overflow-hidden mb-4 bg-[var(--bone)]">
        {firstImage ? (
          <img
            src={getListingImageUrl(firstImage)}
            alt={listing.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
          />
        ) : (
          <EquipmentVisual
            equipment={listing.equipment_type}
            accent={accent}
            className="w-full h-full transition-transform duration-500 group-hover:scale-[1.01]"
          />
        )}
      </div>
      <div className="mb-1 flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="mb-1 text-xs uppercase tracking-wider text-[var(--text-muted)]">
            {listing.brand ? `${listing.brand} · ` : ""}
            {listing.condition === "novo"
              ? "Novo"
              : listing.condition === "seminovo"
              ? "Seminovo"
              : listing.condition === "usado_bom"
              ? "Usado · Bom estado"
              : "Usado · Estado regular"}
          </div>
          <h3 className="font-display text-xl leading-tight">
            {listing.title}
          </h3>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between border-t border-[var(--line)] pt-3">
        <div className="flex items-center gap-1.5 text-sm text-[var(--ink-soft)]">
          <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
          {listing.city}, {listing.state}
        </div>
        <div className="text-right">
          {listing.has_fixed_price && listing.price ? (
            <div className="font-display text-lg text-[var(--terra)]">
              {formatBRL(listing.price)}
              {listing.is_negotiable && (
                <span className="mt-0 block text-[10px] uppercase tracking-wider text-[var(--text-muted)]">
                  negociável
                </span>
              )}
            </div>
          ) : (
            <div className="text-sm font-medium text-[var(--terra)]">
              A combinar
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
