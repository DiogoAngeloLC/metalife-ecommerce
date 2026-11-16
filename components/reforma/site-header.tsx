import Link from "next/link";
import { Shield, Package } from "lucide-react";
import { getCurrentUser, isCurrentUserAdmin } from "@/lib/supabase/auth";
import { getMenuItems, getBrand } from "@/lib/site-config";
import { CartHeaderButton } from "@/components/cart/cart-header-button";

export async function SiteHeader() {
  const user = await getCurrentUser();
  const isAdmin = user ? await isCurrentUserAdmin() : false;
  const [menu, brand] = await Promise.all([getMenuItems(), getBrand()]);
  const logoSrc = brand.logo_url ?? "/images/logo-metalife-verde.png";

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--line)] bg-[var(--bg-elevated)]">
      <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-y-2 px-4 py-3">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex-shrink-0 flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={logoSrc}
              alt={brand.name}
              className="h-9 w-auto max-w-[220px] object-contain object-left md:h-10 md:max-w-[260px]"
            />
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {menu.map((item) => {
              const openNew = item.external || item.href.startsWith("http");
              const className =
                "rounded-md px-2 py-1 text-sm font-medium text-[var(--ink-soft)] hover:bg-[var(--bg-section)] hover:text-primary transition-colors";

              return openNew ? (
                <a
                  key={`${item.order}-${item.href}-${item.label}`}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={className}
                >
                  {item.label}
                </a>
              ) : (
                <Link
                  key={`${item.order}-${item.href}-${item.label}`}
                  href={item.href}
                  className={className}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
          <CartHeaderButton />

          {isAdmin && (
            <Link
              href="/admin"
              className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-xs font-bold uppercase tracking-wider text-white transition hover:bg-[var(--action-dark)] active:scale-[0.98] sm:px-4"
            >
              <Shield className="h-3.5 w-3.5" />
              Admin
            </Link>
          )}

          {user ? (
            <>
              <Link
                href="/minha-conta/pedidos"
                className="flex items-center gap-1.5 rounded-md px-2 py-2 text-sm font-medium text-[var(--ink-soft)] hover:text-[var(--ink)] transition-colors"
              >
                <Package className="h-4 w-4" />
                Meus pedidos
              </Link>

              <form action="/auth/sign-out" method="POST" className="inline-flex">
                <button
                  type="submit"
                  className="rounded-md px-3 py-2 text-sm font-medium text-[var(--text-muted)] transition hover:bg-[var(--bg-section)] hover:text-[var(--ink)]"
                >
                  Sair
                </button>
              </form>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="hidden rounded-md px-3 py-2 text-sm font-medium text-[var(--ink-soft)] hover:text-primary transition-colors md:inline"
              >
                Entrar
              </Link>

              <Link
                href="/catalogo"
                className="flex items-center gap-1.5 rounded-md bg-primary px-5 py-2.5 font-display text-sm font-bold uppercase tracking-wider text-white transition hover:bg-[var(--action-dark)] active:scale-[0.98]"
              >
                Comprar
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
