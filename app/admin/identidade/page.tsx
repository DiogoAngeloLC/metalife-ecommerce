import { getBrand } from "@/lib/site-config";
import { BrandEditor } from "@/components/admin/brand-editor";

export const dynamic = "force-dynamic";
export const metadata = { title: "Identidade · Admin" };

export default async function IdentidadePage() {
  const brand = await getBrand();
  return <BrandEditor brand={brand} />;
}
