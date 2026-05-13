"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Brand } from "@/lib/site-config";
import { FieldLabel, InputBlock } from "@/components/ui/input-block";
import { Button } from "@/components/ui/button";
import { updateBrandAction } from "@/app/admin/identidade/actions";

export function BrandEditor({ brand }: { brand: Brand }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div className="p-8 max-w-3xl space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold uppercase">Identidade</h1>
        <p className="text-sm text-[var(--text-muted)] mt-1">
          Nome, tagline e imagens. Formatos aceitos no storage: JPEG, PNG, WebP (até 5&nbsp;MB).
        </p>
      </div>

      {error && (
        <div className="border border-[var(--danger)] bg-[var(--danger-bg)] px-4 py-3 text-sm text-[var(--danger)]">
          {error}
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          setError(null);
          startTransition(async () => {
            try {
              await updateBrandAction(fd);
              router.refresh();
            } catch (err) {
              setError(err instanceof Error ? err.message : "Erro ao salvar");
            }
          });
        }}
        className="space-y-10"
      >
        <section className="border border-[var(--line)] bg-white p-6 space-y-4">
          <div>
            <FieldLabel>Nome do marketplace</FieldLabel>
            <InputBlock name="name" required defaultValue={brand.name} />
          </div>
          <div>
            <FieldLabel>Tagline</FieldLabel>
            <InputBlock name="tagline" defaultValue={brand.tagline} />
          </div>
        </section>

        <AssetRow
          title="Logo (fundo claro)"
          inputName="logo"
          removeName="remove_logo"
          previewUrl={brand.logo_url}
        />
        <AssetRow
          title="Logo (fundo escuro, opcional)"
          inputName="logo_dark"
          removeName="remove_logo_dark"
          previewUrl={brand.logo_dark_url}
        />
        <AssetRow
          title="Favicon"
          inputName="favicon"
          removeName="remove_favicon"
          previewUrl={brand.favicon_url}
          hint="32×32 ou 192×192 recomendado."
        />
        <AssetRow
          title="Imagem Open Graph"
          inputName="og_image"
          removeName="remove_og_image"
          previewUrl={brand.og_image_url}
          hint="1200×630 recomendado para compartilhamento."
          largePreview
        />

        <Button
          type="submit"
          disabled={pending}
          className="!h-auto !rounded-none bg-[var(--action)] px-8 py-3 text-white hover:opacity-90"
        >
          Salvar
        </Button>
      </form>
    </div>
  );
}

function AssetRow({
  title,
  inputName,
  removeName,
  previewUrl,
  hint,
  largePreview,
}: {
  title: string;
  inputName: string;
  removeName: string;
  previewUrl: string | null;
  hint?: string;
  largePreview?: boolean;
}) {
  return (
    <section className="border border-[var(--line)] bg-white p-6 space-y-3">
      <h2 className="font-display text-sm font-bold uppercase">{title}</h2>
      {hint && <p className="text-xs text-[var(--text-muted)]">{hint}</p>}
      {previewUrl && (
        <div className="flex flex-wrap items-end gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewUrl}
            alt=""
            className={
              largePreview ? "max-h-40 w-auto border border-[var(--line)]" : "h-12 w-auto border border-[var(--line)]"
            }
          />
          <label className="inline-flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" name={removeName} value="1" className="accent-[var(--action)]" />
            Remover atual
          </label>
        </div>
      )}
      <input type="file" name={inputName} accept="image/jpeg,image/png,image/webp" className="text-sm" />
    </section>
  );
}
