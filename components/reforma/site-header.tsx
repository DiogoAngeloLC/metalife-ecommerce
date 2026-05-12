import Link from "next/link";
import { Plus } from "lucide-react";
import { getCurrentUser } from "@/lib/supabase/auth";

export async function SiteHeader() {
  const user = await getCurrentUser();

  return (
    <header className="sticky top-0 z-30 border-b border-[var(--line)] bg-[var(--bg)]/90 backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 md:px-8">
        <Link href="/" className="group flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--ink)]">
            <span className="font-display text-sm italic text-white">CP</span>
          </div>
          <div className="flex flex-col leading-none">
            <span className="font-display text-xl tracking-tight text-[var(--ink)]">
              Classificado Pilates
            </span>
            <span className="mt-0.5 text-[10px] uppercase tracking-[0.2em] text-[var(--text-muted)]">
              Marketplace · Equipamentos
            </span>
          </div>
        </Link>
        <nav className="hidden items-center gap-8 text-sm md:flex">
          <Link
            href="/"
            className="text-[var(--ink-soft)] transition hover:text-[var(--ink)]"
          >
            Anúncios
          </Link>
          <a
            href="/#filtros"
            className="text-[var(--ink-soft)] transition hover:text-[var(--ink)]"
          >
            Categorias
          </a>
          <a
            href="/#como-funciona"
            className="text-[var(--ink-soft)] transition hover:text-[var(--ink)]"
          >
            Como funciona
          </a>
        </nav>
        {user ? (
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="hidden text-sm text-[var(--ink-soft)] transition hover:text-[var(--ink)] md:inline"
            >
              Painel
            </Link>
            <Link
              href="/perfil"
              className="hidden text-sm text-[var(--ink-soft)] transition hover:text-[var(--ink)] md:inline"
            >
              Meu perfil
            </Link>
            <form action="/auth/sign-out" method="POST">
              <button
                type="submit"
                className="text-sm text-[var(--text-muted)] transition hover:text-[var(--terra)]"
              >
                Sair
              </button>
            </form>
            <Link
              href="/dashboard/novo"
              className="flex items-center gap-2 rounded-full bg-[var(--ink)] px-5 py-2.5 text-sm text-white transition hover:bg-[var(--terra-dark)]"
            >
              <Plus className="h-3.5 w-3.5" aria-hidden />
              Anunciar
            </Link>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="hidden text-sm text-[var(--ink-soft)] transition hover:text-[var(--ink)] md:inline"
            >
              Entrar
            </Link>
            <Link
              href="/login?next=/dashboard/novo"
              className="flex items-center gap-2 rounded-full bg-[var(--ink)] px-5 py-2.5 text-sm text-white transition hover:bg-[var(--terra-dark)]"
            >
              <Plus className="h-3.5 w-3.5" aria-hidden />
              Anunciar
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
