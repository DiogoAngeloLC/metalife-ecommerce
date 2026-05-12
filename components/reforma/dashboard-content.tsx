"use client";

import Link from "next/link";
import { Clock, MapPin, Plus, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import type { Database } from "@/lib/supabase/types";
import { EquipmentVisual } from "./equipment-visual";
import { getListingImageUrl } from "@/lib/storage";

type Vendor = Database["public"]["Tables"]["vendors"]["Row"];
type Listing = Database["public"]["Tables"]["listings"]["Row"] & {
  listing_images: { storage_path: string; position: number }[];
};

export function DashboardContent({
  vendor,
  listings,
  stats,
  justPublished,
}: {
  vendor: Vendor;
  listings: Listing[];
  stats: { activeCount: number; pendingCount: number; leadsCount: number };
  justPublished: boolean;
}) {
  const [showToast, setShowToast] = useState(justPublished);

  useEffect(() => {
    if (justPublished) {
      const t = setTimeout(() => setShowToast(false), 4500);
      return () => clearTimeout(t);
    }
  }, [justPublished]);

  const incomplete = !vendor.onboarding_completed;
  const greetingName = vendor.name?.split(" ")[0] ?? "anunciante";

  return (
    <div className="max-w-7xl mx-auto px-5 md:px-8 py-10 md:py-14">
      {showToast && (
        <div className="fixed top-24 right-6 z-50 bg-[var(--sage)] text-white rounded-2xl px-5 py-3 shadow-lg flex items-center gap-2 anim-in">
          <Sparkles className="w-4 h-4" />
          Anúncio enviado para análise!
        </div>
      )}

      {incomplete && (
        <Link
          href="/perfil"
          className="block mb-8 bg-[var(--terra)]/8 border border-[var(--terra)]/30 rounded-2xl p-5 hover:bg-[var(--terra)]/12 transition group"
        >
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-xs uppercase tracking-wider text-[var(--terra)] mb-1">
                Complete seu perfil
              </div>
              <div className="font-display text-lg">
                Adicione seu WhatsApp para receber leads dos compradores.
              </div>
            </div>
            <span className="text-[var(--terra)] text-sm group-hover:translate-x-1 transition">
              Completar →
            </span>
          </div>
        </Link>
      )}

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
        <div>
          <div className="text-xs uppercase tracking-[0.25em] text-[var(--text-muted)] mb-2">
            Painel do anunciante
          </div>
          <h1 className="font-display text-4xl md:text-5xl capitalize">Olá, {greetingName}</h1>
          {vendor.city && vendor.state && (
            <p className="text-[var(--text-muted)] mt-2">
              {vendor.city}, {vendor.state}
            </p>
          )}
        </div>
        <Link
          href="/dashboard/novo"
          className="bg-[var(--ink)] text-white rounded-full px-6 py-3 flex items-center gap-2 hover:opacity-90 transition self-start"
        >
          <Plus className="w-4 h-4" />
          Novo anúncio
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-12 max-w-3xl">
        <StatCard label="Anúncios ativos" value={stats.activeCount.toString()} color="sage" />
        <StatCard label="Em análise" value={stats.pendingCount.toString()} color="ink" />
        <StatCard label="Leads recebidos" value={stats.leadsCount.toString()} color="terra" />
      </div>

      <div className="mb-6">
        <h2 className="font-display text-2xl">Meus anúncios</h2>
      </div>

      {listings.length === 0 ? (
        <div className="bg-[var(--bg-card)] border border-dashed border-[var(--line)] rounded-2xl p-12 text-center">
          <div className="font-display text-2xl mb-2">Você ainda não tem anúncios</div>
          <p className="text-[var(--text-muted)] mb-6">Crie seu primeiro anúncio em menos de 2 minutos.</p>
          <Link
            href="/dashboard/novo"
            className="inline-flex items-center gap-2 bg-[var(--ink)] text-white rounded-full px-6 py-3 hover:opacity-90 transition"
          >
            <Plus className="w-4 h-4" />
            Criar anúncio
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {listings.map((l) => (
            <ListingRow key={l.id} listing={l} />
          ))}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: string; color: "sage" | "terra" | "ink" }) {
  const colorMap = { sage: "var(--sage)", terra: "var(--terra)", ink: "var(--ink-soft)" };
  return (
    <div className="bg-[var(--bg-card)] border border-[var(--line)] rounded-2xl p-5">
      <div className="text-xs uppercase tracking-wider text-[var(--text-muted)] mb-3">{label}</div>
      <div className="font-display text-3xl md:text-4xl" style={{ color: colorMap[color] }}>
        {value}
      </div>
    </div>
  );
}

function ListingRow({ listing }: { listing: Listing }) {
  const firstImage = listing.listing_images
    ?.sort((a, b) => a.position - b.position)[0]?.storage_path;

  return (
    <div className="bg-[var(--bg-card)] border border-[var(--line)] rounded-2xl p-4 md:p-5 flex flex-col md:flex-row md:items-center gap-4">
      <div className="w-full md:w-24 aspect-video md:aspect-square rounded-xl overflow-hidden flex-shrink-0 bg-[var(--bone)]">
        {firstImage ? (
          <img
            src={getListingImageUrl(firstImage)}
            alt={listing.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <EquipmentVisual equipment={listing.equipment_type} accent="sage" className="w-full h-full" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          {listing.status === "active" ? (
            <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-[var(--sage)]/20 text-[var(--sage)] font-medium">
              Ativo
            </span>
          ) : listing.status === "pending_review" ? (
            <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Em análise
            </span>
          ) : listing.status === "rejected" ? (
            <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-medium">
              Rejeitado
            </span>
          ) : listing.status === "draft" ? (
            <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-[var(--bone)] text-[var(--text-muted)] font-medium">
              Rascunho
            </span>
          ) : (
            <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-[var(--bone)] text-[var(--text-muted)] font-medium">
              {listing.status}
            </span>
          )}
          <span className="text-xs text-[var(--text-muted)]">
            {listing.brand ? `${listing.brand} · ` : ""}
            {listing.equipment_type}
          </span>
        </div>
        <h3 className="font-display text-lg leading-tight truncate">{listing.title}</h3>
        {listing.status === "rejected" && listing.rejection_reason && (
          <p className="text-xs text-red-600 mt-1">Motivo: {listing.rejection_reason}</p>
        )}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-xs text-[var(--ink-soft)]">
          <span className="flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            {listing.city}, {listing.state}
          </span>
        </div>
      </div>
    </div>
  );
}
