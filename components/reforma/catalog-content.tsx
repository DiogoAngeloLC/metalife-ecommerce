"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, ChevronRight, SlidersHorizontal, X } from "lucide-react";
import type { ListingWithImages } from "@/lib/listings";
import { formatBRL } from "@/lib/format";
import { getListingImageUrl } from "@/lib/storage";
import { EquipmentVisual } from "@/components/reforma/equipment-visual";
import { AdSlot } from "@/components/reforma/ad-slot";
import { SiteFooter } from "@/components/reforma/site-footer";
import type { FooterConfig } from "@/lib/site-config";

const CATEGORIES = [
  { value: "", label: "Todos" },
  { value: "reformer", label: "Reformer" },
  { value: "cadillac", label: "Cadillac" },
  { value: "wall-unit", label: "Wall Unit" },
  { value: "chair", label: "Chair" },
  { value: "barrel", label: "Barrel" },
  { value: "acessorios", label: "Acessórios" },
];

const SORT_OPTIONS = [
  { value: "recentes", label: "Mais recentes" },
  { value: "preco_asc", label: "Menor preço" },
  { value: "preco_desc", label: "Maior preço" },
];

const STATES = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG",
  "PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO",
];

type Banner = {
  id: string;
  image_url: string;
  link_url: string | null;
  alt_text: string;
};

