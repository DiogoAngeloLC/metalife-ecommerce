"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export function SignupForm({ next }: { next?: string }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [created, setCreated] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (password.length < 6) {
      setErrorMsg("A senha deve ter no mínimo 6 caracteres.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg("As senhas não coincidem.");
      return;
    }

    setSubmitting(true);

    try {
      const supabase = createClient();
      const callback = `${window.location.origin}/auth/callback${
        next ? `?next=${encodeURIComponent(next)}` : ""
      }`;

      const { error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: { emailRedirectTo: callback },
      });

      if (error) {
        setErrorMsg(error.message);
      } else {
        setCreated(true);
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Erro inesperado");
    } finally {
      setSubmitting(false);
    }
  };

  if (created) {
    return (
      <div className="border border-[var(--line)] bg-white p-8 text-center">
        <div className="w-14 h-14 mx-auto mb-5 bg-[var(--success-bg)] border border-[var(--success)] flex items-center justify-center">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="1.8">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
            <polyline points="22,6 12,13 2,6" />
          </svg>
        </div>
        <div className="font-display text-2xl font-bold uppercase mb-3">Confirme seu email</div>
        <p className="text-sm text-[var(--text-muted)] leading-relaxed">
          Enviamos um link de confirmação para
          <br />
          <strong className="text-[var(--ink)]">{email}</strong>
        </p>
        <p className="text-xs text-[var(--text-muted)] mt-5">
          Após confirmar, você poderá{" "}
          <Link
            href={`/login${next ? `?next=${encodeURIComponent(next)}` : ""}`}
            className="underline hover:text-[var(--action)]"
          >
            entrar na sua conta
          </Link>
          .
        </p>
      </div>
    );
  }

  return (
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
          placeholder="Mínimo 6 caracteres"
          className="w-full border border-[var(--line)] p-3 text-sm outline-none transition focus:border-[var(--action)] bg-white"
        />
      </div>

      <div>
        <label htmlFor="confirm-password" className="text-label-bold text-[var(--text-muted)] block mb-2">
          Confirmar senha
        </label>
        <input
          id="confirm-password"
          type="password"
          required
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Repita a senha"
          className="w-full border border-[var(--line)] p-3 text-sm outline-none transition focus:border-[var(--action)] bg-white"
        />
      </div>

      {errorMsg && <p className="text-sm text-[var(--danger)]">{errorMsg}</p>}

      <button
        type="submit"
        disabled={submitting || !email || !password || !confirmPassword}
        className="w-full bg-[var(--action)] text-white py-4 font-display font-bold uppercase tracking-wider hover:bg-[var(--action-dark)] transition disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {submitting ? "Criando conta…" : "Criar conta"}
      </button>

      <p className="text-xs text-center text-[var(--text-muted)]">
        Já tem conta?{" "}
        <Link
          href={`/login${next ? `?next=${encodeURIComponent(next)}` : ""}`}
          className="underline hover:text-[var(--action)]"
        >
          Entrar
        </Link>
      </p>
    </form>
  );
}
