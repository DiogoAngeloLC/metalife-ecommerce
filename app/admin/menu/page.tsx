import { getMenuItems } from "@/lib/site-config";
import { MenuEditor } from "@/components/admin/menu-editor";

export const dynamic = "force-dynamic";
export const metadata = { title: "Menu · Admin" };

export default async function MenuPage() {
  const items = await getMenuItems();
  return <MenuEditor initialItems={items} />;
}
