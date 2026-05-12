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
      <div className="border border-[var(--line)] bg-white p-8 text-center">
        <div className="w-14 h-14 mx-auto mb-5 bg-[var(--success-bg)] border border-[var(--success)] flex items-center justify-center">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="1.8">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
            <polyline points="22,6 12,13 2,6" />
          </svg>
        </div>
        <div className="font-display text-2xl font-bold uppercase mb-3">Confira seu email</div>
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
            className="underline hover:text-[var(--action)]"
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
      <div className="flex border border-[var(--line)]">
        <button
          type="button"
          onClick={() => { setMode("magic"); setErrorMsg(null); }}
          className={`flex-1 text-label-bold py-2.5 transition ${
            mode === "magic"
              ? "bg-[var(--ink)] text-white"
              : "text-[var(--ink-soft)] hover:text-[var(--ink)] bg-white"
          }`}
        >
          Link mágico
        </button>
        <button
          type="button"
          onClick={() => { setMode("password"); setErrorMsg(null); }}
          className={`flex-1 text-label-bold py-2.5 transition ${
            mode === "password"
              ? "bg-[var(--ink)] text-white"
              : "text-[var(--ink-soft)] hover:text-[var(--ink)] bg-white"
          }`}
        >
          Senha
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="email" className="text-label-bold text-[var(--text-muted)] block mb-2">
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
            className="w-full border border-[var(--line)] p-3 text-sm outline-none transition focus:border-[var(--action)] bg-white"
          />
        </div>

        {mode === "password" && (
          <div>
            <label htmlFor="password" className="text-label-bold text-[var(--text-muted)] block mb-2">
              Senha
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Sua senha"
              className="w-full border border-[var(--line)] p-3 text-sm outline-none transition focus:border-[var(--action)] bg-white"
            />
          </div>
        )}

        {errorMsg && <p className="text-sm text-[var(--danger)]">{errorMsg}</p>}

        <button
          type="submit"
          disabled={submitting || !email || (mode === "password" && !password)}
          className="w-full bg-[var(--action)] text-white py-4 font-display font-bold uppercase tracking-wider hover:bg-[var(--action-dark)] transition disabled:opacity-40 disabled:cursor-not-allowed"
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
            className="underline hover:text-[var(--action)]"
          >
            Criar conta
          </Link>
        </p>
      )}
    </div>
  );
}
