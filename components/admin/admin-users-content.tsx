"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  Shield,
  ShieldOff,
  ShieldCheck,
  MapPin,
  Mail,
  RefreshCw,
  KeyRound,
  Trash2,
} from "lucide-react";
import {
  makeAdminAction,
  removeAdminAction,
  toggleVerifiedAction,
  inviteAdminByEmailAction,
  resendPendingAccessEmailAction,
  sendPasswordResetEmailAction,
  deleteUserAccountAction,
} from "@/app/admin/usuarios/actions";

export type AdminUserRow = {
  id: string;
  name: string | null;
  whatsapp: string | null;
  city: string | null;
  state: string | null;
  is_verified: boolean;
  listings_count: number;
  is_admin: boolean;
  auth_email: string | null;
  email_confirmed: boolean;
  invited_at: string | null;
  last_sign_in_at: string | null;
};

export function AdminUsersContent({
  vendors,
  currentAdminId,
}: {
  vendors: AdminUserRow[];
  currentAdminId: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [filter, setFilter] = useState<"all" | "admin" | "vendor">("all");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteMsg, setInviteMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [rowMsg, setRowMsg] = useState<{ id: string; type: "ok" | "err"; text: string } | null>(null);

  const filtered = vendors.filter((v) => {
    if (filter === "admin") return v.is_admin;
    if (filter === "vendor") return !v.is_admin;
    return true;
  });

  const toggleAdmin = (v: AdminUserRow) => {
    if (v.is_admin) {
      if (!confirm(`Remover o acesso de administrador de ${v.name || "esta pessoa"}?`)) return;
      startTransition(async () => {
        try {
          await removeAdminAction(v.id);
        } catch (err) {
          alert(err instanceof Error ? err.message : "Erro");
        }
      });
    } else {
      if (
        !confirm(
          `Dar acesso de administrador a ${v.name || "esta pessoa"}? Passará a ver e gerenciar todo o painel administrativo.`
        )
      ) {
        return;
      }
      startTransition(async () => {
        try {
          await makeAdminAction(v.id);
        } catch (err) {
          alert(err instanceof Error ? err.message : "Erro");
        }
      });
    }
  };

  const handleToggleVerified = (v: AdminUserRow) => {
    const next = !v.is_verified;
    startTransition(async () => {
      try {
        await toggleVerifiedAction(v.id, next);
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
          text: "Convite enviado. A pessoa recebe um e-mail para criar a senha e, ao entrar, já fica com acesso de administrador.",
        });
        setInviteEmail("");
      } else {
        setInviteMsg({ type: "err", text: result.message });
      }
    });
  };

  const flashRow = (id: string, type: "ok" | "err", text: string) => {
    setRowMsg({ id, type, text });
    setTimeout(() => setRowMsg((m) => (m?.id === id ? null : m)), 5000);
  };

  const resendAccess = (v: AdminUserRow) => {
    setRowMsg(null);
    startTransition(async () => {
      const r = await resendPendingAccessEmailAction(v.id);
      if (r.ok) flashRow(v.id, "ok", "E-mail reenviado.");
      else flashRow(v.id, "err", r.message);
    });
  };

  const sendRecovery = (v: AdminUserRow) => {
    setRowMsg(null);
    startTransition(async () => {
      const r = await sendPasswordResetEmailAction(v.id);
      if (r.ok) flashRow(v.id, "ok", "E-mail de redefinição de senha enviado.");
      else flashRow(v.id, "err", r.message);
    });
  };

  const deleteAccount = (v: AdminUserRow) => {
    if (v.id === currentAdminId) return;
    if (
      !confirm(
        `Apagar definitivamente a conta de ${v.name || v.auth_email || "esta pessoa"}? Esta ação não pode ser desfeita.`
      )
    ) {
      return;
    }
    startTransition(async () => {
      const r = await deleteUserAccountAction(v.id, currentAdminId);
      if (r.ok) {
        flashRow(v.id, "ok", "Conta removida.");
        router.refresh();
      } else alert(r.message);
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
          Indique o e-mail da pessoa que vai ajudar a gerenciar o site. Ela recebe um e-mail para criar a senha e,
          depois de concluir o acesso, entra diretamente no painel de administração.
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

      <p className="text-xs text-[var(--text-muted)] mb-6 max-w-3xl leading-relaxed border-l-2 border-[var(--trust)] pl-4">
        <strong className="text-[var(--ink)]">Sobre &quot;Verificado&quot;:</strong> é um selo que a equipe ativa manualmente
        quando confia no vendedor (identidade ou contato conferidos). Aparece na página do anúncio como sinal de
        confiança. Não substitui a confirmação do e-mail da conta.
      </p>

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
          {filtered.map((v) => {
            const canDelete = v.listings_count === 0 && v.id !== currentAdminId;
            const pendingEmail = !v.email_confirmed;
            return (
              <div
                key={v.id}
                className="bg-white border border-[var(--line)] p-5 flex flex-col lg:flex-row lg:items-start gap-4 hover:border-[var(--action)] transition"
              >
                <div className="w-12 h-12 bg-[var(--bg-section)] flex items-center justify-center font-display text-lg font-bold text-[var(--ink-soft)] flex-shrink-0">
                  {(v.name || "?").charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-0.5">
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
                  {v.auth_email && (
                    <p className="text-xs text-[var(--ink-soft)] mb-1">
                      <span className="text-[var(--text-muted)]">E-mail:</span> {v.auth_email}
                    </p>
                  )}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[var(--ink-soft)]">
                    {v.whatsapp && <span>{v.whatsapp}</span>}
                    {v.city && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {v.city}, {v.state}
                      </span>
                    )}
                    <span>
                      <strong>{v.listings_count}</strong> {v.listings_count === 1 ? "anúncio" : "anúncios"}
                    </span>
                  </div>
                  {rowMsg?.id === v.id && (
                    <p
                      className={`mt-2 text-xs ${rowMsg.type === "ok" ? "text-[var(--success)]" : "text-[var(--danger)]"}`}
                    >
                      {rowMsg.text}
                    </p>
                  )}
                </div>
                <div className="flex flex-col gap-2 lg:items-end lg:flex-shrink-0 lg:min-w-[200px]">
                  <div className="flex flex-wrap gap-2 justify-start lg:justify-end">
                    {pendingEmail && (
                      <button
                        type="button"
                        onClick={() => resendAccess(v)}
                        disabled={isPending}
                        className="text-[10px] uppercase tracking-wider font-bold px-3 py-1.5 flex items-center gap-1 border border-[var(--line)] bg-white hover:border-[var(--ink)] transition disabled:opacity-50"
                      >
                        <RefreshCw className="w-3 h-3" />
                        Reenviar e-mail de acesso
                      </button>
                    )}
                    {v.email_confirmed && (
                      <button
                        type="button"
                        onClick={() => sendRecovery(v)}
                        disabled={isPending}
                        className="text-[10px] uppercase tracking-wider font-bold px-3 py-1.5 flex items-center gap-1 border border-[var(--line)] bg-white hover:border-[var(--ink)] transition disabled:opacity-50"
                      >
                        <KeyRound className="w-3 h-3" />
                        Enviar redefinição de senha
                      </button>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggleVerified(v)}
                    disabled={isPending}
                    className={`text-[10px] uppercase tracking-wider font-bold px-3 py-1.5 flex items-center gap-1 transition border disabled:opacity-50 ${
                      v.is_verified
                        ? "bg-[var(--trust)] text-white border-[var(--trust)]"
                        : "bg-white text-[var(--ink-soft)] border-[var(--line)] hover:border-[var(--trust)]"
                    }`}
                  >
                    <ShieldCheck className="w-3 h-3" />
                    {v.is_verified ? "Retirar selo Verificado" : "Marcar como Verificado"}
                  </button>
                  <button
                    type="button"
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
                        <ShieldOff className="w-3 h-3" /> Remover acesso de administrador
                      </>
                    ) : (
                      <>
                        <Shield className="w-3 h-3" /> Dar acesso de administrador
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteAccount(v)}
                    disabled={isPending || !canDelete}
                    title={
                      !canDelete
                        ? v.listings_count > 0
                          ? "Não é possível apagar contas com anúncios no histórico."
                          : "Não pode apagar a sua própria conta."
                        : "Apagar conta para sempre"
                    }
                    className="text-[10px] uppercase tracking-wider font-bold px-3 py-1.5 flex items-center gap-1 text-[var(--danger)] border border-[var(--danger)] hover:bg-red-50 transition disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Trash2 className="w-3 h-3" /> Apagar conta
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
