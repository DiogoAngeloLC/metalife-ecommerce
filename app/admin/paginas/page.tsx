import Link from "next/link";
import { requireAdmin } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";
import { FileText } from "lucide-react";

export const dynamic = "force-dynamic";
export const metadata = { title: "Páginas · Admin" };

export default async function PaginasPage() {
  await requireAdmin();
  const supabase = createClient();

  const { data: pages } = await supabase
    .from("legal_pages")
    .select("slug, title, updated_at")
    .order("slug");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold uppercase">Páginas</h1>
        <p className="text-sm text-[var(--text-muted)] mt-1">
          Gerencie o conteúdo das páginas legais (Markdown).
        </p>
      </div>

      <div className="space-y-2">
        {(pages ?? []).map((page) => (
          <Link
            key={page.slug}
            href={`/admin/paginas/${page.slug}`}
            className="flex items-center gap-4 border border-[var(--line)] bg-white p-4 hover:border-[var(--action)] transition"
          >
            <FileText className="h-5 w-5 text-[var(--action)]" />
            <div className="flex-1">
              <div className="font-display text-sm font-bold uppercase">{page.title}</div>
              <div className="text-xs text-[var(--text-muted)]">
                /{page.slug} · Atualizado em {new Date(page.updated_at).toLocaleDateString("pt-BR")}
              </div>
            </div>
            <span className="text-label-bold text-[var(--action)]">Editar</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
