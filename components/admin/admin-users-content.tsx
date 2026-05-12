"use client";

import { useState, useTransition } from "react";
import { Shield, ShieldOff, MapPin } from "lucide-react";
import { makeAdminAction, removeAdminAction } from "@/app/admin/usuarios/actions";

/* eslint-disable @typescript-eslint/no-explicit-any */
export function AdminUsersContent({ vendors }: { vendors: any[] }) {
  const [isPending, startTransition] = useTransition();
  const [filter, setFilter] = useState<"all" | "admin" | "vendor">("all");

  const filtered = vendors.filter((v) => {
    if (filter === "admin") return v.is_admin;
    if (filter === "vendor") return !v.is_admin;
    return true;
  });

  const toggleAdmin = (vendor: any) => {
    if (vendor.is_admin) {
      if (!confirm(`Remover acesso de admin de ${vendor.name || "este usuário"}?`)) return;
      startTransition(async () => {
        try {
          await removeAdminAction(vendor.id);
        } catch (err) {
          alert(err instanceof Error ? err.message : "Erro");
        }
      });
    } else {
      if (!confirm(`Tornar ${vendor.name || "este usuário"} admin? Terá acesso total ao painel.`)) return;
      startTransition(async () => {
        try {
          await makeAdminAction(vendor.id);
        } catch (err) {
          alert(err instanceof Error ? err.message : "Erro");
        }
      });
    }
  };

  return (
    <div className="p-8 md:p-12">
      <div className="mb-8">
        <div className="text-xs uppercase tracking-[0.25em] text-[var(--text-muted)] mb-2">Pessoas</div>
        <h1 className="font-display text-4xl md:text-5xl">Usuários</h1>
      </div>

      <div className="flex items-center gap-2 mb-6">
        {([
          { key: "all", label: "Todos" },
          { key: "admin", label: "Administradores" },
          { key: "vendor", label: "Vendedores" },
        ] as const).map((t) => (
          <button
            key={t.key}
            onClick={() => setFilter(t.key)}
            className={`text-sm px-4 py-1.5 rounded-full transition ${
              filter === t.key
                ? "bg-[var(--ink)] text-white"
                : "text-[var(--ink-soft)] hover:bg-[var(--bone)]"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="bg-[var(--bg-card)] border border-dashed border-[var(--line)] rounded-2xl p-12 text-center">
          <p className="text-[var(--text-muted)]">Nenhum usuário.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((v: any) => (
            <div key={v.id} className="bg-[var(--bg-card)] border border-[var(--line)] rounded-2xl p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-[var(--bone)] flex items-center justify-center font-display text-lg text-[var(--ink-soft)]">
                {(v.name || "?").charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <h3 className="font-display text-lg">{v.name || "Sem nome"}</h3>
                  {v.is_admin && (
                    <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-[var(--terra)] text-white font-medium flex items-center gap-1">
                      <Shield className="w-2.5 h-2.5" /> Admin
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[var(--ink-soft)]">
                  {v.whatsapp && <span>{v.whatsapp}</span>}
                  {v.city && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {v.city}, {v.state}
                    </span>
                  )}
                  <span><strong>{v.listings_count}</strong> {v.listings_count === 1 ? "anúncio" : "anúncios"}</span>
                </div>
              </div>
              <button
                onClick={() => toggleAdmin(v)}
                disabled={isPending}
                className={`text-xs px-3 py-1.5 rounded-full transition flex items-center gap-1 ${
                  v.is_admin
                    ? "text-red-700 hover:bg-red-50"
                    : "bg-[var(--ink)] text-white hover:opacity-90"
                } disabled:opacity-50`}
              >
                {v.is_admin ? (
                  <>
                    <ShieldOff className="w-3 h-3" /> Remover admin
                  </>
                ) : (
                  <>
                    <Shield className="w-3 h-3" /> Tornar admin
                  </>
                )}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
