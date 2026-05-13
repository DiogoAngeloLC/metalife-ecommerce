import { getFooterConfig } from "@/lib/site-config";
import { FooterEditor } from "@/components/admin/footer-editor";

export const dynamic = "force-dynamic";
export const metadata = { title: "Rodapé · Admin" };

export default async function RodapePage() {
  const footer = await getFooterConfig();
  return <FooterEditor initial={footer} />;
}
