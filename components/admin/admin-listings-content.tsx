"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Check, X, Pause, Trash2, MapPin, Search, ExternalLink, Star } from "lucide-react";
import { getListingImageUrl } from "@/lib/storage";
import { formatBRL } from "@/lib/format";
import { conditionLabel } from "@/lib/listings";
import {
  approveListingAction,
  rejectListingAction,
  unpublishListingAction,
  deleteListingAction,
  toggleFeaturedAction,
} from "@/app/admin/anuncios/actions";

const STATUS_TABS = [
  { key: "all", label: "Todos" },
  { key: "pending_review", label: "Em análise" },
  { key: "active", label: "Ativos" },
  { key: "rejected", label: "Recusados" },
  { key: "paused", label: "Pausados" },
];

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  pending_review: { label: "Em análise", cls: "bg-amber-50 text-amber-700 border-amber-300" },
  active: { label: "Ativo", cls: "bg-[var(--success-bg)] text-[var(--success)] border-[var(--success)]" },
  rejected: { label: "Recusado", cls: "bg-red-50 text-[var(--danger)] border-[var(--danger)]" },
  paused: { label: "Pausado", cls: "bg-[var(--bg-section)] text-[var(--text-muted)] border-[var(--line)]" },
  draft: { label: "Rascunho", cls: "bg-[var(--bg-section)] text-[var(--text-muted)] border-[var(--line)]" },
  sold: { label: "Vendido", cls: "bg-[var(--bg-section)] text-[var(--ink-soft)] border-[var(--line)]" },
};

