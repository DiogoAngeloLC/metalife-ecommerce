import Link from "next/link";
import { createServiceClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AdminOverviewPage() {
  const supabase = createServiceClient();

  const [
    { count: pendingCount },
    { count: activeCount },
    { count: totalListings },
    { count: totalVendors },
    { count: totalLeads },
    { count: leadsToday },
  ] = await Promise.all([
    supabase.from("listings").select("*", { count: "exact", head: true }).eq("status", "pending_review"),
    supabase.from("listings").select("*", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("listings").select("*", { count: "exact", head: true }),
    supabase.from("vendors").select("*", { count: "exact", head: true }),
    supabase.from("leads").select("*", { count: "exact", head: true }),
    supabase.from("leads").select("*", { count: "exact", head: true }).gt("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
  ]);

  const stats = [
    { label: "Aguardando aprovação", value: pendingCount ?? 0, accent: "terra" as const, href: "/admin/anuncios?status=pending_review" },
    { label: "Anúncios ativos", value: activeCount ?? 0, accent: "sage" as const, href: "/admin/anuncios?status=active" },
    { label: "Total de anúncios", value: totalListings ?? 0, accent: "muted" as const },
    { label: "Vendedores cadastrados", value: totalVendors ?? 0, accent: "muted" as const, href: "/admin/usuarios" },
    { label: "Leads (total)", value: totalLeads ?? 0, accent: "muted" as const, href: "/admin/leads" },
    { label: "Leads (últimas 24h)", value: leadsToday ?? 0, accent: "sage" as const },
  ];

  return (
    <div className="p-8 md:p-12">
      <div className="mb-10">
        <div className="text-xs uppercase tracking-[0.25em] text-[var(--text-muted)] mb-2">Painel administrativo</div>
        <h1 className="font-display text-4xl md:text-5xl">Visão geral</h1>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map((s) => {
          const colorMap = { terra: "var(--terra)", sage: "var(--sage)", muted: "var(--ink)" };
          const card = (
            <div className="bg-[var(--bg-card)] border border-[var(--line)] rounded-2xl p-6 transition hover:border-[var(--text-muted)]">
              <div className="text-xs uppercase tracking-wider text-[var(--text-muted)] mb-3">{s.label}</div>
              <div className="font-display text-4xl md:text-5xl" style={{ color: colorMap[s.accent] }}>
                {s.value}
              </div>
            </div>
          );
          return s.href ? (
            <Link key={s.label} href={s.href} className="block">
              {card}
            </Link>
          ) : (
            <div key={s.label}>{card}</div>
          );
        })}
      </div>
    </div>
  );
}
