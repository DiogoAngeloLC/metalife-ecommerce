"use client";

import Link from "next/link";
import { Clock, MapPin, Plus, Sparkles, Pencil, Archive } from "lucide-react";
import { useRouter } from "next/navigation";
import { withdrawListingToDraftAction } from "@/app/dashboard/novo/actions";
import { useEffect, useState, useTransition } from "react";
import type { Database } from "@/lib/supabase/types";
import { EquipmentVisual } from "./equipment-visual";
import { getListingImageUrl } from "@/lib/storage";
import { isListingEditableByVendor, listingAccent, canVendorWithdrawListingToDraft } from "@/lib/listings";

type Vendor = Database["public"]["Tables"]["vendors"]["Row"];
type Listing = Database["public"]["Tables"]["listings"]["Row"] & {
  listing_images: { storage_path: string; position: number }[];
};

export function DashboardContent({
  vendor,
  listings,
  stats,
  justPublished,
  justUpdated,
}: {
  vendor: Vendor;
  listings: Listing[];
  stats: { activeCount: number; pendingCount: number; leadsCount: number };
  justPublished: boolean;
  justUpdated: boolean;
}) {
  const [showToast, setShowToast] = useState(justPublished);
  const [showUpdatedToast, setShowUpdatedToast] = useState(justUpdated);

  useEffect(() => {
    if (justPublished) {
      const t = setTimeout(() => setShowToast(false), 4500);
      return () => clearTimeout(t);
    }
  }, [justPublished]);

  useEffect(() => {
    if (justUpdated) {
      const t = setTimeout(() => setShowUpdatedToast(false), 4500);
      return () => clearTimeout(t);
    }
  }, [justUpdated]);

  const incomplete = !vendor.onboarding_completed;
  const greetingName = vendor.name?.split(" ")[0] ?? "anunciante";

  return (
    <div className="max-w-[1200px] mx-auto px-4 py-8 md:py-12">
      {showToast && (
        <div className="fixed top-24 right-6 z-50 bg-[var(--success)] text-white px-5 py-3 shadow-lg flex items-center gap-2 text-label-bold">
          <Sparkles className="w-4 h-4" />
          Anúncio enviado para análise!
        </div>
      )}

      {showUpdatedToast && (
        <div
          className={`fixed right-6 z-50 bg-[var(--trust)] text-white px-5 py-3 shadow-lg flex items-center gap-2 text-label-bold ${
            showToast ? "top-40" : "top-24"
          }`}
        >
          <Sparkles className="w-4 h-4" />
          Alterações salvas — anúncio em análise novamente.
        </div>
      )}

      {incomplete && (
        <Link
          href="/perfil"
          className="block mb-8 bg-[var(--action)]/5 border border-[var(--action)] p-5 hover:bg-[var(--action)]/10 transition group"
        >
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-label-bold text-[var(--action)] mb-1">
                COMPLETE SEU PERFIL
              </div>
              <div className="text-base text-[var(--ink)]">
                Adicione seu WhatsApp para receber leads dos compradores.
              </div>
            </div>
            <span className="text-[var(--action)] text-label-bold group-hover:translate-x-1 transition">
              Completar →
            </span>
          </div>
        </Link>
      )}

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <div className="text-label-bold text-[var(--text-muted)] mb-2">
            PAINEL DO ANUNCIANTE
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-bold uppercase text-[var(--ink)]">
            Olá, {greetingName}
          </h1>
          {vendor.city && vendor.state && (
            <p className="text-sm text-[var(--text-muted)] mt-1 flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {vendor.city}, {vendor.state}
            </p>
          )}
        </div>
        <Link
          href="/dashboard/novo"
          className="bg-[var(--action)] text-white px-6 py-3 flex items-center gap-2 hover:bg-[var(--action-dark)] transition text-label-bold uppercase tracking-wider self-start"
        >
          <Plus className="w-4 h-4" />
          Novo anúncio
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-10 max-w-3xl">
        <StatCard label="Anúncios ativos" value={stats.activeCount.toString()} variant="action" />
        <StatCard label="Em análise" value={stats.pendingCount.toString()} variant="trust" />
        <StatCard label="Leads recebidos" value={stats.leadsCount.toString()} variant="ink" />
      </div>

      <div className="mb-4 border-b border-[var(--line)] pb-2">
        <h2 className="font-display text-xl font-bold uppercase">Meus anúncios</h2>
      </div>

      {listings.length === 0 ? (
        <div className="border border-dashed border-[var(--line)] p-12 text-center">
          <div className="font-display text-xl uppercase mb-2">Você ainda não tem anúncios</div>
          <p className="text-sm text-[var(--text-muted)] mb-6">Crie seu primeiro anúncio em menos de 2 minutos.</p>
          <Link
            href="/dashboard/novo"
            className="inline-flex items-center gap-2 bg-[var(--action)] text-white px-6 py-3 hover:bg-[var(--action-dark)] transition text-label-bold uppercase tracking-wider"
          >
            <Plus className="w-4 h-4" />
            Criar anúncio
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {listings.map((l) => (
            <ListingRow key={l.id} listing={l} />
          ))}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, variant }: { label: string; value: string; variant: "action" | "trust" | "ink" }) {
  const colorMap = { action: "var(--action)", trust: "var(--trust)", ink: "var(--ink-soft)" };
  return (
    <div className="bg-white border border-[var(--line)] p-5">
      <div className="text-label-bold text-[var(--text-muted)] mb-3">{label}</div>
      <div className="font-display text-3xl md:text-4xl font-extrabold" style={{ color: colorMap[variant] }}>
        {value}
      </div>
    </div>
  );
}

function ListingRow({ listing }: { listing: Listing }) {
  const router = useRouter();
  const [rowPending, startRowTransition] = useTransition();
  const firstImage = listing.listing_images
    ?.sort((a, b) => a.position - b.position)[0]?.storage_path;
  const accent = listingAccent(listing.id);

  const withdrawToDraft = () => {
    if (
      !confirm(
        "Guardar como rascunho? O anúncio sai do catálogo e deixa de aparecer para a equipe. Pode editar e enviar de novo quando quiser."
      )
    ) {
      return;
    }
    startRowTransition(async () => {
      try {
        await withdrawListingToDraftAction(listing.id);
        router.refresh();
      } catch (err) {
        alert(err instanceof Error ? err.message : "Erro");
      }
    });
  };

  return (
    <div className="bg-white border border-[var(--line)] p-4 md:p-5 flex flex-col md:flex-row md:items-center gap-4 hover:border-[var(--action)] transition">
      <div className="w-full md:w-24 aspect-video md:aspect-square overflow-hidden flex-shrink-0 bg-[var(--bg-section)]">
        {firstImage ? (
          <img
            src={getListingImageUrl(firstImage)}
            alt={listing.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <EquipmentVisual equipment={listing.equipment_type} accent={accent} className="w-full h-full" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          {listing.status === "active" ? (
            <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 bg-[var(--success-bg)] text-[var(--success)] font-bold border border-[var(--success)]">
              Ativo
            </span>
          ) : listing.status === "pending_review" ? (
            <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 bg-amber-50 text-amber-700 font-bold border border-amber-300 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Em análise
            </span>
          ) : listing.status === "rejected" ? (
            <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 bg-red-50 text-[var(--danger)] font-bold border border-[var(--danger)]">
              Rejeitado
            </span>
          ) : listing.status === "draft" ? (
            <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 bg-[var(--bg-section)] text-[var(--text-muted)] font-bold border border-[var(--line)]">
              Rascunho
            </span>
          ) : listing.status === "paused" ? (
            <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 bg-[var(--bg-section)] text-[var(--ink-soft)] font-bold border border-[var(--line)]">
              Pausado
            </span>
          ) : (
            <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 bg-[var(--bg-section)] text-[var(--text-muted)] font-bold border border-[var(--line)]">
              {listing.status}
            </span>
          )}
          <span className="text-xs text-[var(--text-muted)]">
            {listing.brand ? `${listing.brand} · ` : ""}
            {listing.equipment_type}
          </span>
        </div>
        <h3 className="font-display text-lg font-bold leading-tight truncate">{listing.title}</h3>
        {listing.status === "rejected" && listing.rejection_reason && (
          <p className="text-xs text-[var(--danger)] mt-1">Motivo: {listing.rejection_reason}</p>
        )}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-xs text-[var(--ink-soft)]">
          <span className="flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            {listing.city}, {listing.state}
          </span>
        </div>
      </div>
      {isListingEditableByVendor(listing.status) && (
        <div className="flex-shrink-0 flex md:flex-col gap-2 md:justify-center">
          <Link
            href={`/dashboard/editar/${listing.id}`}
            className="inline-flex items-center justify-center gap-2 text-[10px] uppercase tracking-wider font-bold px-4 py-2 border border-[var(--ink)] text-[var(--ink)] hover:bg-[var(--ink)] hover:text-white transition"
          >
            <Pencil className="w-3.5 h-3.5" />
            Editar
          </Link>
          {canVendorWithdrawListingToDraft(listing.status) && (
            <button
              type="button"
              onClick={withdrawToDraft}
              disabled={rowPending}
              className="inline-flex items-center justify-center gap-2 text-[10px] uppercase tracking-wider font-bold px-4 py-2 border border-[var(--line)] text-[var(--ink-soft)] hover:border-[var(--action)] hover:text-[var(--action)] transition disabled:opacity-50"
            >
              <Archive className="w-3.5 h-3.5" />
              Rascunho
            </button>
          )}
        </div>
      )}
    </div>
  );
}
