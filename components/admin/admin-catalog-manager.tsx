"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Copy,
  ExternalLink,
  Pencil,
  Plus,
  Search,
  Trash2,
  Upload,
} from "lucide-react";
import { getListingImageUrl } from "@/lib/storage";
import { formatBRL, formatCentsBRL } from "@/lib/format";
import { EQUIPMENT_FILTER_LABELS } from "@/lib/listings";
import {
  deleteProductAction,
  duplicateProductAction,
  toggleProductStatusAction,
} from "@/app/admin/anuncios/catalog-actions";

type ListingRow = {
  id: string;
  title: string;
  slug: string;
  status: string;
  equipment_type: string;
  brand: string | null;
  price: number | null;
  has_fixed_price: boolean;
  listing_images: { id: string; storage_path: string; position: number }[] | null;
  listing_variants:
    | { id: string; price_cents: number; active: boolean; sku: string | null; protheus_code: string | null }[]
    | null;
};

export function AdminCatalogManager({
  listings,
  counts,
  filters,
  categories,
}: {
  listings: ListingRow[];
  counts: { all: number; active: number; draft: number; withoutPhoto: number };
  filters: { status: string; q: string; categoria: string; semFoto: boolean };
  categories: { value: string; label: string }[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [q, setQ] = useState(filters.q);
  const [toast, setToast] = useState<string | null>(null);

  const pushFilters = (patch: Record<string, string | undefined>) => {
    const params = new URLSearchParams();
    const next = {
      status: filters.status,
      q: filters.q,
      categoria: filters.categoria,
      sem_foto: filters.semFoto ? "1" : "",
      ...patch,
    };
    if (next.status && next.status !== "all") params.set("status", next.status);
    if (next.q) params.set("q", next.q);
    if (next.categoria) params.set("categoria", next.categoria);
    if (next.sem_foto === "1") params.set("sem_foto", "1");
    router.push(`/admin/anuncios?${params.toString()}`);
  };

  const tabs = useMemo(
    () => [
      { key: "all", label: `Todos (${counts.all})` },
      { key: "active", label: `Ativos (${counts.active})` },
      { key: "draft", label: `Rascunhos (${counts.draft})` },
      { key: "sem_foto", label: `Sem Foto (${counts.withoutPhoto})` },
    ],
    [counts]
  );

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="text-label-bold text-[var(--text-muted)] mb-2">LOJA OFICIAL</div>
          <h1 className="font-display text-3xl font-bold uppercase text-[var(--ink)]">
            Catálogo de Produtos
          </h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/anuncios/novo"
            className="inline-flex items-center gap-2 bg-primary px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-white hover:opacity-90"
          >
            <Plus className="h-4 w-4" /> Novo Produto
          </Link>
          <a
            href="#import-hint"
            className="inline-flex items-center gap-2 border border-[var(--line)] bg-white px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider hover:border-primary"
          >
            <Upload className="h-4 w-4" /> Importar Catálogo CSV
          </a>
        </div>
      </div>

      {toast && (
        <div className="mb-4 rounded-md border border-green-200 bg-green-50 px-4 py-2 text-sm text-green-800">
          {toast}
        </div>
      )}

      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="flex items-center gap-2 border border-[var(--line)] bg-white px-3 py-2">
          <Search className="h-4 w-4 text-[var(--text-muted)]" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && pushFilters({ q })}
            placeholder="Buscar nome, SKU ou Protheus…"
            className="w-64 bg-transparent text-sm outline-none"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {tabs.map((t) => {
            const active =
              t.key === "sem_foto"
                ? filters.semFoto
                : !filters.semFoto && filters.status === t.key;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => {
                  if (t.key === "sem_foto") {
                    pushFilters({ status: "all", sem_foto: "1" });
                  } else {
                    pushFilters({ status: t.key, sem_foto: undefined });
                  }
                }}
                className={`whitespace-nowrap border px-3 py-1.5 text-label-bold uppercase ${
                  active
                    ? "border-[var(--ink)] bg-[var(--ink)] text-white"
                    : "border-[var(--line)] text-[var(--ink-soft)] hover:bg-[var(--bg-section)]"
                }`}
              >
                {t.label}
              </button>
            );
          })}
        </div>
        <select
          value={filters.categoria}
          onChange={(e) => pushFilters({ categoria: e.target.value || undefined })}
          className="border border-[var(--line)] bg-white px-3 py-2 text-sm"
        >
          <option value="">Todas as categorias</option>
          {categories.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
      </div>

      <div id="import-hint" className="mb-4 rounded-md border border-dashed border-[var(--line)] bg-[var(--bg-section)] px-4 py-3 text-sm text-[var(--ink-soft)]">
        Importação em massa do catálogo legado: rode{" "}
        <code className="rounded bg-white px-1.5 py-0.5 text-xs">pnpm import:catalog</code>{" "}
        com o CSV em <code className="text-xs">tmp/</code>. Variantes de um produto: use a aba Variantes no editor.
      </div>

      <div className="overflow-x-auto rounded-md border border-[var(--line)] bg-white">
        <table className="w-full min-w-[960px] text-sm">
          <thead className="bg-[var(--bg-section)] text-left text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
            <tr>
              <th className="px-3 py-3">Foto</th>
              <th className="px-3 py-3">Produto</th>
              <th className="px-3 py-3">Categoria</th>
              <th className="px-3 py-3">Preço</th>
              <th className="px-3 py-3">Variantes</th>
              <th className="px-3 py-3">Status</th>
              <th className="px-3 py-3">Ações</th>
            </tr>
          </thead>
          <tbody>
            {listings.map((l) => {
              const imgs = [...(l.listing_images ?? [])].sort((a, b) => a.position - b.position);
              const cover = imgs[0]?.storage_path;
              const variants = l.listing_variants ?? [];
              const activeVariants = variants.filter((v) => v.active);
              const prices = activeVariants.map((v) => v.price_cents);
              const minP = prices.length ? Math.min(...prices) : null;
              const maxP = prices.length ? Math.max(...prices) : null;
              const catLabel =
                EQUIPMENT_FILTER_LABELS[l.equipment_type] ?? l.equipment_type;

              return (
                <tr key={l.id} className="border-t border-[var(--line)] align-middle">
                  <td className="px-3 py-3">
                    <div className="h-14 w-14 overflow-hidden bg-[var(--bg-section)]">
                      {cover ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={getListingImageUrl(cover)}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-[9px] font-bold uppercase text-[var(--text-muted)]">
                          Sem foto
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <div className="font-display font-bold leading-tight">{l.title}</div>
                    <div className="mt-0.5 font-mono text-[11px] text-[var(--text-muted)]">
                      /{l.slug}
                    </div>
                  </td>
                  <td className="px-3 py-3 text-xs uppercase tracking-wide">{catLabel}</td>
                  <td className="px-3 py-3">
                    {minP != null ? (
                      <span className="font-semibold text-primary">
                        {minP === maxP
                          ? formatCentsBRL(minP)
                          : `${formatCentsBRL(minP)} – ${formatCentsBRL(maxP!)}`}
                      </span>
                    ) : l.price != null ? (
                      <span className="font-semibold text-primary">{formatBRL(l.price)}</span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-3 py-3">{variants.length}</td>
                  <td className="px-3 py-3">
                    <button
                      type="button"
                      disabled={pending || (l.status !== "active" && l.status !== "draft")}
                      onClick={() => {
                        const next = l.status === "active" ? "draft" : "active";
                        startTransition(async () => {
                          const r = await toggleProductStatusAction(l.id, next);
                          if (!r.ok) {
                            setToast(r.error);
                            return;
                          }
                          setToast(
                            next === "active"
                              ? `"${l.title}" ativado.`
                              : `"${l.title}" virou rascunho.`
                          );
                          router.refresh();
                        });
                      }}
                      className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase ${
                        l.status === "active"
                          ? "bg-green-100 text-green-800"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {l.status === "active" ? "Ativo" : l.status === "draft" ? "Rascunho" : l.status}
                    </button>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex flex-wrap gap-1">
                      <Link
                        href={`/admin/anuncios/${l.id}`}
                        className="inline-flex items-center gap-1 border border-[var(--line)] px-2 py-1 text-[10px] font-bold uppercase hover:border-primary"
                      >
                        <Pencil className="h-3 w-3" /> Editar
                      </Link>
                      <button
                        type="button"
                        disabled={pending}
                        className="inline-flex items-center gap-1 border border-[var(--line)] px-2 py-1 text-[10px] font-bold uppercase hover:border-primary"
                        onClick={() => {
                          startTransition(async () => {
                            const r = await duplicateProductAction(l.id);
                            if (!r.ok) {
                              setToast(r.error);
                              return;
                            }
                            setToast("Produto duplicado como rascunho.");
                            router.push(`/admin/anuncios/${r.id}`);
                            router.refresh();
                          });
                        }}
                      >
                        <Copy className="h-3 w-3" /> Duplicar
                      </button>
                      {l.status === "active" && (
                        <Link
                          href={`/${l.slug}`}
                          target="_blank"
                          className="inline-flex items-center gap-1 border border-[var(--line)] px-2 py-1 text-[10px] font-bold uppercase"
                        >
                          <ExternalLink className="h-3 w-3" />
                        </Link>
                      )}
                      <button
                        type="button"
                        disabled={pending}
                        className="inline-flex items-center gap-1 border border-red-200 px-2 py-1 text-[10px] font-bold uppercase text-red-600"
                        onClick={() => {
                          if (!confirm(`Excluir permanentemente "${l.title}"?`)) return;
                          startTransition(async () => {
                            const r = await deleteProductAction(l.id);
                            if (!r.ok) {
                              setToast(r.error);
                              return;
                            }
                            setToast("Produto excluído.");
                            router.refresh();
                          });
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {listings.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-[var(--text-muted)]">
                  Nenhum produto neste filtro.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
