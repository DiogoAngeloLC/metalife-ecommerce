"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type AuthMode = "magic" | "password";

export function LoginForm({ next }: { next?: string }) {
  const [mode, setMode] = useState<AuthMode>("magic");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSubmitting(true);

    try {
      const supabase = createClient();

      if (mode === "magic") {
        const callback = `${window.location.origin}/auth/callback${
          next ? `?next=${encodeURIComponent(next)}` : ""
        }`;

        const { error } = await supabase.auth.signInWithOtp({
          email: email.trim().toLowerCase(),
          options: { emailRedirectTo: callback },
        });

        if (error) {
          setErrorMsg(error.message);
        } else {
          setSent(true);
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password,
        });

        if (error) {
          if (error.message === "Invalid login credentials") {
            setErrorMsg("Email ou senha incorretos.");
          } else {
            setErrorMsg(error.message);
          }
        } else {
          window.location.href = next ?? "/dashboard";
        }
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Erro inesperado");
    } finally {
      setSubmitting(false);
    }
  };

  if (sent) {
    return (
      <div className="bg-[var(--bg-card)] border border-[var(--line)] rounded-3xl p-8 text-center">
        <div className="w-14 h-14 mx-auto mb-5 rounded-full bg-[var(--sage)]/15 flex items-center justify-center">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--sage)" strokeWidth="1.8">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
            <polyline points="22,6 12,13 2,6" />
          </svg>
        </div>
        <div className="font-display text-2xl mb-3">Confira seu email</div>
        <p className="text-sm text-[var(--text-muted)] leading-relaxed">
          Enviamos um link de acesso para
          <br />
          <strong className="text-[var(--ink)]">{email}</strong>
        </p>
        <p className="text-xs text-[var(--text-muted)] mt-5">
          Não recebeu? Verifique a caixa de spam ou{" "}
          <button
            onClick={() => {
              setSent(false);
              setEmail("");
            }}
            className="underline hover:text-[var(--terra)]"
          >
            tente outro email
          </button>
          .
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Toggle mode */}
      <div className="flex bg-[var(--bone)] rounded-full p-1">
        <button
          type="button"
          onClick={() => { setMode("magic"); setErrorMsg(null); }}
          className={`flex-1 text-sm py-2 rounded-full transition font-medium ${
            mode === "magic"
              ? "bg-[var(--ink)] text-white shadow-sm"
              : "text-[var(--ink-soft)] hover:text-[var(--ink)]"
          }`}
        >
          Link mágico
        </button>
        <button
          type="button"
          onClick={() => { setMode("password"); setErrorMsg(null); }}
          className={`flex-1 text-sm py-2 rounded-full transition font-medium ${
            mode === "password"
              ? "bg-[var(--ink)] text-white shadow-sm"
              : "text-[var(--ink-soft)] hover:text-[var(--ink)]"
          }`}
        >
          Senha
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="email" className="text-xs uppercase tracking-wider text-[var(--text-muted)] block mb-2">
            E-mail
          </label>
          <input
            id="email"
            type="email"
            required
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="voce@email.com"
            className="w-full bg-transparent border-b border-[var(--line)] focus:border-[var(--terra)] outline-none py-2.5 text-[15px] transition"
          />
        </div>

        {mode === "password" && (
          <div>
            <label htmlFor="password" className="text-xs uppercase tracking-wider text-[var(--text-muted)] block mb-2">
              Senha
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Sua senha"
              className="w-full bg-transparent border-b border-[var(--line)] focus:border-[var(--terra)] outline-none py-2.5 text-[15px] transition"
            />
          </div>
        )}

        {errorMsg && <p className="text-sm text-red-700">{errorMsg}</p>}

        <button
          type="submit"
          disabled={submitting || !email || (mode === "password" && !password)}
          className="w-full bg-[var(--ink)] text-white rounded-full py-3.5 font-medium hover:opacity-90 transition disabled:opacity-30 disabled:cursor-not-allowed"
        >
          {submitting
            ? mode === "magic"
              ? "Enviando link…"
              : "Entrando…"
            : mode === "magic"
              ? "Receber link de acesso"
              : "Entrar com senha"}
        </button>
      </form>

      {mode === "password" && (
        <p className="text-xs text-center text-[var(--text-muted)]">
          Não tem conta?{" "}
          <Link
            href={`/cadastro${next ? `?next=${encodeURIComponent(next)}` : ""}`}
            className="underline hover:text-[var(--terra)]"
          >
            Criar conta
          </Link>
        </p>
      )}
    </div>
  );
}
