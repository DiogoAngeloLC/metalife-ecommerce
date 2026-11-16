"use client";

import { usePathname } from "next/navigation";

/** Oculta o header público em telas de auth e no shell admin (sidebar própria). */
export function ConditionalSiteHeader({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hide =
    pathname === "/login" ||
    pathname === "/cadastro" ||
    pathname.startsWith("/admin");

  if (hide) return null;
  return <>{children}</>;
}
