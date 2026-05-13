import Link from "next/link";
import type { FooterConfig } from "@/lib/site-config";

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M13.5 21v-8h2.7l.4-3h-3.1V8.4c0-.9.3-1.5 1.6-1.5H17V4.1c-.3 0-1.4-.1-2.7-.1-2.7 0-4.5 1.6-4.5 4.6V10H7v3h2.8v8h3.7z" />
    </svg>
  );
}

function LinkedinIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M6.5 8.5a2 2 0 100-4 2 2 0 000 4zM4 20.5h5V10H4v10.5zM14.5 10h4.8v1.4h.1c.7-1.3 2.4-2.7 4.9-2.7 5.2 0 6.2 3.4 6.2 7.9v8.4h-5v-7.4c0-1.8 0-4-2.5-4-2.4 0-2.8 1.9-2.8 3.8v7.6h-5V10z" />
    </svg>
  );
}

function YoutubeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M21.6 7.2s-.2-1.4-.8-2c-.7-.8-1.5-.8-1.9-.8C16.4 4 12 4 12 4s-4.4 0-5.9.2c-.4 0-1.2 0-1.9.8-.6.6-.8 2-.8 2S3 8.9 3 10.6v1.8c0 1.7.2 3.4.2 3.4s.2 1.4.8 2c.7.8 1.6.8 2 .9 1.5.2 6.2.2 6.2.2s4.4 0 5.9-.2c.4 0 1.2 0 1.9-.8.6-.6.8-2 .8-2s.2-1.7.2-3.4v-1.8c0-1.7-.2-3.4-.2-3.4zM10 14.5v-6l5 3-5 3z" />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 11-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43V7.07a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.12z" />
    </svg>
  );
}

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  instagram: InstagramIcon,
  facebook: FacebookIcon,
  linkedin: LinkedinIcon,
  youtube: YoutubeIcon,
};

function SocialIcon({ platform }: { platform: string }) {
  if (platform === "tiktok") return <TikTokIcon className="h-4 w-4" />;
  if (platform === "twitter") return <XIcon className="h-4 w-4" />;
  const Cmp = ICONS[platform];
  return Cmp ? <Cmp className="h-4 w-4" /> : null;
}

export function SiteFooter({ footer }: { footer: FooterConfig }) {
  const activeSocial = footer.social.filter((s) => s.url);

  return (
    <footer className="bg-[var(--bg-dark)] border-t-4 border-[var(--action)] mt-16">
      <div className="mx-auto max-w-[1200px] px-4 py-12 grid gap-8 [grid-template-columns:repeat(auto-fit,minmax(180px,1fr))]">
        <div className="md:col-span-1">
          <div className="font-display text-2xl font-black italic text-[var(--action)]">{footer.company.name}</div>
          <p className="text-sm text-[var(--on-dark-soft)] mt-4 leading-relaxed opacity-90">{footer.description}</p>
          {activeSocial.length > 0 && (
            <div className="flex gap-3 mt-6">
              {activeSocial.map((s) => (
                <a
                  key={s.platform}
                  href={s.url!}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 border border-[var(--on-dark-soft)]/30 flex items-center justify-center text-[var(--on-dark-soft)] hover:border-[var(--action)] hover:text-[var(--action)] transition"
                  aria-label={s.platform}
                >
                  <SocialIcon platform={s.platform} />
                </a>
              ))}
            </div>
          )}
        </div>

        {footer.columns.map((col, i) => (
          <div key={`${col.title}-${i}`}>
            <div className="text-label-bold text-white mb-4">{col.title}</div>
            <ul className="space-y-2">
              {col.links.map((link, j) => {
                const external = link.href.startsWith("http");
                return (
                  <li key={`${link.href}-${j}`}>
                    {external ? (
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-[var(--on-dark-soft)] opacity-80 hover:opacity-100 hover:text-[var(--action-light)] transition"
                      >
                        {link.label}
                      </a>
                    ) : (
                      <Link
                        href={link.href}
                        className="text-sm text-[var(--on-dark-soft)] opacity-80 hover:opacity-100 hover:text-[var(--action-light)] transition"
                      >
                        {link.label}
                      </Link>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

      <div className="mx-auto max-w-[1200px] px-4 pb-8">
        <div className="border-t border-white/10 pt-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4 text-xs text-[var(--on-dark-soft)] opacity-80">
          <div>
            © {new Date().getFullYear()} {footer.company.name}. Todos os direitos reservados.
            {footer.company.cnpj ? <span className="ml-2">CNPJ {footer.company.cnpj}</span> : null}
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            {footer.company.email ? (
              <a href={`mailto:${footer.company.email}`} className="hover:text-[var(--action-light)]">
                {footer.company.email}
              </a>
            ) : null}
            {footer.company.phone ? <span>{footer.company.phone}</span> : null}
            {footer.company.address ? <span>{footer.company.address}</span> : null}
          </div>
        </div>
      </div>
    </footer>
  );
}
