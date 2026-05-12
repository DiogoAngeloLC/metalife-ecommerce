import Link from "next/link";
import { Shield, Plus } from "lucide-react";
import { getCurrentUser, isCurrentUserAdmin } from "@/lib/supabase/auth";

export async function SiteHeader() {
  const user = await getCurrentUser();
  const isAdmin = user ? await isCurrentUserAdmin() : false;

  return (
    <header className="sticky top-0 z-50 border-b-2 border-[var(--line)] bg-white">
      <div className="mx-auto flex max-w-[1200px] items-center justify-between px-4 py-3">
        {/* Logo */}
        <div className="flex items-center gap-8">
          <Link href="/" className="font-display text-2xl font-black italic tracking-tighter text-[var(--action)]">
            CLASSIFICADO PILATES
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            <Link href="/" className="px-2 py-1 text-sm font-medium text-[var(--ink-soft)] hover:bg-[var(--bg-section)] transition-colors">
              Catálogo
            </Link>
            <Link href="/?filter=reformer" className="px-2 py-1 text-sm font-medium text-[var(--ink-soft)] hover:bg-[var(--bg-section)] transition-colors">
              Reformers
            </Link>
            <Link href="/?filter=todos" className="px-2 py-1 text-sm font-medium text-[var(--ink-soft)] hover:bg-[var(--bg-section)] transition-colors">
              Novidades
            </Link>
          </nav>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          {isAdmin && (
            <Link
              href="/admin"
              className="flex items-center gap-1.5 bg-[var(--action)] px-4 py-2 text-xs font-bold uppercase tracking-wider text-white transition hover:bg-[var(--action-dark)] active:scale-[0.98]"
            >
              <Shield className="h-3.5 w-3.5" />
              Admin
            </Link>
          )}
          {user ? (
            <>
              <Link
                href="/dashboard"
                className="hidden px-2 py-1 text-sm font-medium text-[var(--ink-soft)] hover:text-[var(--ink)] transition-colors md:inline"
              >
                Painel
              </Link>
              <form action="/auth/sign-out" method="POST">
                <button
                  type="submit"
                  className="hidden text-sm text-[var(--text-muted)] transition hover:text-[var(--action)] md:inline"
                >
                  Sair
                </button>
              </form>
              <Link
                href="/dashboard/novo"
                className="flex items-center gap-1.5 bg-[var(--action)] px-5 py-2.5 font-display text-sm font-bold uppercase tracking-wider text-white transition hover:bg-[var(--action-dark)] active:scale-[0.98]"
              >
                <Plus className="h-3.5 w-3.5" />
                Anunciar
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="hidden px-3 py-2 text-sm font-medium text-[var(--ink-soft)] hover:text-[var(--ink)] transition-colors md:inline"
              >
                Entrar
              </Link>
              <Link
                href="/login?next=/dashboard/novo"
                className="flex items-center gap-1.5 bg-[var(--action)] px-5 py-2.5 font-display text-sm font-bold uppercase tracking-wider text-white transition hover:bg-[var(--action-dark)] active:scale-[0.98]"
              >
                Anunciar
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
