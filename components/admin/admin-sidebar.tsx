"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Newspaper,
  Users,
  MessageCircle,
  LogOut,
  ArrowUpRight,
  Wifi,
  FileText,
  AlertOctagon,
  Image,
  Megaphone,
  BookOpen,
  Palette,
  Sparkles,
  Layers,
  Menu,
} from "lucide-react";
import type { Brand } from "@/lib/site-config";

const NAV_SECTIONS = [
  {
    title: "Operação",
    items: [
      { href: "/admin", label: "Visão geral", icon: LayoutDashboard, exact: true },
      { href: "/admin/anuncios", label: "Anúncios", icon: Newspaper },
      { href: "/admin/usuarios", label: "Usuários", icon: Users },
      { href: "/admin/leads", label: "Leads", icon: MessageCircle },
    ],
  },
  {
    title: "Mensagens",
    items: [
      { href: "/admin/conexao", label: "Conexão", icon: Wifi },
      { href: "/admin/logs/mensagens", label: "Mensagens", icon: FileText },
      { href: "/admin/logs/erros", label: "Erros", icon: AlertOctagon },
    ],
  },
  {
    title: "Conteúdo",
    items: [
      { href: "/admin/aparencia", label: "Hero", icon: Image },
      { href: "/admin/paginas", label: "Páginas", icon: BookOpen },
      { href: "/admin/banners", label: "Banners", icon: Megaphone },
    ],
  },
  {
    title: "Personalização",
    items: [
      { href: "/admin/tema", label: "Tema", icon: Palette },
      { href: "/admin/identidade", label: "Identidade", icon: Sparkles },
      { href: "/admin/rodape", label: "Rodapé", icon: Layers },
      { href: "/admin/menu", label: "Menu", icon: Menu },
    ],
  },
];

type NavItem = (typeof NAV_SECTIONS)[number]["items"][number];

export function AdminSidebar({ brand }: { brand: Brand }) {
  const pathname = usePathname();

  const isActive = (item: NavItem) => (item.exact ? pathname === item.href : pathname.startsWith(item.href));

  return (
    <aside className="w-64 min-h-screen bg-[var(--bg-dark)] text-white flex flex-col flex-shrink-0">
      <div className="p-6 border-b border-white/10">
        <Link href="/" className="flex items-center gap-3 group">
          {brand.logo_dark_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={brand.logo_dark_url} alt="" className="h-8 w-auto max-w-[140px] object-contain" />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src="/logos/logo-symbol-white.svg" alt="" className="h-8 w-auto" />
          )}
          <div className="flex flex-col leading-none min-w-0">
            <span className="font-display text-sm font-bold uppercase tracking-tight truncate">{brand.name}</span>
            <span className="text-[10px] uppercase tracking-[0.2em] text-white/40 mt-0.5">Admin</span>
          </div>
        </Link>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-6 overflow-y-auto">
        {NAV_SECTIONS.map((section) => (
          <div key={section.title}>
            <div className="px-3 mb-2 text-[10px] font-bold uppercase tracking-widest text-white/50">{section.title}</div>
            <div className="space-y-1">
              {section.items.map((item) => {
                const Icon = item.icon;
                const active = isActive(item);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2.5 transition text-sm font-medium ${
                      active
                        ? "bg-white/10 text-white border-l-2 border-[var(--action)]"
                        : "text-white/60 hover:bg-white/5 hover:text-white border-l-2 border-transparent"
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="p-3 border-t border-white/10 space-y-1">
        <Link
          href="/dashboard"
          className="flex items-center gap-3 px-3 py-2.5 text-sm text-white/60 hover:bg-white/5 hover:text-white transition"
        >
          <ArrowUpRight className="w-4 h-4" />
          Atuar como vendedor
        </Link>
        <form action="/auth/sign-out" method="POST">
          <button
            type="submit"
            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-white/60 hover:bg-white/5 hover:text-white transition"
          >
            <LogOut className="w-4 h-4" />
            Sair
          </button>
        </form>
      </div>
    </aside>
  );
}
