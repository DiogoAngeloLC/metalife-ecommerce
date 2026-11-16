"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { formatCentsBRL } from "@/lib/format";
import {
  createShippingRuleAction,
  updateShippingRuleAction,
  toggleShippingRuleAction,
  deleteShippingRuleAction,
} from "@/app/admin/frete/actions";
import type { Database } from "@/lib/supabase/types";

type Rule = Database["public"]["Tables"]["shipping_rules"]["Row"];

const inputClass =
  "w-full rounded-md border border-[var(--line)] px-3 py-2 text-sm outline-none focus:border-primary";

function reaisToCents(reais: string): number {
  const n = Number(reais.replace(/\./g, "").replace(",", ".").trim());
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.round(n * 100);
}

function centsToInput(cents: number): string {
  return (cents / 100).toFixed(2).replace(".", ",");
}

export function AdminShippingManager({ initialRules }: { initialRules: Rule[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    uf: "SP",
    name: "Transportadora padrão",
    price_reais: "0,00",
    estimated_days: "10",
    active: true,
  });

  const reset = () => {
    setEditingId(null);
    setForm({
      uf: "SP",
      name: "Transportadora padrão",
      price_reais: "0,00",
      estimated_days: "10",
      active: true,
    });
  };

  const save = () => {
    setErr(null);
    setMsg(null);
    const payload = {
      uf: form.uf,
      name: form.name,
      price_cents: reaisToCents(form.price_reais),
      estimated_days: form.estimated_days
        ? Math.max(0, parseInt(form.estimated_days, 10) || 0)
        : null,
      active: form.active,
    };
    startTransition(async () => {
      const r = editingId
        ? await updateShippingRuleAction(editingId, payload)
        : await createShippingRuleAction(payload);
      if (!r.ok) {
        setErr(r.error);
        return;
      }
      setMsg(editingId ? "Regra atualizada." : "Regra criada.");
      reset();
      router.refresh();
    });
  };

  return (
    <div className="space-y-6">
      {msg && (
        <div className="rounded-md border border-green-200 bg-green-50 px-4 py-2 text-sm text-green-800">
          {msg}
        </div>
      )}
      {err && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          {err}
        </div>
      )}

      <section className="rounded-md border border-[var(--line)] bg-white p-5 space-y-3">
        <h2 className="font-display text-lg font-bold uppercase">
          {editingId ? "Editar regra" : "Nova regra"}
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <div>
            <label className="text-[10px] font-bold uppercase text-[var(--text-muted)]">UF / ALL</label>
            <input
              className={inputClass}
              value={form.uf}
              maxLength={3}
              onChange={(e) => setForm((f) => ({ ...f, uf: e.target.value.toUpperCase() }))}
            />
          </div>
          <div className="lg:col-span-2">
            <label className="text-[10px] font-bold uppercase text-[var(--text-muted)]">Nome</label>
            <input
              className={inputClass}
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase text-[var(--text-muted)]">Valor (R$)</label>
            <input
              className={inputClass}
              value={form.price_reais}
              onChange={(e) => setForm((f) => ({ ...f, price_reais: e.target.value }))}
            />
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase text-[var(--text-muted)]">Prazo (dias)</label>
            <input
              className={inputClass}
              value={form.estimated_days}
              onChange={(e) => setForm((f) => ({ ...f, estimated_days: e.target.value }))}
            />
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.active}
            onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
          />
          Ativa
        </label>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={pending}
            onClick={save}
            className="bg-primary px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-white disabled:opacity-50"
          >
            {editingId ? "Salvar" : "Criar"}
          </button>
          {editingId && (
            <button type="button" onClick={reset} className="border border-[var(--line)] px-4 py-2 text-[10px] font-bold uppercase">
              Cancelar
            </button>
          )}
        </div>
      </section>

      <div className="overflow-x-auto rounded-md border border-[var(--line)] bg-white">
        <table className="w-full text-sm">
          <thead className="bg-[var(--bg-section)] text-left text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
            <tr>
              <th className="px-4 py-3">UF</th>
              <th className="px-4 py-3">Modalidade</th>
              <th className="px-4 py-3">Valor</th>
              <th className="px-4 py-3">Prazo</th>
              <th className="px-4 py-3">Ativo</th>
              <th className="px-4 py-3">Ações</th>
            </tr>
          </thead>
          <tbody>
            {initialRules.map((r) => (
              <tr key={r.id} className="border-t border-[var(--line)]">
                <td className="px-4 py-3 font-mono text-xs">{r.uf}</td>
                <td className="px-4 py-3">{r.name}</td>
                <td className="px-4 py-3 font-semibold text-primary">{formatCentsBRL(r.price_cents)}</td>
                <td className="px-4 py-3">{r.estimated_days ?? "—"}</td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() =>
                      startTransition(async () => {
                        await toggleShippingRuleAction(r.id, !r.active);
                        router.refresh();
                      })
                    }
                    className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase ${
                      r.active ? "bg-green-100 text-green-800" : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {r.active ? "Ativo" : "Off"}
                  </button>
                </td>
                <td className="px-4 py-3 space-x-2">
                  <button
                    type="button"
                    className="text-[10px] font-bold uppercase text-primary"
                    onClick={() => {
                      setEditingId(r.id);
                      setForm({
                        uf: r.uf,
                        name: r.name,
                        price_reais: centsToInput(r.price_cents),
                        estimated_days: String(r.estimated_days ?? ""),
                        active: r.active,
                      });
                    }}
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    className="text-[10px] font-bold uppercase text-red-600"
                    onClick={() => {
                      if (!confirm("Excluir esta regra?")) return;
                      startTransition(async () => {
                        await deleteShippingRuleAction(r.id);
                        router.refresh();
                      });
                    }}
                  >
                    Excluir
                  </button>
                </td>
              </tr>
            ))}
            {initialRules.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-[var(--text-muted)]">
                  Nenhuma regra cadastrada.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
