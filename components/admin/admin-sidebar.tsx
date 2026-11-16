"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Newspaper,
  Users,
  MessageCircle,
  ArrowUpRight,
  Wifi,
  FileText,
  AlertOctagon,
  Bell,
  Image,
  Megaphone,
  BookOpen,
  Palette,
  Sparkles,
  Layers,
  Menu,
  Package,
} from "lucide-react";
import type { Brand } from "@/lib/site-config";

const NAV_SECTIONS = [
  {
    title: "Operação",
    items: [
      { href: "/admin", label: "Visão geral", icon: LayoutDashboard, exact: true },
      { href: "/admin/anuncios", label: "Anúncios", icon: Newspaper },
      { href: "/admin/pedidos", label: "Pedidos", icon: Package },
      { href: "/admin/usuarios", label: "Usuários", icon: Users },
      { href: "/admin/leads", label: "Leads", icon: MessageCircle },
      { href: "/admin/notificacoes", label: "Notificações", icon: Bell },
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

  const logoDark = brand.logo_dark_url ?? "/images/logo-metalife-white.png";

  return (
    <aside className="w-64 min-h-screen bg-slate-900 text-white flex flex-col flex-shrink-0 border-r border-[var(--sidebar-border-muted)]">
      <div className="p-6 border-b border-[var(--sidebar-border-muted)]">
        <Link href="/" className="flex items-center gap-3 group">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={logoDark}
            alt={brand.name}
            className="h-8 w-auto max-w-[160px] object-contain"
          />
        </Link>
        <div className="mt-3 text-[10px] font-bold uppercase tracking-[0.2em] text-white/50">
          Admin
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-6 overflow-y-auto scrollbar-metalife">
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
                    className={`flex items-center gap-3 rounded-md px-3 py-2.5 transition text-sm font-medium ${
                      active
                        ? "bg-primary text-white"
                        : "text-white/50 hover:bg-white/5 hover:text-white"
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

      <div className="p-3 border-t border-white/10">
        <Link
          href="/dashboard"
          className="flex items-center gap-3 px-3 py-2.5 text-sm text-white/60 hover:bg-white/5 hover:text-white transition"
        >
          <ArrowUpRight className="w-4 h-4" />
          Atuar como vendedor
        </Link>
      </div>
    </aside>
  );
}
