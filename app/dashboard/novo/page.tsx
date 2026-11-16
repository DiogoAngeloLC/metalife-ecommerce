import { redirect } from "next/navigation";
import { getCurrentUser, isCurrentUserAdmin } from "@/lib/supabase/auth";

export const metadata = { title: "Produtos · Metalife Pilates" };

/** Criação de anúncios por lojistas externos desativada. */
export default async function NovoAnuncioPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (await isCurrentUserAdmin()) redirect("/admin/anuncios");
  redirect("/catalogo");
}