/* eslint-disable @typescript-eslint/no-explicit-any */
export function AdminListingsContent({
  listings,
  activeStatus,
  query,
}: {
  listings: any[];
  activeStatus: string;
  query: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [searchValue, setSearchValue] = useState(query);
  const [rejectModal, setRejectModal] = useState<{ id: string; title: string } | null>(null);

  const setFilter = (status: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (status === "all") params.delete("status");
    else params.set("status", status);
    router.push(`/admin/anuncios?${params.toString()}`);
  };

  const setSearch = (q: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (q) params.set("q", q);
    else params.delete("q");
    router.push(`/admin/anuncios?${params.toString()}`);
  };

  const handleApprove = (id: string) => {
    if (!confirm("Aprovar este anúncio? Ficará visível publicamente.")) return;
    startTransition(async () => {
      await approveListingAction(id);
    });
  };

  const handleUnpublish = (id: string) => {
    if (!confirm("Despublicar? O anúncio fica pausado e sai do catálogo. Pode republicá-lo na aba «Pausados».")) return;
    startTransition(async () => {
      await unpublishListingAction(id);
    });
  };

  const handleDelete = (id: string) => {
    if (!confirm("EXCLUIR PERMANENTEMENTE este anúncio? Esta ação não pode ser desfeita.")) return;
    startTransition(async () => {
      await deleteListingAction(id);
    });
  };

  const handleToggleFeatured = (id: string, current: boolean) => {
    startTransition(async () => {
      await toggleFeaturedAction(id, !current);
    });
  };

  return (
    <div className="p-6 md:p-10">
      <div className="mb-6">
        <div className="text-label-bold text-[var(--text-muted)] mb-2">CURADORIA</div>
        <h1 className="font-display text-3xl md:text-4xl font-bold uppercase text-[var(--ink)]">Anúncios</h1>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center mb-6">
        <div className="flex items-center gap-2 px-4 py-2 bg-white border border-[var(--line)]">
          <Search className="w-4 h-4 text-[var(--text-muted)]" />
          <input
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && setSearch(searchValue)}
            placeholder="Buscar título, tipo, marca…"
            className="bg-transparent text-sm w-56 outline-none placeholder:text-[var(--text-muted)]"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto">
          {STATUS_TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setFilter(t.key)}
              className={`whitespace-nowrap text-label-bold px-4 py-1.5 transition border ${
                activeStatus === t.key
                  ? "bg-[var(--ink)] text-white border-[var(--ink)]"
                  : "text-[var(--ink-soft)] border-[var(--line)] hover:bg-[var(--bg-section)]"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {listings.length === 0 ? (
        <div className="border border-dashed border-[var(--line)] p-12 text-center">
          <p className="text-[var(--text-muted)]">Nenhum anúncio encontrado.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {listings.map((l: any) => {
            const firstImage = l.listing_images?.sort((a: any, b: any) => a.position - b.position)[0]?.storage_path;
            const badge = STATUS_BADGE[l.status] ?? STATUS_BADGE["draft"];
            const isFeatured = l.is_featured ?? false;
            return (
              <div key={l.id} className="bg-white border border-[var(--line)] p-4 md:p-5 flex flex-col md:flex-row gap-4 hover:border-[var(--action)] transition">
                <div className="w-full md:w-28 aspect-video md:aspect-square overflow-hidden flex-shrink-0 bg-[var(--bg-section)]">
                  {firstImage ? (
                    <img src={getListingImageUrl(firstImage)} alt={l.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-[var(--bg-section)]" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 font-bold border ${badge.cls}`}>
                      {badge.label}
                    </span>
                    {isFeatured && (
                      <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 font-bold bg-[var(--action)] text-white">
                        Destaque
                      </span>
                    )}
                    <span className="text-xs text-[var(--text-muted)]">
                      {l.brand ? `${l.brand} · ` : ""}{l.equipment_type} · {conditionLabel(l.condition)}
                    </span>
                  </div>
                  <h3 className="font-display text-lg font-bold leading-tight">{l.title}</h3>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-xs text-[var(--ink-soft)]">
                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{l.city}, {l.state}</span>
                    {l.vendors?.name && <span>Vendedor: <strong>{l.vendors.name}</strong></span>}
                    {l.has_fixed_price && l.price && <span className="text-[var(--action)] font-bold">{formatBRL(l.price)}</span>}
                  </div>
                  {l.status === "rejected" && l.rejection_reason && (
                    <div className="mt-2 text-xs text-[var(--danger)]">
                      <strong>Motivo:</strong> {l.rejection_reason}
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap md:flex-col gap-2 md:items-end self-stretch md:self-center">
                  {l.status === "active" && (
                    <Link
                      href={`/${l.slug}`}
                      target="_blank"
                      className="text-[10px] uppercase tracking-wider font-bold px-3 py-1.5 bg-white border border-[var(--line)] hover:border-[var(--action)] flex items-center gap-1 transition"
                    >
                      <ExternalLink className="w-3 h-3" />
                      Ver
                    </Link>
                  )}

                  {l.status === "pending_review" && (
                    <>
                      <button
                        onClick={() => handleApprove(l.id)}
                        disabled={isPending}
                        className="text-[10px] uppercase tracking-wider font-bold px-3 py-1.5 bg-[var(--success)] text-white hover:opacity-90 flex items-center gap-1 transition disabled:opacity-50"
                      >
                        <Check className="w-3 h-3" /> Aprovar
                      </button>
                      <button
                        onClick={() => setRejectModal({ id: l.id, title: l.title })}
                        disabled={isPending}
                        className="text-[10px] uppercase tracking-wider font-bold px-3 py-1.5 bg-red-50 text-[var(--danger)] border border-[var(--danger)] hover:bg-red-100 flex items-center gap-1 transition disabled:opacity-50"
                      >
                        <X className="w-3 h-3" /> Recusar
                      </button>
                    </>
                  )}

                  {(l.status === "paused" || l.status === "rejected") && (
                    <button
                      onClick={() => handleApprove(l.id)}
                      disabled={isPending}
                      className="text-[10px] uppercase tracking-wider font-bold px-3 py-1.5 bg-[var(--success)] text-white hover:opacity-90 flex items-center gap-1 transition disabled:opacity-50"
                    >
                      <Check className="w-3 h-3" /> Republicar
                    </button>
                  )}

                  {l.status === "active" && (
                    <>
                      <button
                        onClick={() => handleToggleFeatured(l.id, isFeatured)}
                        disabled={isPending}
                        className={`text-[10px] uppercase tracking-wider font-bold px-3 py-1.5 flex items-center gap-1 transition disabled:opacity-50 border ${
                          isFeatured
                            ? "bg-[var(--action)] text-white border-[var(--action)]"
                            : "bg-white text-[var(--ink-soft)] border-[var(--line)] hover:border-[var(--action)]"
                        }`}
                      >
                        <Star className="w-3 h-3" /> {isFeatured ? "Remover destaque" : "Destacar"}
                      </button>
                      <button
                        onClick={() => handleUnpublish(l.id)}
                        disabled={isPending}
                        className="text-[10px] uppercase tracking-wider font-bold px-3 py-1.5 bg-[var(--bg-section)] text-[var(--ink-soft)] border border-[var(--line)] hover:bg-[var(--line)] flex items-center gap-1 transition disabled:opacity-50"
                      >
                        <Pause className="w-3 h-3" /> Despublicar
                      </button>
                    </>
                  )}

                  <button
                    onClick={() => handleDelete(l.id)}
                    disabled={isPending}
                    className="text-[10px] uppercase tracking-wider font-bold px-3 py-1.5 text-[var(--danger)] hover:bg-red-50 flex items-center gap-1 transition disabled:opacity-50"
                  >
                    <Trash2 className="w-3 h-3" /> Excluir
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {rejectModal && (
        <RejectModal
          listingId={rejectModal.id}
          title={rejectModal.title}
          onClose={() => setRejectModal(null)}
        />
      )}
    </div>
  );
}

function RejectModal({
  listingId,
  title,
  onClose,
}: {
  listingId: string;
  title: string;
  onClose: () => void;
}) {
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  const handleSubmit = async () => {
    if (!reason.trim()) return;
    setBusy(true);
    try {
      await rejectListingAction(listingId, reason);
      onClose();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erro");
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
      <div className="bg-white border border-[var(--line)] max-w-md w-full p-8">
        <div className="text-label-bold text-[var(--danger)] mb-2">RECUSAR ANÚNCIO</div>
        <h2 className="font-display text-2xl font-bold uppercase mb-2">{title}</h2>
        <p className="text-sm text-[var(--text-muted)] mb-6">
          O vendedor receberá uma notificação com o motivo informado abaixo e poderá editar e re-submeter.
        </p>
        <label className="text-label-bold text-[var(--text-muted)] block mb-2">Motivo</label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={4}
          placeholder="Ex: As fotos não mostram o equipamento com clareza. Por favor, reenvie com fotos mais nítidas."
          className="w-full border border-[var(--line)] focus:border-[var(--action)] outline-none p-3 text-sm resize-none transition"
        />
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose} className="text-sm px-4 py-2 text-[var(--text-muted)] hover:text-[var(--ink)]">
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={busy || !reason.trim()}
            className="text-label-bold bg-[var(--danger)] text-white px-5 py-2 hover:opacity-90 transition disabled:opacity-50"
          >
            {busy ? "Recusando…" : "Confirmar recusa"}
          </button>
        </div>
      </div>
    </div>
  );
}
