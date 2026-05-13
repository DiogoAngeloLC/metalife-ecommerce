import { requireAdmin } from "@/lib/supabase/auth";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { getBrand } from "@/lib/site-config";

export const metadata = { title: "Admin · Classificado Pilates" };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  const brand = await getBrand();

  return (
    <div className="min-h-screen flex bg-[var(--bg)]">
      <AdminSidebar brand={brand} />
      <main className="flex-1 overflow-x-hidden">{children}</main>
    </div>
  );
}
