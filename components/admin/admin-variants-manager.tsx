"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import {
  createVariantAction,
  updateVariantAction,
  deleteVariantAction,
  duplicateVariantAction,
  bulkUpdateVariantsAction,
  importVariantsCsvAction,
} from "@/app/admin/anuncios/variants-actions";
import type { Database } from "@/lib/supabase/types";
import { formatCentsBRL } from "@/lib/format";

type Variant = Database["public"]["Tables"]["listing_variants"]["Row"];

const inputClass =
  "w-full rounded-md border border-[var(--line)] px-3 py-2 text-sm outline-none focus:border-primary";

type FormState = {
  structure_color: string;
  upholstery_color: string;
  sku: string;
  str_code: string;
  stf_code: string;
  protheus_code: string;
  price_reais: string;
  stock_qty: string;
  is_made_to_order: boolean;
  production_days: string;
  active: boolean;
};

const emptyForm = (): FormState => ({
  structure_color: "",
  upholstery_color: "",
  sku: "",
  str_code: "",
  stf_code: "",
  protheus_code: "",
  price_reais: "",
  stock_qty: "0",
  is_made_to_order: true,
  production_days: "15",
  active: true,
});

function reaisToCents(reais: string): number {
  const normalized = reais.replace(/\./g, "").replace(",", ".").trim();
  const n = Number(normalized);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.round(n * 100);
}

function centsToReaisInput(cents: number): string {
  return (cents / 100).toFixed(2).replace(".", ",");
}

