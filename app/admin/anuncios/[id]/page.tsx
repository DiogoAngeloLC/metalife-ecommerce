import { notFound } from "next/navigation";
import Link from "next/link";
import { requireAdmin } from "@/lib/supabase/auth";
import { createServiceClient } from "@/lib/supabase/server";
import { AdminVariantsManager } from "@/components/admin/admin-variants-manager";
import { formatBRL } from "@/lib/format";

export const dynamic = "force-dynamic";

type Props = { params: { id: string } };

export async function generateMetadata({ params }: Props) {
  return { title: `Produto ${params.id.slice(0, 8)} · Admin` };
}

export default async function AdminListingDetailPage({ params }: Props) {
  await requireAdmin();
  const supabase = createServiceClient();

  const { data: listing } = await supabase
    .from("listings")
    .select("id, title, slug, price, has_fixed_price, status, equipment_type, brand")
    .eq("id", params.id)
    .single();

  if (!listing) notFound();

  const { data: variants } = await supabase
    .from("listing_variants")
    .select("*")
    .eq("listing_id", listing.id)
    .order("created_at", { ascending: true });

  return (
    <div className="p-6 md:p-8 max-w-5xl">
      <div className="mb-6">
        <Link
          href="/admin/anuncios"
          className="text-label-bold text-[var(--text-muted)] hover:text-[var(--ink)]"
        >
          ← Produtos
        </Link>
        <h1 className="mt-2 font-display text-3xl font-bold uppercase text-[var(--ink)]">
          {listing.title}
        </h1>
        <p className="mt-1 text-sm text-[var(--ink-soft)]">
          {listing.brand ? `${listing.brand} · ` : ""}
          {listing.equipment_type}
          {listing.has_fixed_price && listing.price != null
            ? ` · Base ${formatBRL(listing.price)}`
            : ""}
          {" · "}
          <Link href={`/${listing.slug}`} className="text-primary underline" target="_blank">
            Ver na loja
          </Link>
        </p>
      </div>

      <section className="rounded-md border border-[var(--line)] bg-white p-6">
        <div className="mb-4">
          <div className="text-label-bold text-[var(--text-muted)] mb-1">
            VARIAÇÕES STR / STF
          </div>
          <h2 className="font-display text-xl font-bold uppercase">
            Cores, códigos Protheus e estoque
          </h2>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            Cada combinação de Estrutura (STR) e Estofado (STF) vira uma variação
            selecionável na página do produto.
          </p>
        </div>
        <AdminVariantsManager listingId={listing.id} initialVariants={variants ?? []} />
      </section>
    </div>
  );
}
