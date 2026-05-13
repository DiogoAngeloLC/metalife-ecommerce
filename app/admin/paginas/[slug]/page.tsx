import { requireAdmin } from "@/lib/supabase/auth";
import { getLegalPage } from "@/lib/content";
import { notFound } from "next/navigation";
import { LegalPageEditor } from "./legal-page-editor";

export const dynamic = "force-dynamic";

export default async function EditLegalPage({ params }: { params: { slug: string } }) {
  await requireAdmin();
  const page = await getLegalPage(params.slug);
  if (!page) notFound();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold uppercase">Editar: {page.title}</h1>
        <p className="text-sm text-[var(--text-muted)] mt-1">
          Conteúdo em Markdown. Ao salvar, a página pública é atualizada imediatamente.
        </p>
      </div>

      <LegalPageEditor
        slug={params.slug}
        title={page.title}
        contentMd={page.content_md}
      />
    </div>
  );
}
