import { redirect } from "next/navigation";
import { getCurrentUser, isCurrentUserAdmin } from "@/lib/supabase/auth";

export const metadata = { title: "Editar produto · Metalife Pilates" };

export default async function EditarAnuncioPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (await isCurrentUserAdmin()) redirect("/admin/anuncios");
  redirect("/catalogo");
}
