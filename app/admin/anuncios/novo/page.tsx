import { requireAdmin } from "@/lib/supabase/auth";
import { AdminProductEditor } from "@/components/admin/admin-product-editor";

export const dynamic = "force-dynamic";

export const metadata = { title: "Novo Produto · Admin" };

export default async function AdminNewProductPage() {
  await requireAdmin();
  return <AdminProductEditor mode="create" />;
}
