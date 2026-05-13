import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="bg-[var(--bg-dark)] border-t-4 border-[var(--action)]">
      <div className="mx-auto grid max-w-[1200px] grid-cols-1 gap-12 px-4 py-12 md:grid-cols-4">
        <div className="flex flex-col gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logos/logo-stacked-white.svg" alt="Classificado Pilates" className="h-10 w-auto self-start" />
          <p className="text-sm text-[var(--on-dark-soft)] opacity-80">
            Marketplace de equipamentos de Pilates. Conectando quem vende e quem precisa.
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <h4 className="text-label-bold text-white">Compradores</h4>
          <FooterLink href="/catalogo">Catálogo</FooterLink>
          <FooterLink href="/catalogo?categoria=reformer">Reformers</FooterLink>
          <FooterLink href="/catalogo?ordem=recentes">Novidades</FooterLink>
        </div>
        <div className="flex flex-col gap-2">
          <h4 className="text-label-bold text-white">Vendedores</h4>
          <FooterLink href="/login?next=/dashboard/novo">Como anunciar</FooterLink>
          <FooterLink href="/dashboard">Dashboard</FooterLink>
          <FooterLink href="/cadastro">Cadastre-se</FooterLink>
        </div>
        <div className="flex flex-col gap-2">
          <h4 className="text-label-bold text-white">Institucional</h4>
          <FooterLink href="/politica-de-privacidade">Política de Privacidade</FooterLink>
          <FooterLink href="/termos-de-uso">Termos de Uso</FooterLink>
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
