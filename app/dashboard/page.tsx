import { redirect } from "next/navigation";
import { getCurrentUser, isCurrentUserAdmin } from "@/lib/supabase/auth";

export const metadata = { title: "Painel · Metalife Pilates" };

/** Painel de anunciante P2P desativado — Loja Oficial única. */
export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/minha-conta/pedidos");
  if (await isCurrentUserAdmin()) redirect("/admin");
  redirect("/minha-conta/pedidos");
}