export function CatalogContent({
  listings,
  banners,
  filters,
  footer,
}: {
  listings: ListingWithImages[];
  banners: Banner[];
  filters: { categoria?: string; ordem?: string; busca?: string; estado?: string };
  footer: FooterConfig;
}) {
  const router = useRouter();
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [busca, setBusca] = useState(filters.busca ?? "");

  function applyFilters(updates: Record<string, string>) {
    const params = new URLSearchParams();
    const merged = { ...filters, ...updates };
    Object.entries(merged).forEach(([k, v]) => {
      if (v) params.set(k, v);
    });
    router.push(`/catalogo?${params.toString()}`);
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    applyFilters({ busca });
  }

  const filteredByState = filters.estado
    ? listings.filter((l) => l.state === filters.estado)
    : listings;

  return (
    <div>
      {/* Breadcrumb */}
      <div className="border-b border-[var(--line)] bg-[var(--bg-section)]">
        <div className="mx-auto max-w-[1200px] px-4 py-2 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
          <Link href="/" className="hover:text-[var(--ink)]">Home</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-[var(--ink)]">Catálogo</span>
        </div>
      </div>

      {/* Mobile filter toggle */}
      <div className="lg:hidden border-b border-[var(--line)] bg-white">
        <div className="mx-auto max-w-[1200px] px-4 py-3 flex items-center justify-between">
          <span className="text-label-bold text-[var(--ink)]">{filteredByState.length} equipamentos</span>
          <button
            type="button"
            onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
            className="flex items-center gap-1.5 text-label-bold text-[var(--action)]"
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filtros
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-[1200px] px-4 py-6">
        <div className="flex gap-6">
          {/* SIDEBAR — FILTERS */}
          <aside className={`w-60 flex-shrink-0 ${mobileFiltersOpen ? "fixed inset-0 z-50 bg-white p-6 overflow-y-auto" : "hidden lg:block"}`}>
            {mobileFiltersOpen && (
              <div className="flex items-center justify-between mb-6">
                <span className="font-display text-lg font-bold uppercase">Filtros</span>
                <button type="button" onClick={() => setMobileFiltersOpen(false)}>
                  <X className="h-5 w-5" />
                </button>
              </div>
            )}

            {/* Search */}
            <form onSubmit={handleSearch} className="mb-6">
              <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] block mb-2">
                Busca
              </label>
              <div className="flex border border-[var(--line)]">
                <input
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  placeholder="Marca, modelo..."
                  className="flex-1 px-3 py-2 text-sm outline-none bg-white"
                />
                <button type="submit" className="px-3 bg-[var(--bg-section)] border-l border-[var(--line)]">
                  <Search className="h-4 w-4 text-[var(--ink-soft)]" />
                </button>
              </div>
            </form>

            {/* Categories */}
            <div className="mb-6">
              <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] block mb-2">
                Categoria
              </label>
              <div className="space-y-1">
                {CATEGORIES.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => applyFilters({ categoria: c.value })}
                    className={`block w-full text-left px-3 py-1.5 text-sm transition ${
                      (filters.categoria ?? "") === c.value
                        ? "bg-[var(--action)] text-white font-bold"
                        : "text-[var(--ink-soft)] hover:bg-[var(--bg-section)]"
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            {/* State */}
            <div className="mb-6">
              <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] block mb-2">
                Estado (UF)
              </label>
              <select
                value={filters.estado ?? ""}
                onChange={(e) => applyFilters({ estado: e.target.value })}
                className="w-full border border-[var(--line)] px-3 py-2 text-sm outline-none bg-white"
              >
                <option value="">Todos</option>
                {STATES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            {/* Sort */}
            <div className="mb-6">
              <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] block mb-2">
                Ordenar por
              </label>
              <div className="space-y-1">
                {SORT_OPTIONS.map((o) => (
                  <button
                    key={o.value}
                    type="button"
                    onClick={() => applyFilters({ ordem: o.value })}
                    className={`block w-full text-left px-3 py-1.5 text-sm transition ${
                      (filters.ordem ?? "recentes") === o.value
                        ? "bg-[var(--ink)] text-white font-bold"
                        : "text-[var(--ink-soft)] hover:bg-[var(--bg-section)]"
                    }`}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </div>

            {mobileFiltersOpen && (
              <button
                type="button"
                onClick={() => setMobileFiltersOpen(false)}
                className="w-full bg-[var(--action)] text-white py-3 font-display text-sm font-bold uppercase tracking-wider mt-4"
              >
                Ver resultados ({filteredByState.length})
              </button>
            )}
          </aside>

          {/* CENTER — GRID */}
          <main className="flex-1 min-w-0">
            <div className="hidden lg:flex items-center justify-between mb-4 border-b border-[var(--line)] pb-2">
              <h1 className="font-display text-xl font-bold uppercase">
                {filters.categoria
                  ? CATEGORIES.find((c) => c.value === filters.categoria)?.label ?? "Catálogo"
                  : "Todos os equipamentos"}
              </h1>
              <span className="text-label-bold text-[var(--text-muted)]">
                {filteredByState.length} {filteredByState.length === 1 ? "resultado" : "resultados"}
              </span>
            </div>

            {filteredByState.length === 0 ? (
              <div className="border border-dashed border-[var(--line)] p-12 text-center">
                <div className="font-display text-xl uppercase mb-2">Nenhum resultado</div>
                <p className="text-sm text-[var(--text-muted)]">
                  Tente buscar com outros termos ou remova filtros.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
                {filteredByState.map((l) => (
                  <CatalogCard key={l.id} listing={l} />
                ))}
              </div>
            )}
          </main>

          {/* RIGHT — AD BANNERS */}
          <aside className="hidden xl:block w-60 flex-shrink-0">
            <AdSlot banners={banners} orientation="vertical" />
          </aside>
        </div>
      </div>

      <SiteFooter footer={footer} />
    </div>
  );
}

function CatalogCard({ listing }: { listing: ListingWithImages }) {
  const sortedImages = [...(listing.listing_images ?? [])].sort((a, b) => a.position - b.position);
  const firstImage = sortedImages[0]?.storage_path;

  return (
    <Link
      href={`/${listing.slug}`}
      className="group border border-[var(--line)] bg-white transition-colors hover:border-[var(--action)]"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-[var(--bg-section)]">
        {firstImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={getListingImageUrl(firstImage)}
            alt={listing.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <EquipmentVisual
            equipment={listing.equipment_type}
            title={listing.title}
            className="w-full h-full"
          />
        )}
        {listing.is_featured && (
          <div className="absolute top-2 left-2 bg-[var(--action)] text-white px-2 py-1 text-[10px] font-bold uppercase tracking-wider">
            Destaque
          </div>
        )}
      </div>
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
              Sob consulta
            </span>
          )}
        </div>
        <div className="mt-3 w-full bg-[var(--ink)] py-2 text-center text-[10px] font-bold uppercase tracking-widest text-white transition-colors group-hover:bg-[var(--action)]">
          Ver produto
        </div>
      </div>
    </Link>
  );
}
