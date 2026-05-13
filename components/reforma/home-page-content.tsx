"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { MapPin, Search, ShieldCheck, MessageCircle, Smartphone } from "lucide-react";
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

import type { FooterConfig } from "@/lib/site-config";

export function HomePageContent({
  listings,
  stats,
  hero,
  footer,
}: {
  listings: (ListingWithImages & { is_featured?: boolean; recentLeadsCount?: number })[];
  stats: { listings: number; cities: number; vendors: number };
  hero?: { image_url: string | null; eyebrow: string; title: string; subtitle: string };
  footer: FooterConfig;
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
      <section className="relative bg-[var(--bg-dark)] overflow-hidden">
        {hero?.image_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={hero.image_url} alt="" className="absolute inset-0 w-full h-full object-cover" />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-[var(--bg-dark)]/90 to-transparent z-[1]" />
        <div className="relative z-10 mx-auto max-w-[1200px] px-4 py-16 md:py-24">
          <div className="max-w-2xl">
            <div className="inline-block bg-[var(--action)] text-white px-3 py-1 text-label-bold uppercase mb-4">
              {hero?.eyebrow ?? "Marketplace de equipamentos profissionais"}
            </div>
            <h1 className="font-display text-4xl font-black italic uppercase leading-tight text-white md:text-6xl">
              {hero?.title ?? "O encontro entre quem vende e quem precisa."}
            </h1>
            <p className="mt-6 max-w-md text-base text-[var(--on-dark-soft)]">
              {hero?.subtitle ?? "Reformers, Cadillacs, Chairs e acessórios. Anúncios verificados, contato direto pelo WhatsApp."}
            </p>
            <div className="mt-8 flex gap-3">
              <Link
                href="#equipamentos"
                className="bg-[var(--action)] px-8 py-3 font-display text-sm font-bold uppercase tracking-widest text-white transition hover:bg-[var(--action-dark)] active:scale-95"
              >
                Ver ofertas
              </Link>
            </div>
            <div className="mt-8 flex gap-8">
              <div>
                <div className="font-display text-3xl font-extrabold text-[var(--action)]">{stats.listings}</div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--on-dark-soft)]">Anúncios</div>
              </div>
              <div>
                <div className="font-display text-3xl font-extrabold text-white">{stats.cities}</div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--on-dark-soft)]">Cidades</div>
              </div>
              <div>
                <div className="font-display text-3xl font-extrabold text-white">{stats.vendors}</div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--on-dark-soft)]">Estúdios</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CATEGORY CHIPS + SEARCH */}
      <section
        id="filtros"
        className="sticky top-[57px] z-20 border-b border-[var(--line)] bg-white"
      >
        <div className="mx-auto flex max-w-[1200px] items-center gap-3 overflow-x-auto px-4 py-3 scrollbar-hide">
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
              className={`whitespace-nowrap border px-4 py-1.5 text-label-bold uppercase transition ${
                filter === t
                  ? "border-[var(--action)] bg-[var(--action)] text-white"
                  : "border-[var(--line)] text-[var(--ink-soft)] hover:bg-[var(--bg-section)]"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </section>

      {/* GRID */}
      <section id="equipamentos" className="mx-auto max-w-[1200px] px-4 py-8 md:py-12">
        <div className="mb-6 flex items-center justify-between border-b border-[var(--line)] pb-2">
          <h3 className="font-display text-xl font-bold uppercase">
            Equipamentos em destaque
          </h3>
          <span className="text-label-bold text-[var(--action)] cursor-pointer hover:underline">
            Ver todos ({visible.length})
          </span>
        </div>

        {visible.length === 0 ? (
          <div className="border border-dashed border-[var(--line)] p-12 text-center">
            <div className="font-display text-xl uppercase mb-2">
              {listings.length === 0 ? "Em breve, novos anúncios" : "Nenhum resultado"}
            </div>
            <p className="text-sm text-[var(--text-muted)]">
              {listings.length === 0
                ? "Estamos começando agora. Volte em breve."
                : "Tente buscar com outros termos."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {visible.map((l) => (
              <ListingCard key={l.id} listing={l} />
            ))}
          </div>
        )}
      </section>

      {/* TRUST BADGES */}
      <section className="bg-[var(--bg-section)] border-y border-[var(--line)]">
        <div className="mx-auto grid max-w-[1200px] grid-cols-1 gap-4 px-4 py-8 md:grid-cols-3">
          <TrustBadge
            icon={<ShieldCheck className="h-8 w-8 text-[var(--action)]" />}
            title="Anúncios verificados"
            desc="Curadoria aprova cada anúncio antes de publicar."
          />
          <TrustBadge
            icon={<MessageCircle className="h-8 w-8 text-[var(--action)]" />}
            title="Contato direto"
            desc="Sem intermediação, fale direto com o vendedor."
          />
          <TrustBadge
            icon={<Smartphone className="h-8 w-8 text-[var(--action)]" />}
            title="Tudo pelo WhatsApp"
            desc="Receba o contato em segundos no seu celular."
          />
        </div>
      </section>

      <SiteFooter footer={footer} />
    </div>
  );
}

function TrustBadge({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="flex items-start gap-4 p-4">
      {icon}
      <div>
        <h5 className="text-label-bold text-[var(--ink)]">{title}</h5>
        <p className="text-xs text-[var(--ink-soft)] opacity-70 mt-1">{desc}</p>
      </div>
    </div>
  );
}

function ListingCard({ listing }: { listing: ListingWithImages & { is_featured?: boolean; recentLeadsCount?: number } }) {
  const sortedImages = [...listing.listing_images].sort((a, b) => a.position - b.position);
  const firstImage = sortedImages[0]?.storage_path;
  const accent = listingAccent(listing.id);
  const isUrgent = (listing.recentLeadsCount ?? 0) >= 3;

  return (
    <Link
      href={`/${listing.slug}`}
      className="group border border-[var(--line)] bg-white transition-colors hover:border-[var(--action)]"
    >
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden bg-[var(--bg-section)]">
        {firstImage ? (
          <img
            src={getListingImageUrl(firstImage)}
            alt={listing.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <EquipmentVisual
            equipment={listing.equipment_type}
            accent={accent}
            className="w-full h-full"
          />
        )}
        {listing.is_featured && (
          <div className="absolute top-2 left-2 bg-[var(--action)] text-white px-2 py-1 text-[10px] font-bold uppercase tracking-wider">
            Destaque
          </div>
        )}
        {!listing.is_featured && isUrgent && (
          <div className="absolute top-2 left-2 bg-[var(--action)] text-white px-2 py-1 text-[10px] font-bold uppercase tracking-wider">
            Urgente
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4">
        {listing.brand && (
          <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--trust)] block mb-1">
            {listing.brand}
          </span>
        )}
        <h4 className="font-display text-sm font-bold text-[var(--ink)] line-clamp-2 h-10 leading-tight">
          {listing.title}
        </h4>
        <div className="mt-3">
          {listing.has_fixed_price && listing.price ? (
            <span className="font-display text-2xl font-extrabold text-[var(--action)]">
              {formatBRL(listing.price)}
            </span>
          ) : (
            <span className="font-display text-lg font-bold text-[var(--action)]">
              A combinar
            </span>
          )}
        </div>
        <div className="mt-2 flex items-center gap-1 text-[var(--text-muted)]">
          <MapPin className="h-3 w-3" />
          <span className="text-[10px] font-bold uppercase tracking-wider">
            {listing.city}, {listing.state}
          </span>
        </div>
        <div className="mt-3 w-full bg-[var(--ink)] py-2 text-center text-[10px] font-bold uppercase tracking-widest text-white transition-colors group-hover:bg-[var(--action)]">
          Ver oferta
        </div>
      </div>
    </Link>
  );
}
