"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Newspaper, Users, MessageCircle, LogOut, ArrowUpRight, Wifi, FileText, AlertOctagon } from "lucide-react";

const NAV = [
  { href: "/admin", label: "Visão geral", icon: LayoutDashboard, exact: true },
  { href: "/admin/anuncios", label: "Anúncios", icon: Newspaper },
  { href: "/admin/usuarios", label: "Usuários", icon: Users },
  { href: "/admin/leads", label: "Leads", icon: MessageCircle },
  { href: "/admin/conexao", label: "Conexão", icon: Wifi },
  { href: "/admin/logs/mensagens", label: "Mensagens", icon: FileText },
  { href: "/admin/logs/erros", label: "Erros", icon: AlertOctagon },
];

export function AdminSidebar() {
  const pathname = usePathname();

  const isActive = (item: (typeof NAV)[0]) =>
    item.exact ? pathname === item.href : pathname.startsWith(item.href);

  return (
    <aside className="w-64 min-h-screen bg-[var(--bg-dark)] text-white flex flex-col flex-shrink-0">
      <div className="p-6 border-b border-white/10">
        <Link href="/" className="flex items-center gap-3 group">
          <span className="font-display text-lg font-black italic uppercase text-[var(--action)]">
            CP
          </span>
          <div className="flex flex-col leading-none">
            <span className="font-display text-base font-bold uppercase tracking-tight">Classificado</span>
            <span className="text-[10px] uppercase tracking-[0.2em] text-white/40 mt-0.5">Admin</span>
          </div>
        </Link>
      </div>

      <nav className="flex-1 px-3 py-6 space-y-1">
        {NAV.map((item) => {
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
              <Icon className="w-4 h-4" />
              {item.label}
            </Link>
          );
        })}
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
