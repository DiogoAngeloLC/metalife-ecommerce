"use client";

import { useState, useTransition } from "react";
import { createBannerAction, toggleBannerAction, deleteBannerAction } from "./actions";
import { Trash2, Eye, EyeOff, Plus, X } from "lucide-react";

type Banner = {
  id: string;
  slot_key: string;
  image_url: string;
  link_url: string | null;
  alt_text: string;
  active: boolean;
  sort_order: number;
  created_at: string;
};

const SLOT_OPTIONS = [
  { value: "catalog_sidebar", label: "Catálogo — Sidebar" },
  { value: "listing_footer", label: "Anúncio — Footer" },
  { value: "home_promo", label: "Home — Promoção" },
];

export function BannersManager({ banners }: { banners: Banner[] }) {
  const [showForm, setShowForm] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      try {
        await createBannerAction(formData);
        setShowForm(false);
        alert("Banner criado!");
      } catch (err) {
        alert(err instanceof Error ? err.message : "Erro");
      }
    });
  };

  const handleToggle = (id: string, active: boolean) => {
    startTransition(async () => {
      try {
        await toggleBannerAction(id, !active);
      } catch (err) {
        alert(err instanceof Error ? err.message : "Erro");
      }
    });
  };

  const handleDelete = (id: string) => {
    if (!confirm("Excluir este banner permanentemente?")) return;
    startTransition(async () => {
      try {
        await deleteBannerAction(id);
      } catch (err) {
        alert(err instanceof Error ? err.message : "Erro");
      }
    });
  };

  return (
    <div className="space-y-4">
      {/* New banner button */}
      <button
        type="button"
        onClick={() => setShowForm(!showForm)}
        className="flex items-center gap-1.5 bg-[var(--action)] text-white px-4 py-2 text-label-bold uppercase tracking-wider hover:bg-[var(--action-dark)] transition"
      >
        {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
        {showForm ? "Cancelar" : "Novo banner"}
      </button>

      {/* Create form */}
      {showForm && (
        <form onSubmit={handleCreate} className="border border-[var(--line)] bg-white p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-label-bold text-[var(--text-muted)] block mb-1">Slot</label>
              <select name="slot_key" required className="w-full border border-[var(--line)] px-3 py-2 text-sm outline-none">
                {SLOT_OPTIONS.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-label-bold text-[var(--text-muted)] block mb-1">Ordem</label>
              <input name="sort_order" type="number" defaultValue={0} className="w-full border border-[var(--line)] px-3 py-2 text-sm outline-none" />
            </div>
          </div>
          <div>
            <label className="text-label-bold text-[var(--text-muted)] block mb-1">Imagem</label>
            <input name="image" type="file" accept="image/jpeg,image/png,image/webp" required className="w-full text-sm" />
          </div>
          <div>
            <label className="text-label-bold text-[var(--text-muted)] block mb-1">Link (opcional)</label>
            <input name="link_url" type="url" placeholder="https://..." className="w-full border border-[var(--line)] px-3 py-2 text-sm outline-none" />
          </div>
          <div>
            <label className="text-label-bold text-[var(--text-muted)] block mb-1">Texto alt</label>
            <input name="alt_text" defaultValue="Banner" className="w-full border border-[var(--line)] px-3 py-2 text-sm outline-none" />
          </div>
          <button
            type="submit"
            disabled={isPending}
            className="bg-[var(--action)] text-white px-6 py-2.5 font-display text-sm font-bold uppercase tracking-wider hover:bg-[var(--action-dark)] disabled:opacity-40"
          >
            {isPending ? "Criando..." : "Criar banner"}
          </button>
        </form>
      )}

      {/* Banners list */}
      {banners.length === 0 ? (
        <div className="border border-dashed border-[var(--line)] p-8 text-center">
          <p className="text-sm text-[var(--text-muted)]">Nenhum banner cadastrado.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {banners.map((b) => (
            <div
              key={b.id}
              className={`flex items-center gap-4 border border-[var(--line)] bg-white p-3 ${!b.active ? "opacity-50" : ""}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={b.image_url} alt={b.alt_text} className="h-16 w-24 object-cover border border-[var(--line)]" />
              <div className="flex-1 min-w-0">
                <div className="text-label-bold text-[var(--ink)]">
                  {SLOT_OPTIONS.find((s) => s.value === b.slot_key)?.label ?? b.slot_key}
                </div>
                <div className="text-xs text-[var(--text-muted)] truncate">
                  {b.link_url ?? "Sem link"} · Ordem: {b.sort_order}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleToggle(b.id, b.active)}
                  disabled={isPending}
                  className="p-2 hover:bg-[var(--bg-section)] transition"
                  title={b.active ? "Desativar" : "Ativar"}
                >
                  {b.active ? <Eye className="h-4 w-4 text-[var(--trust)]" /> : <EyeOff className="h-4 w-4 text-[var(--text-muted)]" />}
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(b.id)}
                  disabled={isPending}
                  className="p-2 hover:bg-[var(--danger-bg)] transition"
                  title="Excluir"
                >
                  <Trash2 className="h-4 w-4 text-[var(--danger)]" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
