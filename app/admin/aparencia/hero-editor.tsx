"use client";

import { useTransition, useRef } from "react";
import { updateHeroAction } from "./actions";
import type { HeroSettings } from "@/lib/content";

export function HeroEditor({ hero }: { hero: HeroSettings }) {
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      try {
        await updateHeroAction(formData);
        alert("Hero atualizado!");
      } catch (err) {
        alert(err instanceof Error ? err.message : "Erro ao salvar");
      }
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Form */}
      <div className="border border-[var(--line)] bg-white p-6">
        <h2 className="font-display text-lg font-bold uppercase mb-4">Hero da Home</h2>
        <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-label-bold text-[var(--text-muted)] block mb-1">Eyebrow</label>
            <input
              name="eyebrow"
              defaultValue={hero.eyebrow}
              className="w-full border border-[var(--line)] px-3 py-2 text-sm outline-none focus:border-[var(--action)]"
            />
          </div>
          <div>
            <label className="text-label-bold text-[var(--text-muted)] block mb-1">Título</label>
            <input
              name="title"
              defaultValue={hero.title}
              className="w-full border border-[var(--line)] px-3 py-2 text-sm outline-none focus:border-[var(--action)]"
            />
          </div>
          <div>
            <label className="text-label-bold text-[var(--text-muted)] block mb-1">Subtítulo</label>
            <textarea
              name="subtitle"
              defaultValue={hero.subtitle}
              rows={3}
              className="w-full border border-[var(--line)] px-3 py-2 text-sm outline-none focus:border-[var(--action)] resize-none"
            />
          </div>
          <div>
            <label className="text-label-bold text-[var(--text-muted)] block mb-1">Imagem de fundo</label>
            <input
              name="image"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="w-full text-sm text-[var(--ink-soft)]"
            />
            <p className="text-xs text-[var(--text-muted)] mt-1">JPG, PNG ou WebP. Máx 5MB. Deixe vazio pra manter a atual.</p>
          </div>
          <button
            type="submit"
            disabled={isPending}
            className="w-full bg-[var(--action)] text-white py-3 font-display text-sm font-bold uppercase tracking-wider hover:bg-[var(--action-dark)] transition disabled:opacity-40"
          >
            {isPending ? "Salvando..." : "Salvar hero"}
          </button>
        </form>
      </div>

      {/* Preview */}
      <div className="border border-[var(--line)] bg-[var(--bg-dark)] p-6 text-white">
        <h3 className="text-label-bold text-white/60 mb-4">Preview</h3>
        <div className="relative overflow-hidden">
          {hero.image_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={hero.image_url} alt="" className="absolute inset-0 w-full h-full object-cover opacity-30" />
          )}
          <div className="relative p-6">
            <div className="inline-block bg-[var(--action)] text-white px-2 py-0.5 text-[10px] font-bold uppercase mb-2">
              {hero.eyebrow}
            </div>
            <h2 className="font-display text-xl font-bold uppercase leading-tight mb-2">
              {hero.title}
            </h2>
            <p className="text-sm text-white/70">
              {hero.subtitle}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
