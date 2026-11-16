import { requireAdmin } from "@/lib/supabase/auth";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { getBrand } from "@/lib/site-config";

export async function generateMetadata() {
  const brand = await getBrand();
  return { title: `Admin · ${brand.name}` };
}

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
