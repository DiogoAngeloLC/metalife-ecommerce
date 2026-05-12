import { requireVendor } from "@/lib/supabase/auth";
import { PerfilForm } from "./perfil-form";

export const metadata = { title: "Meu perfil · Reforma" };

export default async function PerfilPage() {
  const vendor = await requireVendor();
  return <PerfilForm vendor={vendor} />;
}
