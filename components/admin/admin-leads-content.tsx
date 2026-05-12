"use client";

import { useState } from "react";
import Link from "next/link";
import { ExternalLink, Phone, Mail } from "lucide-react";

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  pending: { label: "Pendente", color: "text-[var(--text-muted)]" },
  validated: { label: "Validado", color: "text-[var(--success)]" },
  sent: { label: "Enviado", color: "text-[var(--success)]" },
  failed: { label: "Falha", color: "text-red-700" },
};

/* eslint-disable @typescript-eslint/no-explicit-any */
export function AdminLeadsContent({ leads }: { leads: any[] }) {
  const [filter, setFilter] = useState<string>("all");

  const filtered = leads.filter((l) => filter === "all" || l.status === filter);

  const exportCSV = () => {
    const rows = [
      ["Data", "Nome", "WhatsApp", "Email", "Anúncio", "Vendedor", "Status"],
      ...filtered.map((l: any) => [
        new Date(l.created_at).toLocaleString("pt-BR"),
        l.name,
        l.whatsapp,
        l.email,
        l.listings?.title ?? "—",
        l.listings?.vendors?.name ?? "—",
        l.status,
      ]),
    ];
    const csv = rows.map((r) => r.map((c: string) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `leads-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-8 md:p-12">
      <div className="flex flex-col md:flex-row justify-between gap-4 mb-8">
        <div>
          <div className="text-xs uppercase tracking-[0.25em] text-[var(--text-muted)] mb-2">Compradores interessados</div>
          <h1 className="font-display text-4xl md:text-5xl">Leads</h1>
        </div>
        <button
          onClick={exportCSV}
          className="self-start text-sm bg-[var(--ink)] text-white px-5 py-2.5  hover:opacity-90 transition"
        >
          Exportar CSV
        </button>
      </div>

      <div className="flex items-center gap-2 mb-6 overflow-x-auto">
        {[
          { key: "all", label: "Todos" },
          { key: "pending", label: "Pendentes" },
          { key: "sent", label: "Enviados" },
          { key: "failed", label: "Falhas" },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setFilter(t.key)}
            className={`whitespace-nowrap text-sm px-4 py-1.5  transition ${
              filter === t.key
                ? "bg-[var(--ink)] text-white"
                : "text-[var(--ink-soft)] hover:bg-[var(--bg-section)]"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white border border-dashed border-[var(--line)]  p-12 text-center">
          <p className="text-[var(--text-muted)]">Nenhum lead.</p>
        </div>
      ) : (
        <div className="bg-white border border-[var(--line)]  overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[var(--bg-section)] border-b border-[var(--line)]">
                <tr className="text-left">
                  <th className="p-4 text-xs uppercase tracking-wider text-[var(--text-muted)] font-medium">Data</th>
                  <th className="p-4 text-xs uppercase tracking-wider text-[var(--text-muted)] font-medium">Comprador</th>
                  <th className="p-4 text-xs uppercase tracking-wider text-[var(--text-muted)] font-medium">Anúncio</th>
                  <th className="p-4 text-xs uppercase tracking-wider text-[var(--text-muted)] font-medium">Vendedor</th>
                  <th className="p-4 text-xs uppercase tracking-wider text-[var(--text-muted)] font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((l: any) => {
                  const status = STATUS_LABEL[l.status] ?? { label: l.status, color: "text-[var(--text-muted)]" };
                  return (
                    <tr key={l.id} className="border-b border-[var(--line)] last:border-0">
                      <td className="p-4 text-xs text-[var(--text-muted)] whitespace-nowrap">
                        {new Date(l.created_at).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}
                      </td>
                      <td className="p-4">
                        <div className="font-medium">{l.name}</div>
                        <div className="text-xs text-[var(--text-muted)] flex items-center gap-3 mt-1">
                          <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{l.whatsapp}</span>
                          <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{l.email}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        {l.listings ? (
                          <Link href={`/${l.listings.slug}`} target="_blank" className="flex items-center gap-1 hover:text-[var(--action)] transition">
                            {l.listings.title}
                            <ExternalLink className="w-3 h-3" />
                          </Link>
                        ) : (
                          <span className="text-[var(--text-muted)]">—</span>
                        )}
                      </td>
                      <td className="p-4">
                        {l.listings?.vendors?.name ?? <span className="text-[var(--text-muted)]">—</span>}
                      </td>
                      <td className={`p-4 ${status.color} font-medium text-xs uppercase tracking-wider`}>
                        {status.label}
                        {l.error_message && (
                          <div className="text-[10px] text-red-700 normal-case font-normal mt-1">
                            {l.error_message}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
