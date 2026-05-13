"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { FooterConfig } from "@/lib/site-config";
import { FieldLabel, InputBlock } from "@/components/ui/input-block";
import { Button } from "@/components/ui/button";
import { updateFooterAction } from "@/app/admin/rodape/actions";

const SOCIAL_DEF: { platform: string; label: string }[] = [
  { platform: "instagram", label: "Instagram" },
  { platform: "facebook", label: "Facebook" },
  { platform: "linkedin", label: "LinkedIn" },
  { platform: "youtube", label: "YouTube" },
  { platform: "tiktok", label: "TikTok" },
  { platform: "twitter", label: "X / Twitter" },
];

function mergeSocial(initial: FooterConfig): FooterConfig["social"] {
  const map = new Map(initial.social.map((s) => [s.platform, s.url ?? null]));
  return SOCIAL_DEF.map((d) => ({ platform: d.platform, url: map.get(d.platform) ?? null }));
}

export function FooterEditor({ initial }: { initial: FooterConfig }) {
  const router = useRouter();
  const [config, setConfig] = useState<FooterConfig>(() => ({
    ...initial,
    social: mergeSocial(initial),
  }));
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    setConfig({ ...initial, social: mergeSocial(initial) });
  }, [initial]);

  const setCompany = (patch: Partial<FooterConfig["company"]>) => {
    setConfig((c) => ({ ...c, company: { ...c.company, ...patch } }));
  };

  const updateColumn = (i: number, patch: Partial<FooterConfig["columns"][0]>) => {
    setConfig((c) => {
      const columns = [...c.columns];
      columns[i] = { ...columns[i], ...patch };
      return { ...c, columns };
    });
  };

  const updateLink = (ci: number, li: number, patch: Partial<{ label: string; href: string }>) => {
    setConfig((c) => {
      const columns = c.columns.map((col, i) => {
        if (i !== ci) return col;
        const links = col.links.map((link, j) => (j === li ? { ...link, ...patch } : link));
        return { ...col, links };
      });
      return { ...c, columns };
    });
  };

  const addLink = (ci: number) => {
    setConfig((c) => {
      const columns = c.columns.map((col, i) =>
        i === ci ? { ...col, links: [...col.links, { label: "", href: "" }] } : col
      );
      return { ...c, columns };
    });
  };

  const removeLink = (ci: number, li: number) => {
    setConfig((c) => {
      const columns = c.columns.map((col, i) =>
        i === ci ? { ...col, links: col.links.filter((_, j) => j !== li) } : col
      );
      return { ...c, columns };
    });
  };

  const addColumn = () => {
    if (config.columns.length >= 4) return;
    setConfig((c) => ({
      ...c,
      columns: [...c.columns, { title: "Nova coluna", links: [{ label: "", href: "" }] }],
    }));
  };

  const removeColumn = (ci: number) => {
    if (config.columns.length <= 1) return;
    setConfig((c) => ({ ...c, columns: c.columns.filter((_, i) => i !== ci) }));
  };

  return (
    <div className="p-8 max-w-4xl space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold uppercase">Rodapé</h1>
        <p className="text-sm text-[var(--text-muted)] mt-1">Textos, dados da empresa, colunas de links e redes sociais.</p>
      </div>

      {error && (
        <div className="border border-[var(--danger)] bg-[var(--danger-bg)] px-4 py-3 text-sm text-[var(--danger)]">{error}</div>
      )}

      <section className="border border-[var(--line)] bg-white p-6 space-y-3">
        <h2 className="font-display text-sm font-bold uppercase">Descrição</h2>
        <textarea
          className="w-full min-h-[140px] border border-[var(--line)] px-4 py-3 text-sm outline-none focus:border-[var(--action)]"
          value={config.description}
          onChange={(e) => setConfig((c) => ({ ...c, description: e.target.value }))}
        />
      </section>

      <section className="border border-[var(--line)] bg-white p-6 space-y-4">
        <h2 className="font-display text-sm font-bold uppercase">Dados da empresa</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <FieldLabel>Nome</FieldLabel>
            <InputBlock value={config.company.name} onChange={(e) => setCompany({ name: e.target.value })} />
          </div>
          <div>
            <FieldLabel>CNPJ</FieldLabel>
            <InputBlock value={config.company.cnpj ?? ""} onChange={(e) => setCompany({ cnpj: e.target.value || null })} />
          </div>
          <div>
            <FieldLabel>E-mail</FieldLabel>
            <InputBlock value={config.company.email ?? ""} onChange={(e) => setCompany({ email: e.target.value || null })} />
          </div>
          <div>
            <FieldLabel>Telefone</FieldLabel>
            <InputBlock value={config.company.phone ?? ""} onChange={(e) => setCompany({ phone: e.target.value || null })} />
          </div>
          <div className="sm:col-span-2">
            <FieldLabel>Endereço</FieldLabel>
            <InputBlock value={config.company.address ?? ""} onChange={(e) => setCompany({ address: e.target.value || null })} />
          </div>
        </div>
      </section>

      <section className="border border-[var(--line)] bg-white p-6 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-sm font-bold uppercase">Colunas de links</h2>
          <Button type="button" variant="outline" className="!rounded-none text-xs" onClick={addColumn} disabled={config.columns.length >= 4}>
            + Nova coluna
          </Button>
        </div>
        {config.columns.map((col, ci) => (
          <div key={ci} className="border border-[var(--line)] p-4 space-y-3 bg-[var(--bg-section)]/40">
            <div className="flex flex-wrap gap-3 items-end justify-between">
              <div className="flex-1 min-w-[200px]">
                <FieldLabel>Título da coluna</FieldLabel>
                <InputBlock value={col.title} onChange={(e) => updateColumn(ci, { title: e.target.value })} />
              </div>
              <Button
                type="button"
                variant="ghost"
                className="text-[var(--danger)] text-xs"
                onClick={() => removeColumn(ci)}
                disabled={config.columns.length <= 1}
              >
                Remover coluna
              </Button>
            </div>
            <div className="space-y-2">
              {col.links.map((link, li) => (
                <div key={li} className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-2 items-end">
                  <div>
                    <FieldLabel>Label</FieldLabel>
                    <InputBlock value={link.label} onChange={(e) => updateLink(ci, li, { label: e.target.value })} />
                  </div>
                  <div>
                    <FieldLabel>URL</FieldLabel>
                    <InputBlock value={link.href} onChange={(e) => updateLink(ci, li, { href: e.target.value })} placeholder="/catalogo ou https://..." />
                  </div>
                  <Button type="button" variant="outline" className="!rounded-none" onClick={() => removeLink(ci, li)}>
                    Remover
                  </Button>
                </div>
              ))}
            </div>
            <Button type="button" variant="secondary" className="!rounded-none text-xs" onClick={() => addLink(ci)} disabled={col.links.length >= 8}>
              + Novo link
            </Button>
          </div>
        ))}
      </section>

      <section className="border border-[var(--line)] bg-white p-6 space-y-4">
        <h2 className="font-display text-sm font-bold uppercase">Redes sociais</h2>
        <p className="text-xs text-[var(--text-muted)]">URLs públicas (https). Vazio = ícone oculto.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {SOCIAL_DEF.map((def) => {
            const row = config.social.find((s) => s.platform === def.platform);
            const url = row?.url ?? "";
            return (
              <div key={def.platform}>
                <FieldLabel>{def.label}</FieldLabel>
                <InputBlock
                  value={url}
                  onChange={(e) => {
                    const v = e.target.value.trim() || null;
                    setConfig((c) => ({
                      ...c,
                      social: c.social.map((s) => (s.platform === def.platform ? { ...s, url: v } : s)),
                    }));
                  }}
                  placeholder="https://..."
                />
              </div>
            );
          })}
        </div>
      </section>

      <Button
        type="button"
        disabled={pending}
        className="!h-auto !rounded-none bg-[var(--action)] px-8 py-3 text-white hover:opacity-90"
        onClick={() => {
          setError(null);
          startTransition(async () => {
            try {
              await updateFooterAction(config);
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
  );
}
