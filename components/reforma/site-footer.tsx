export function SiteFooter() {
  return (
    <footer className="border-t border-[var(--line)]">
      <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 px-5 py-12 md:flex-row md:items-center md:px-8">
        <div>
          <div className="font-display mb-1 text-2xl">Classificado Pilates</div>
          <div className="text-sm text-[var(--text-muted)]">
            O marketplace dos profissionais de Pilates.
          </div>
        </div>
        <div className="text-xs text-[var(--text-muted)]">
          MVP · Desenvolvido por{" "}
          <span className="text-[var(--terra)]">Atlaas</span>
        </div>
      </div>
    </footer>
  );
}
