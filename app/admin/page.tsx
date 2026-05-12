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
    { label: "Aguardando aprovação", value: pendingCount ?? 0, variant: "action" as const, href: "/admin/anuncios?status=pending_review" },
    { label: "Anúncios ativos", value: activeCount ?? 0, variant: "success" as const, href: "/admin/anuncios?status=active" },
    { label: "Total de anúncios", value: totalListings ?? 0, variant: "muted" as const },
    { label: "Vendedores cadastrados", value: totalVendors ?? 0, variant: "muted" as const, href: "/admin/usuarios" },
    { label: "Leads (total)", value: totalLeads ?? 0, variant: "muted" as const, href: "/admin/leads" },
    { label: "Leads (últimas 24h)", value: leadsToday ?? 0, variant: "trust" as const },
  ];

  return (
    <div className="p-6 md:p-10">
      <div className="mb-8">
        <div className="text-label-bold text-[var(--text-muted)] mb-2">PAINEL ADMINISTRATIVO</div>
        <h1 className="font-display text-3xl md:text-4xl font-bold uppercase text-[var(--ink)]">Visão geral</h1>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map((s) => {
          const colorMap = { action: "var(--action)", success: "var(--success)", trust: "var(--trust)", muted: "var(--ink)" };
          const card = (
            <div className="bg-white border border-[var(--line)] p-6 transition hover:border-[var(--action)]">
              <div className="text-label-bold text-[var(--text-muted)] mb-3">{s.label}</div>
              <div className="font-display text-4xl md:text-5xl font-extrabold" style={{ color: colorMap[s.variant] }}>
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
