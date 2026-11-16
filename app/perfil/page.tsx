import { requireVendor } from "@/lib/supabase/auth";
import { PerfilForm } from "./perfil-form";

export const metadata = { title: "Meu perfil · Metalife Pilates" };

export default async function PerfilPage() {
  const vendor = await requireVendor();
  return <PerfilForm vendor={vendor} />;
}
