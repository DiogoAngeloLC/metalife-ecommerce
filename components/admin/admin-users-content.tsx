"use client";

import { useState, useTransition } from "react";
import { Shield, ShieldOff, ShieldCheck, MapPin, Mail } from "lucide-react";
import { makeAdminAction, removeAdminAction, toggleVerifiedAction, inviteAdminByEmailAction } from "@/app/admin/usuarios/actions";

/* eslint-disable @typescript-eslint/no-explicit-any */
export function AdminUsersContent({ vendors }: { vendors: any[] }) {
  const [isPending, startTransition] = useTransition();
  const [filter, setFilter] = useState<"all" | "admin" | "vendor">("all");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteMsg, setInviteMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

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

  const handleToggleVerified = (vendor: any) => {
    const next = !vendor.is_verified;
    startTransition(async () => {
      try {
        await toggleVerifiedAction(vendor.id, next);
      } catch (err) {
        alert(err instanceof Error ? err.message : "Erro");
      }
    });
  };

  const sendInvite = () => {
    setInviteMsg(null);
    const email = inviteEmail.trim();
    if (!email) {
      setInviteMsg({ type: "err", text: "Digite um e-mail." });
      return;
    }
    startTransition(async () => {
      const result = await inviteAdminByEmailAction(email);
      if (result.ok) {
        setInviteMsg({
          type: "ok",
          text: "Convite enviado. Após a pessoa aceitar o e-mail e entrar, use «Tornar admin» na lista para liberar o painel.",
        });
        setInviteEmail("");
      } else {
        setInviteMsg({ type: "err", text: result.message });
      }
    });
  };

  return (
    <div className="p-6 md:p-10">
      <div className="mb-6">
        <div className="text-label-bold text-[var(--text-muted)] mb-2">PESSOAS</div>
        <h1 className="font-display text-3xl md:text-4xl font-bold uppercase text-[var(--ink)]">Usuários</h1>
      </div>

      <div className="mb-8 border border-[var(--line)] bg-white p-5 md:p-6">
        <div className="text-label-bold text-[var(--text-muted)] mb-2">CONVIDAR ADMINISTRADOR</div>
        <p className="text-sm text-[var(--text-muted)] mb-4 max-w-2xl">
          Envia um e-mail de convite (Supabase Auth). Quando a pessoa aceitar e criar a senha, ela aparece nesta lista —
          então use «Tornar admin» para dar acesso ao painel administrativo.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
          <div className="flex-1 flex items-center gap-2 border border-[var(--line)] bg-[var(--bg-section)] px-3">
            <Mail className="w-4 h-4 text-[var(--text-muted)] flex-shrink-0" />
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="email@empresa.com.br"
              disabled={isPending}
              className="w-full py-3 text-sm bg-transparent outline-none border-0"
            />
          </div>
          <button
            type="button"
            onClick={sendInvite}
            disabled={isPending}
            className="text-label-bold uppercase tracking-wider px-6 py-3 bg-[var(--ink)] text-white border border-[var(--ink)] hover:opacity-90 transition disabled:opacity-50"
          >
            Enviar convite
          </button>
        </div>
        {inviteMsg && (
          <p
            className={`mt-3 text-sm ${inviteMsg.type === "ok" ? "text-[var(--success)]" : "text-[var(--danger)]"}`}
          >
            {inviteMsg.text}
          </p>
        )}
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
            className={`text-label-bold px-4 py-1.5 transition border ${
              filter === t.key
                ? "bg-[var(--ink)] text-white border-[var(--ink)]"
                : "text-[var(--ink-soft)] border-[var(--line)] hover:bg-[var(--bg-section)]"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="border border-dashed border-[var(--line)] p-12 text-center">
          <p className="text-[var(--text-muted)]">Nenhum usuário.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((v: any) => (
            <div key={v.id} className="bg-white border border-[var(--line)] p-5 flex items-center gap-4 hover:border-[var(--action)] transition">
              <div className="w-12 h-12 bg-[var(--bg-section)] flex items-center justify-center font-display text-lg font-bold text-[var(--ink-soft)]">
                {(v.name || "?").charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <h3 className="font-display text-lg font-bold">{v.name || "Sem nome"}</h3>
                  {v.is_admin && (
                    <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 bg-[var(--action)] text-white font-bold flex items-center gap-1">
                      <Shield className="w-2.5 h-2.5" /> Admin
                    </span>
                  )}
                  {v.is_verified && (
                    <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 bg-[var(--trust-light)] text-[var(--trust)] font-bold flex items-center gap-1 border border-[var(--trust)]">
                      <ShieldCheck className="w-2.5 h-2.5" /> Verificado
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
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => handleToggleVerified(v)}
                  disabled={isPending}
                  className={`text-[10px] uppercase tracking-wider font-bold px-3 py-1.5 flex items-center gap-1 transition border disabled:opacity-50 ${
                    v.is_verified
                      ? "bg-[var(--trust)] text-white border-[var(--trust)]"
                      : "bg-white text-[var(--ink-soft)] border-[var(--line)] hover:border-[var(--trust)]"
                  }`}
                >
                  <ShieldCheck className="w-3 h-3" />
                  {v.is_verified ? "Verificado" : "Verificar"}
                </button>
                <button
                  onClick={() => toggleAdmin(v)}
                  disabled={isPending}
                  className={`text-[10px] uppercase tracking-wider font-bold px-3 py-1.5 transition flex items-center gap-1 border disabled:opacity-50 ${
                    v.is_admin
                      ? "text-[var(--danger)] border-[var(--danger)] hover:bg-red-50"
                      : "bg-[var(--ink)] text-white border-[var(--ink)] hover:opacity-90"
                  }`}
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
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
