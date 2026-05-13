"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { MenuItem } from "@/lib/site-config";
import { FieldLabel, InputBlock } from "@/components/ui/input-block";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { updateMenuAction } from "@/app/admin/menu/actions";

export function MenuEditor({ initialItems }: { initialItems: MenuItem[] }) {
  const router = useRouter();
  const [items, setItems] = useState<MenuItem[]>(initialItems);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    setItems(initialItems);
  }, [initialItems]);

  const nextOrder = () => (items.length ? Math.max(...items.map((i) => i.order), 0) + 1 : 1);

  const updateRow = (idx: number, patch: Partial<MenuItem>) => {
    setItems((rows) => rows.map((row, i) => (i === idx ? { ...row, ...patch } : row)));
  };

  const removeRow = (idx: number) => {
    setItems((rows) => rows.filter((_, i) => i !== idx));
  };

  const addRow = () => {
    if (items.length >= 8) return;
    setItems((rows) => [...rows, { label: "", href: "", external: false, order: nextOrder() }]);
  };

  return (
    <div className="p-8 max-w-3xl space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold uppercase">Menu principal</h1>
        <p className="text-sm text-[var(--text-muted)] mt-1">Até 8 itens. Use a ordem numérica para reorganizar.</p>
      </div>

      {error && (
        <div className="border border-[var(--danger)] bg-[var(--danger-bg)] px-4 py-3 text-sm text-[var(--danger)]">{error}</div>
      )}

      <div className="space-y-4">
        {items.map((item, idx) => (
          <div key={`${idx}-${item.order}`} className="border border-[var(--line)] bg-white p-4 grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
            <div className="sm:col-span-3">
              <FieldLabel>Label</FieldLabel>
              <InputBlock value={item.label} onChange={(e) => updateRow(idx, { label: e.target.value })} />
            </div>
            <div className="sm:col-span-5">
              <FieldLabel>URL</FieldLabel>
              <InputBlock value={item.href} onChange={(e) => updateRow(idx, { href: e.target.value })} placeholder="/catalogo ou https://..." />
            </div>
            <div className="sm:col-span-2">
              <FieldLabel>Ordem</FieldLabel>
              <InputBlock
                type="number"
                min={1}
                value={item.order}
                onChange={(e) => updateRow(idx, { order: Number(e.target.value) || 1 })}
              />
            </div>
            <div className="sm:col-span-1 flex items-center gap-2 pb-2">
              <input
                type="checkbox"
                id={`ext-${idx}`}
                checked={item.external}
                onChange={(e) => updateRow(idx, { external: e.target.checked })}
                className="accent-[var(--action)]"
              />
              <Label htmlFor={`ext-${idx}`} className="text-xs font-normal cursor-pointer">
                Nova aba
              </Label>
            </div>
            <div className="sm:col-span-1">
              <Button type="button" variant="outline" className="w-full !rounded-none text-xs" onClick={() => removeRow(idx)}>
                Remover
              </Button>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        <Button type="button" variant="secondary" className="!rounded-none" onClick={addRow} disabled={items.length >= 8}>
          + Novo item
        </Button>
        <Button
          type="button"
          className="!rounded-none bg-[var(--action)] px-8 py-3 text-white hover:opacity-90"
          disabled={pending}
          onClick={() => {
            setError(null);
            startTransition(async () => {
              try {
                await updateMenuAction(items);
                router.refresh();
              } catch (e) {
                setError(e instanceof Error ? e.message : "Erro ao salvar");
              }
            });
          }}
        >
          Salvar
        </Button>
      </div>
    </div>
  );
}
