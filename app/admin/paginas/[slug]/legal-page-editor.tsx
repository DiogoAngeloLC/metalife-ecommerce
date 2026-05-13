"use client";

import { useState, useTransition } from "react";
import { updateLegalPageAction } from "../actions";
import { marked } from "marked";
import Link from "next/link";

export function LegalPageEditor({
  slug,
  title: initialTitle,
  contentMd: initialContent,
}: {
  slug: string;
  title: string;
  contentMd: string;
}) {
  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState(initialContent);
  const [showPreview, setShowPreview] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleSave = () => {
    startTransition(async () => {
      try {
        await updateLegalPageAction(slug, title, content);
        alert("Página atualizada!");
      } catch (err) {
        alert(err instanceof Error ? err.message : "Erro ao salvar");
      }
    });
  };

  const html = marked.parse(content, { gfm: true, breaks: false }) as string;

  return (
    <div className="space-y-4">
      {/* Title */}
      <div>
        <label className="text-label-bold text-[var(--text-muted)] block mb-1">Título</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full border border-[var(--line)] px-3 py-2 text-sm outline-none focus:border-[var(--action)]"
        />
      </div>

      {/* Toggle */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setShowPreview(false)}
          className={`px-3 py-1.5 text-label-bold transition ${!showPreview ? "bg-[var(--ink)] text-white" : "text-[var(--ink-soft)]"}`}
        >
          Markdown
        </button>
        <button
          type="button"
          onClick={() => setShowPreview(true)}
          className={`px-3 py-1.5 text-label-bold transition ${showPreview ? "bg-[var(--ink)] text-white" : "text-[var(--ink-soft)]"}`}
        >
          Preview
        </button>
        <div className="flex-1" />
        <Link
          href={`/${slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-label-bold text-[var(--action)] hover:underline"
        >
          Ver página pública
        </Link>
      </div>

      {/* Editor / Preview */}
      {showPreview ? (
        <div className="border border-[var(--line)] bg-white p-6 min-h-[400px]">
          <article
            className="prose prose-slate max-w-none prose-headings:font-display prose-headings:uppercase prose-h2:text-2xl prose-h2:mt-8 prose-h2:mb-3"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </div>
      ) : (
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={20}
          className="w-full border border-[var(--line)] px-4 py-3 text-sm font-mono outline-none focus:border-[var(--action)] resize-y min-h-[400px] bg-white"
        />
      )}

      <button
        type="button"
        onClick={handleSave}
        disabled={isPending}
        className="bg-[var(--action)] text-white px-8 py-3 font-display text-sm font-bold uppercase tracking-wider hover:bg-[var(--action-dark)] transition disabled:opacity-40"
      >
        {isPending ? "Salvando..." : "Salvar página"}
      </button>
    </div>
  );
}
