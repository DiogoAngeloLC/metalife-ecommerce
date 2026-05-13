"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { ThemeTokens } from "@/lib/site-config";
import { FieldLabel, InputBlock } from "@/components/ui/input-block";
import { Button } from "@/components/ui/button";
import { resetThemeAction, updateThemeAction } from "@/app/admin/tema/actions";

const COLOR_KEYS = [
  "action",
  "action_dark",
  "trust",
  "ink",
  "ink_soft",
  "muted",
  "bg",
  "bg_elevated",
  "bg_section",
  "bg_dark",
  "line",
  "line_strong",
  "success",
  "danger",
] as const;

function labelForColorKey(key: string) {
  return key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function pxToNum(px: string) {
  const n = parseInt(String(px).replace(/px/gi, "").trim(), 10);
  return Number.isFinite(n) ? n : 0;
}

function numToPx(n: number) {
  return `${Math.round(n)}px`;
}

const DISPLAY_OPTIONS: { value: ThemeTokens["typography"]["font_display"]; label: string }[] = [
  { value: "montserrat", label: "Montserrat" },
  { value: "playfair", label: "Playfair Display" },
  { value: "inter", label: "Inter" },
  { value: "bebas", label: "Bebas Neue" },
  { value: "roboto", label: "Roboto" },
  { value: "open_sans", label: "Open Sans" },
];

const BODY_OPTIONS: { value: ThemeTokens["typography"]["font_body"]; label: string }[] = [
  { value: "inter", label: "Inter" },
  { value: "roboto", label: "Roboto" },
  { value: "source_sans", label: "Source Sans 3" },
  { value: "open_sans", label: "Open Sans" },
];

const WEIGHT_DISPLAY = ["400", "500", "700", "800", "900"];
const WEIGHT_BODY = ["400", "500", "600", "700"];

export function ThemeBuilderContent({ initialTokens }: { initialTokens: ThemeTokens }) {
  const router = useRouter();
  const [tokens, setTokens] = useState<ThemeTokens>(initialTokens);
  const [iframeKey, setIframeKey] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    setTokens(initialTokens);
  }, [initialTokens]);

  const setColor = useCallback((key: string, value: string) => {
    setTokens((t) => ({
      ...t,
      colors: { ...t.colors, [key]: value },
    }));
  }, []);

  const radiusBaseNum = pxToNum(tokens.shape.radius_base);
  const radiusCardNum = pxToNum(tokens.shape.radius_card);
  const scaleNum = parseFloat(tokens.typography.scale) || 1;

  return (
    <div className="p-8 max-w-[1600px] mx-auto">
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold uppercase">Tema</h1>
        <p className="text-sm text-[var(--text-muted)] mt-1">
          Cores, tipografia e cantos. Visualização ao vivo na home.
        </p>
      </div>

      {error && (
        <div className="mb-4 border border-[var(--danger)] bg-[var(--danger-bg)] px-4 py-3 text-sm text-[var(--danger)]">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_minmax(320px,40%)] gap-8 min-h-[720px]">
        <div className="space-y-8 overflow-y-auto pr-2">
          <section className="border border-[var(--line)] bg-white p-6 space-y-4">
            <h2 className="font-display text-lg font-bold uppercase">Cores</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {COLOR_KEYS.map((key) => (
                <div key={key}>
                  <FieldLabel>{labelForColorKey(key)}</FieldLabel>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={
                        /^#[0-9a-fA-F]{6}$/.test(tokens.colors[key] ?? "")
                          ? (tokens.colors[key] as string).slice(0, 7)
                          : "#000000"
                      }
                      onChange={(e) => setColor(key, e.target.value)}
                      className="h-10 w-12 shrink-0 border border-[var(--line)] cursor-pointer bg-white p-0"
                      aria-label={labelForColorKey(key)}
                    />
                    <InputBlock
                      value={tokens.colors[key] ?? ""}
                      onChange={(e) => setColor(key, e.target.value)}
                      className="font-mono text-sm"
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="border border-[var(--line)] bg-white p-6 space-y-4">
            <h2 className="font-display text-lg font-bold uppercase">Tipografia</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <FieldLabel>Fonte display</FieldLabel>
                <select
                  className="w-full border border-[var(--line)] bg-white px-4 py-3 text-sm outline-none focus:border-[var(--action)]"
                  value={tokens.typography.font_display}
                  onChange={(e) =>
                    setTokens((t) => ({
                      ...t,
                      typography: {
                        ...t.typography,
                        font_display: e.target.value as ThemeTokens["typography"]["font_display"],
                      },
                    }))
                  }
                >
                  {DISPLAY_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <FieldLabel>Fonte corpo</FieldLabel>
                <select
                  className="w-full border border-[var(--line)] bg-white px-4 py-3 text-sm outline-none focus:border-[var(--action)]"
                  value={tokens.typography.font_body}
                  onChange={(e) =>
                    setTokens((t) => ({
                      ...t,
                      typography: {
                        ...t.typography,
                        font_body: e.target.value as ThemeTokens["typography"]["font_body"],
                      },
                    }))
                  }
                >
                  {BODY_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <FieldLabel>Peso display</FieldLabel>
                <select
                  className="w-full border border-[var(--line)] bg-white px-4 py-3 text-sm outline-none focus:border-[var(--action)]"
                  value={tokens.typography.weight_display}
                  onChange={(e) =>
                    setTokens((t) => ({
                      ...t,
                      typography: { ...t.typography, weight_display: e.target.value },
                    }))
                  }
                >
                  {WEIGHT_DISPLAY.map((w) => (
                    <option key={w} value={w}>
                      {w}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <FieldLabel>Peso corpo</FieldLabel>
                <select
                  className="w-full border border-[var(--line)] bg-white px-4 py-3 text-sm outline-none focus:border-[var(--action)]"
                  value={tokens.typography.weight_body}
                  onChange={(e) =>
                    setTokens((t) => ({
                      ...t,
                      typography: { ...t.typography, weight_body: e.target.value },
                    }))
                  }
                >
                  {WEIGHT_BODY.map((w) => (
                    <option key={w} value={w}>
                      {w}
                    </option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <FieldLabel>Escala do texto ({scaleNum.toFixed(2)}×)</FieldLabel>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min={0.85}
                    max={1.15}
                    step={0.05}
                    value={scaleNum}
                    onChange={(e) =>
                      setTokens((t) => ({
                        ...t,
                        typography: { ...t.typography, scale: e.target.value },
                      }))
                    }
                    className="flex-1"
                  />
                  <p
                    className="text-sm text-[var(--ink-soft)] shrink-0"
                    style={{ fontSize: `calc(0.875rem * ${scaleNum})` }}
                  >
                    Texto de exemplo
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="border border-[var(--line)] bg-white p-6 space-y-4">
            <h2 className="font-display text-lg font-bold uppercase">Forma</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <FieldLabel>Raio base ({tokens.shape.radius_base})</FieldLabel>
                <input
                  type="range"
                  min={0}
                  max={24}
                  value={radiusBaseNum}
                  onChange={(e) =>
                    setTokens((t) => ({
                      ...t,
                      shape: { ...t.shape, radius_base: numToPx(Number(e.target.value)) },
                    }))
                  }
                  className="w-full"
                />
              </div>
              <div>
                <FieldLabel>Raio cards ({tokens.shape.radius_card})</FieldLabel>
                <input
                  type="range"
                  min={0}
                  max={32}
                  value={radiusCardNum}
                  onChange={(e) =>
                    setTokens((t) => ({
                      ...t,
                      shape: { ...t.shape, radius_card: numToPx(Number(e.target.value)) },
                    }))
                  }
                  className="w-full"
                />
              </div>
              <div className="sm:col-span-2 flex flex-wrap items-end gap-6">
                <button
                  type="button"
                  className="bg-[var(--action)] px-5 py-2.5 text-sm font-bold uppercase tracking-wider text-white"
                  style={{ borderRadius: tokens.shape.radius_base }}
                >
                  Botão
                </button>
                <div
                  className="border border-[var(--line)] bg-[var(--bg-section)] px-6 py-4 text-sm text-[var(--ink-soft)]"
                  style={{ borderRadius: tokens.shape.radius_card }}
                >
                  Card de pré-visualização
                </div>
              </div>
            </div>
          </section>

          <div className="flex flex-wrap gap-3 pb-8">
            <Button
              type="button"
              className="!h-auto !rounded-none bg-[var(--action)] px-6 py-3 text-white hover:opacity-90"
              disabled={pending}
              onClick={() => {
                setError(null);
                startTransition(async () => {
                  try {
                    await updateThemeAction(tokens);
                    setIframeKey((k) => k + 1);
                    router.refresh();
                  } catch (e) {
                    setError(e instanceof Error ? e.message : "Erro ao salvar");
                  }
                });
              }}
            >
              Salvar e aplicar
            </Button>
            <Button
              type="button"
              variant="outline"
              className="!h-auto !rounded-none px-6 py-3"
              disabled={pending}
              onClick={() => {
                setError(null);
                startTransition(async () => {
                  try {
                    await resetThemeAction();
                    setIframeKey((k) => k + 1);
                    router.refresh();
                  } catch (e) {
                    setError(e instanceof Error ? e.message : "Erro ao resetar");
                  }
                });
              }}
            >
              Resetar pro padrão
            </Button>
          </div>
        </div>

        <div className="hidden lg:flex flex-col border border-[var(--line)] bg-[var(--bg-section)] min-h-[560px] sticky top-4 self-start h-[calc(100vh-6rem)] max-h-[900px]">
          <div className="text-label-bold text-[var(--ink-soft)] px-3 py-2 border-b border-[var(--line)] bg-white">
            Pré-visualização (home)
          </div>
          <iframe
            title="Preview home"
            src={`/?_refresh=${iframeKey}`}
            className="w-full flex-1 min-h-0 border-0 bg-white"
          />
        </div>
      </div>
    </div>
  );
}
