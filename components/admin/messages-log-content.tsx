"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, RefreshCw, CheckCircle2, Eye, Send, AlertCircle, Clock, ExternalLink } from "lucide-react";
import { retryMessageAction } from "@/app/admin/logs/mensagens/actions";

const STATUS_TABS = [
  { key: "all", label: "Todos" },
  { key: "sent", label: "Enviado" },
  { key: "delivered", label: "Entregue" },
  { key: "read", label: "Lido" },
  { key: "failed", label: "Falha" },
  { key: "queued", label: "Na fila" },
];

const TYPE_LABEL: Record<string, string> = {
  lead_to_buyer: "Lead → comprador",
  lead_to_seller: "Lead → vendedor",
  listing_approved: "Anúncio aprovado",
  listing_rejected: "Anúncio recusado",
};

/* eslint-disable @typescript-eslint/no-explicit-any */
export function MessagesLogContent({
  messages,
  filters,
  title,
  subtitle,
  lockStatus = false,
}: {
  messages: any[];
  filters: { status?: string; type?: string; q?: string };
  title: string;
  subtitle: string;
  lockStatus?: boolean;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [searchValue, setSearchValue] = useState(filters.q ?? "");

  const updateParam = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    const base = lockStatus ? "/admin/logs/erros" : "/admin/logs/mensagens";
    router.push(`${base}?${params.toString()}`);
  };

  const handleRetry = (id: string) => {
    if (!confirm("Reenviar esta mensagem? Será criado um novo registro.")) return;
    startTransition(async () => {
      try {
        await retryMessageAction(id);
        alert("Reenvio disparado. Veja o novo registro no topo.");
      } catch (err) {
        alert(err instanceof Error ? err.message : "Erro");
      }
    });
  };

  return (
    <div className="p-8 md:p-12">
      <div className="mb-8">
        <div className="text-xs uppercase tracking-[0.25em] text-[var(--text-muted)] mb-2">{subtitle}</div>
        <h1 className="font-display text-4xl md:text-5xl">{title}</h1>
      </div>

      {/* Filtros */}
      <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center mb-6">
        <div className="flex items-center gap-2 px-4 py-2 bg-[var(--bg-card)] border border-[var(--line)] rounded-full">
          <Search className="w-4 h-4 text-[var(--text-muted)]" />
          <input
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && updateParam("q", searchValue || null)}
            placeholder="Buscar por número…"
            className="bg-transparent text-sm w-48 outline-none placeholder:text-[var(--text-muted)]"
          />
        </div>

        {!lockStatus && (
          <div className="flex items-center gap-2 overflow-x-auto">
            {STATUS_TABS.map((t) => {
              const isActive = (filters.status ?? "all") === t.key;
              return (
                <button
                  key={t.key}
                  onClick={() => updateParam("status", t.key === "all" ? null : t.key)}
                  className={`whitespace-nowrap text-sm px-4 py-1.5 rounded-full transition ${
                    isActive ? "bg-[var(--ink)] text-white" : "text-[var(--ink-soft)] hover:bg-[var(--bone)]"
                  }`}
                >
                  {t.label}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {messages.length === 0 ? (
        <div className="bg-[var(--bg-card)] border border-dashed border-[var(--line)] rounded-2xl p-12 text-center">
          <p className="text-[var(--text-muted)]">Nenhuma mensagem encontrada.</p>
        </div>
      ) : (
        <div className="bg-[var(--bg-card)] border border-[var(--line)] rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[var(--bone)]/50 border-b border-[var(--line)]">
                <tr className="text-left">
                  <th className="p-3 text-xs uppercase tracking-wider text-[var(--text-muted)] font-medium">Data</th>
                  <th className="p-3 text-xs uppercase tracking-wider text-[var(--text-muted)] font-medium">Tipo</th>
                  <th className="p-3 text-xs uppercase tracking-wider text-[var(--text-muted)] font-medium">Destinatário</th>
                  <th className="p-3 text-xs uppercase tracking-wider text-[var(--text-muted)] font-medium">Status</th>
                  <th className="p-3 text-xs uppercase tracking-wider text-[var(--text-muted)] font-medium">Contexto</th>
                  <th className="p-3"></th>
                </tr>
              </thead>
              <tbody>
                {messages.map((m: any) => (
                  <tr key={m.id} className="border-b border-[var(--line)] last:border-0 hover:bg-[var(--bg)]/50">
                    <td className="p-3 text-xs text-[var(--text-muted)] whitespace-nowrap">
                      {new Date(m.created_at).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}
                    </td>
                    <td className="p-3 text-xs">{TYPE_LABEL[m.message_type] ?? m.message_type}</td>
                    <td className="p-3 text-xs">
                      <div>{m.recipient_phone}</div>
                      <div className="text-[var(--text-muted)] capitalize">{m.recipient_type}</div>
                    </td>
                    <td className="p-3">
                      <StatusBadge status={m.status} />
                      {m.error_message && (
                        <div className="text-[10px] text-red-700 mt-1 max-w-xs truncate">{m.error_message}</div>
                      )}
                    </td>
                    <td className="p-3 text-xs">
                      {m.listings ? (
                        <Link
                          href={`/${m.listings.slug}`}
                          target="_blank"
                          className="hover:text-[var(--terra)] flex items-center gap-1"
                        >
                          {m.listings.title}
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      ) : (
                        <span className="text-[var(--text-muted)]">—</span>
                      )}
                      {m.leads && <div className="text-[var(--text-muted)]">Lead: {m.leads.name}</div>}
                      {m.vendors && <div className="text-[var(--text-muted)]">Vendor: {m.vendors.name}</div>}
                    </td>
                    <td className="p-3">
                      {m.status === "failed" && (
                        <button
                          onClick={() => handleRetry(m.id)}
                          disabled={isPending}
                          className="text-xs px-3 py-1.5 rounded-full bg-[var(--ink)] text-white hover:opacity-90 transition flex items-center gap-1 disabled:opacity-50"
                        >
                          <RefreshCw className="w-3 h-3" /> Reenviar
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
    queued: { label: "Na fila", icon: <Clock className="w-3 h-3" />, color: "text-[var(--text-muted)]" },
    sent: { label: "Enviado", icon: <Send className="w-3 h-3" />, color: "text-[var(--terra)]" },
    delivered: { label: "Entregue", icon: <CheckCircle2 className="w-3 h-3" />, color: "text-[var(--sage)]" },
    read: { label: "Lido", icon: <Eye className="w-3 h-3" />, color: "text-[var(--sage)]" },
    failed: { label: "Falha", icon: <AlertCircle className="w-3 h-3" />, color: "text-red-700" },
  };
  const item = map[status] ?? map.queued;
  return (
    <span className={`text-xs font-medium uppercase tracking-wider flex items-center gap-1 ${item.color}`}>
      {item.icon}
      {item.label}
    </span>
  );
}
