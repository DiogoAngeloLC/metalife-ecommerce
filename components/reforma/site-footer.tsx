import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="bg-[var(--bg-dark)] border-t-4 border-[var(--action)]">
      <div className="mx-auto grid max-w-[1200px] grid-cols-1 gap-12 px-4 py-12 md:grid-cols-4">
        <div className="flex flex-col gap-3">
          <span className="font-display text-lg font-bold italic text-white">
            CLASSIFICADO PILATES
          </span>
          <p className="text-sm text-[var(--on-dark-soft)] opacity-80">
            O maior marketplace de equipamentos de Pilates do Brasil. Compra e venda entre estúdios profissionais.
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <h4 className="text-label-bold text-white">Compradores</h4>
          <FooterLink href="/#como-funciona">Como funciona</FooterLink>
          <FooterLink href="/">Catálogo completo</FooterLink>
        </div>
        <div className="flex flex-col gap-2">
          <h4 className="text-label-bold text-white">Vendedores</h4>
          <FooterLink href="/login?next=/dashboard/novo">Anunciar equipamento</FooterLink>
          <FooterLink href="/dashboard">Painel do vendedor</FooterLink>
        </div>
        <div className="flex flex-col gap-2">
          <h4 className="text-label-bold text-white">Suporte</h4>
          <p className="text-sm text-[var(--on-dark-soft)] opacity-80">
            Seg-Sex 08:00 - 18:00
          </p>
        </div>
      </div>
      <div className="mx-auto max-w-[1200px] border-t border-white/10 px-4 py-4">
        <p className="text-[10px] uppercase tracking-wider text-[var(--on-dark-soft)] opacity-60 text-center md:text-left">
          © {new Date().getFullYear()} Classificado Pilates · Desenvolvido por Atlaas
        </p>
      </div>
    </footer>
  );
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="text-sm text-[var(--on-dark-soft)] opacity-80 transition-opacity hover:opacity-100 hover:text-[var(--action-light)]"
    >
      {children}
    </Link>
  );
}