export function AdminVariantsManager({
  listingId,
  initialVariants,
}: {
  listingId: string;
  initialVariants: Variant[];
}) {
  const [variants, setVariants] = useState(initialVariants);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [importSummary, setImportSummary] = useState<string | null>(null);
  const [bulkPrice, setBulkPrice] = useState("");
  const [bulkDays, setBulkDays] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setVariants(initialVariants);
  }, [initialVariants]);

  const resetForm = () => {
    setForm(emptyForm());
    setEditingId(null);
    setError(null);
  };

  const startEdit = (v: Variant) => {
    setEditingId(v.id);
    setForm({
      structure_color: v.structure_color ?? "",
      upholstery_color: v.upholstery_color ?? "",
      sku: v.sku ?? "",
      str_code: v.str_code ?? "",
      stf_code: v.stf_code ?? "",
      protheus_code: v.protheus_code ?? "",
      price_reais: centsToReaisInput(v.price_cents),
      stock_qty: String(v.stock_qty),
      is_made_to_order: v.is_made_to_order,
      production_days: String(v.production_days ?? 15),
      active: v.active,
    });
    setError(null);
  };

  const save = () => {
    setError(null);
    const price_cents = reaisToCents(form.price_reais);
    if (price_cents <= 0) {
      setError("Informe um preço válido em R$");
      return;
    }
    const payload = {
      structure_color: form.structure_color.trim() || null,
      upholstery_color: form.upholstery_color.trim() || null,
      sku: form.sku.trim() || null,
      str_code: form.str_code.trim() || null,
      stf_code: form.stf_code.trim() || null,
      protheus_code: form.protheus_code.trim() || null,
      price_cents,
      stock_qty: Math.max(0, parseInt(form.stock_qty, 10) || 0),
      is_made_to_order: form.is_made_to_order,
      production_days: Math.max(0, parseInt(form.production_days, 10) || 15),
      active: form.active,
    };

    startTransition(async () => {
      if (editingId) {
        const r = await updateVariantAction(editingId, payload);
        if (!r.ok) {
          setError(r.error);
          return;
        }
        setVariants((prev) =>
          prev.map((v) => (v.id === editingId ? { ...v, ...payload } : v))
        );
      } else {
        const r = await createVariantAction(listingId, payload);
        if (!r.ok) {
          setError(r.error);
          return;
        }
        setVariants((prev) => [...prev, r.variant]);
      }
      resetForm();
    });
  };

  const remove = (id: string) => {
    if (!confirm("Excluir esta variação?")) return;
    startTransition(async () => {
      const r = await deleteVariantAction(id);
      if (!r.ok) {
        setError(r.error);
        return;
      }
      setVariants((prev) => prev.filter((v) => v.id !== id));
      if (editingId === id) resetForm();
    });
  };

  const duplicate = (id: string) => {
    startTransition(async () => {
      const r = await duplicateVariantAction(id);
      if (!r.ok) {
        setError(r.error);
        return;
      }
      setVariants((prev) => [...prev, r.variant]);
    });
  };

  const applyBulk = () => {
    setError(null);
    const price_cents = bulkPrice.trim() ? reaisToCents(bulkPrice) : null;
    const production_days = bulkDays.trim()
      ? Math.max(0, parseInt(bulkDays, 10) || 0)
      : null;
    if (price_cents == null && production_days == null) {
      setError("Informe preço e/ou prazo para aplicar em lote");
      return;
    }
    startTransition(async () => {
      const r = await bulkUpdateVariantsAction(listingId, {
        price_cents,
        production_days,
      });
      if (!r.ok) {
        setError(r.error);
        return;
      }
      setVariants((prev) =>
        prev.map((v) => ({
          ...v,
          ...(price_cents != null ? { price_cents } : {}),
          ...(production_days != null ? { production_days } : {}),
        }))
      );
      setImportSummary(`Atualização em lote: ${r.updated} variante(s).`);
      setBulkPrice("");
      setBulkDays("");
    });
  };

  const onImportCsv = (file: File | null) => {
    if (!file) return;
    setError(null);
    setImportSummary(null);
    startTransition(async () => {
      const text = await file.text();
      const r = await importVariantsCsvAction(listingId, text);
      if (!r.ok) {
        setError(r.error);
        return;
      }
      setVariants((prev) => {
        const byId = new Map(prev.map((v) => [v.id, v]));
        for (const v of r.variants) byId.set(v.id, v);
        return Array.from(byId.values());
      });
      const errTail =
        r.errors.length > 0
          ? ` · ${r.errors.slice(0, 3).join(" | ")}${
              r.errors.length > 3 ? ` (+${r.errors.length - 3})` : ""
            }`
          : "";
      setImportSummary(
        `Importação: ${r.inserted} inserida(s), ${r.updated} atualizada(s), ${r.skipped} ignorada(s)${errTail}`
      );
      if (fileRef.current) fileRef.current.value = "";
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <input
          ref={fileRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={(e) => onImportCsv(e.target.files?.[0] ?? null)}
        />
        <button
          type="button"
          disabled={pending}
          onClick={() => fileRef.current?.click()}
          className="rounded-md border border-[var(--line)] bg-white px-4 py-2 text-xs font-bold uppercase tracking-wider hover:border-primary disabled:opacity-50"
        >
          Importar Variantes via CSV
        </button>
        <p className="text-xs text-[var(--text-muted)]">
          Separador <code>;</code> · colunas: sku;structure_color;upholstery_color;str_code;stf_code;protheus_code;price_reais;production_days
        </p>
      </div>
      {importSummary && (
        <p className="rounded-md border border-[var(--line)] bg-[var(--bg-section)] px-3 py-2 text-sm text-[var(--ink-soft)]">
          {importSummary}
        </p>
      )}

      {variants.length > 0 && (
        <div className="flex flex-wrap items-end gap-3 rounded-md border border-[var(--line)] bg-[var(--bg-section)] p-3">
          <div>
            <label className="text-label-bold mb-1 block text-[var(--text-muted)]">
              Novo preço (R$) — lote
            </label>
            <input
              className={inputClass}
              value={bulkPrice}
              onChange={(e) => setBulkPrice(e.target.value)}
              placeholder="Ex: 18990,00"
            />
          </div>
          <div>
            <label className="text-label-bold mb-1 block text-[var(--text-muted)]">
              Prazo (dias úteis) — lote
            </label>
            <input
              type="number"
              min={0}
              className={inputClass}
              value={bulkDays}
              onChange={(e) => setBulkDays(e.target.value)}
              placeholder="15"
            />
          </div>
          <button
            type="button"
            disabled={pending}
            onClick={applyBulk}
            className="rounded-md bg-[var(--ink)] px-4 py-2 text-xs font-bold uppercase tracking-wider text-white disabled:opacity-50"
          >
            Aplicar a todas
          </button>
        </div>
      )}

      {variants.length === 0 ? (
        <p className="text-sm text-[var(--text-muted)]">
          Nenhuma variação cadastrada. Sem variações, o preço base do produto é usado.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--line)] text-left text-label-bold text-[var(--text-muted)]">
                <th className="py-2 pr-3">SKU</th>
                <th className="py-2 pr-3">STR / Estrutura</th>
                <th className="py-2 pr-3">STF / Estofado</th>
                <th className="py-2 pr-3">Protheus</th>
                <th className="py-2 pr-3">Preço</th>
                <th className="py-2 pr-3">Estoque</th>
                <th className="py-2 pr-3">Encomenda</th>
                <th className="py-2 pr-3">Status</th>
                <th className="py-2" />
              </tr>
            </thead>
            <tbody>
              {variants.map((v) => (
                <tr key={v.id} className="border-b border-[var(--line)]">
                  <td className="py-2.5 pr-3 font-mono text-xs">{v.sku || "—"}</td>
                  <td className="py-2.5 pr-3">
                    <div>{v.structure_color || "—"}</div>
                    <div className="font-mono text-xs text-[var(--text-muted)]">
                      {v.str_code || "—"}
                    </div>
                  </td>
                  <td className="py-2.5 pr-3">
                    <div>{v.upholstery_color || "—"}</div>
                    <div className="font-mono text-xs text-[var(--text-muted)]">
                      {v.stf_code || "—"}
                    </div>
                  </td>
                  <td className="py-2.5 pr-3 font-mono text-xs">
                    {v.protheus_code || "—"}
                  </td>
                  <td className="py-2.5 pr-3 font-semibold">
                    {formatCentsBRL(v.price_cents)}
                  </td>
                  <td className="py-2.5 pr-3">{v.stock_qty}</td>
                  <td className="py-2.5 pr-3 text-xs">
                    {v.is_made_to_order
                      ? `${v.production_days} dias`
                      : "Pronto"}
                  </td>
                  <td className="py-2.5 pr-3">
                    {v.active ? (
                      <span className="text-[var(--success)]">Ativa</span>
                    ) : (
                      <span className="text-[var(--text-muted)]">Inativa</span>
                    )}
                  </td>
                  <td className="py-2.5 text-right whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => startEdit(v)}
                      className="mr-3 text-xs font-bold uppercase text-primary"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => duplicate(v.id)}
                      className="mr-3 text-xs font-bold uppercase text-[var(--ink-soft)]"
                    >
                      Duplicar
                    </button>
                    <button
                      type="button"
                      onClick={() => remove(v.id)}
                      className="text-xs font-bold uppercase text-[var(--danger)]"
                    >
                      Excluir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="rounded-md border border-[var(--line)] bg-[var(--bg-section)] p-4 space-y-4">
        <h3 className="font-display text-base font-bold uppercase">
          {editingId ? "Editar variação" : "Nova variação"}
        </h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Cor da Estrutura (STR)">
            <input
              className={inputClass}
              value={form.structure_color}
              onChange={(e) =>
                setForm((f) => ({ ...f, structure_color: e.target.value }))
              }
              placeholder="Ex: Preto fosco"
            />
          </Field>
          <Field label="Código STR (Protheus)">
            <input
              className={inputClass}
              value={form.str_code}
              onChange={(e) => setForm((f) => ({ ...f, str_code: e.target.value }))}
              placeholder="STR..."
            />
          </Field>
          <Field label="Cor do Estofado (STF)">
            <input
              className={inputClass}
              value={form.upholstery_color}
              onChange={(e) =>
                setForm((f) => ({ ...f, upholstery_color: e.target.value }))
              }
              placeholder="Ex: Cinza grafite"
            />
          </Field>
          <Field label="Código STF (Protheus)">
            <input
              className={inputClass}
              value={form.stf_code}
              onChange={(e) => setForm((f) => ({ ...f, stf_code: e.target.value }))}
              placeholder="STF..."
            />
          </Field>
          <Field label="Código Protheus consolidado">
            <input
              className={inputClass}
              value={form.protheus_code}
              onChange={(e) =>
                setForm((f) => ({ ...f, protheus_code: e.target.value }))
              }
            />
          </Field>
          <Field label="SKU">
            <input
              className={inputClass}
              value={form.sku}
              onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value }))}
            />
          </Field>
          <Field label="Preço (R$)">
            <input
              className={inputClass}
              value={form.price_reais}
              onChange={(e) =>
                setForm((f) => ({ ...f, price_reais: e.target.value }))
              }
              placeholder="0,00"
            />
          </Field>
          <Field label="Estoque">
            <input
              type="number"
              min={0}
              className={inputClass}
              value={form.stock_qty}
              onChange={(e) =>
                setForm((f) => ({ ...f, stock_qty: e.target.value }))
              }
            />
          </Field>
          <Field label="Prazo fabricação (dias úteis)">
            <input
              type="number"
              min={0}
              className={inputClass}
              value={form.production_days}
              disabled={!form.is_made_to_order}
              onChange={(e) =>
                setForm((f) => ({ ...f, production_days: e.target.value }))
              }
            />
          </Field>
          <Field label="Sob encomenda">
            <label className="flex items-center gap-2 h-[42px] text-sm">
              <input
                type="checkbox"
                checked={form.is_made_to_order}
                onChange={(e) =>
                  setForm((f) => ({ ...f, is_made_to_order: e.target.checked }))
                }
                className="accent-[var(--brand-primary)]"
              />
              Permitir venda com estoque 0
            </label>
          </Field>
          <Field label="Status">
            <label className="flex items-center gap-2 h-[42px] text-sm">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) =>
                  setForm((f) => ({ ...f, active: e.target.checked }))
                }
                className="accent-[var(--brand-primary)]"
              />
              Variação ativa
            </label>
          </Field>
        </div>
        {error && (
          <p className="text-sm text-[var(--danger)]">{error}</p>
        )}
        <div className="flex gap-2">
          <button
            type="button"
            disabled={pending}
            onClick={save}
            className="rounded-md bg-primary px-4 py-2 text-xs font-bold uppercase tracking-wider text-white disabled:opacity-50"
          >
            {pending ? "Salvando…" : editingId ? "Salvar alterações" : "Adicionar variação"}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="rounded-md border border-[var(--line)] px-4 py-2 text-xs font-bold uppercase tracking-wider"
            >
              Cancelar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="text-label-bold text-[var(--text-muted)] block mb-1">
        {label}
      </label>
      {children}
    </div>
  );
}
