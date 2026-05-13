import { marked } from "marked";

export function LegalPageRender({
  title,
  contentMd,
  updatedAt,
}: {
  title: string;
  contentMd: string;
  updatedAt: string;
}) {
  const html = marked.parse(contentMd, { gfm: true, breaks: false }) as string;

  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-6 py-16 md:py-24">
        <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--text-muted)] mb-3">
          Institucional
        </div>
        <h1 className="font-display text-4xl md:text-5xl font-bold text-[var(--ink)] mb-2 tracking-tight uppercase">
          {title}
        </h1>
        <p className="text-sm text-[var(--text-muted)] mb-12">
          Última atualização: {new Date(updatedAt).toLocaleDateString("pt-BR")}
        </p>
        <article
          className="prose prose-slate max-w-none prose-headings:font-display prose-headings:tracking-tight prose-headings:uppercase prose-h2:text-2xl prose-h2:mt-12 prose-h2:mb-4 prose-h3:text-lg prose-a:text-[var(--action)] prose-a:no-underline hover:prose-a:underline"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>
    </main>
  );
}
