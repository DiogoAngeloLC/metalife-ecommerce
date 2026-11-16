import { getLegalPage } from "@/lib/content";
import { getFooterConfig } from "@/lib/site-config";
import { LegalPageRender } from "@/components/reforma/legal-page-render";
import { SiteFooter } from "@/components/reforma/site-footer";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";
export const metadata = { title: "Política de Privacidade · Metalife Pilates" };

export default async function PrivacyPage() {
  const page = await getLegalPage("politica-de-privacidade");
  if (!page) notFound();
  const footer = await getFooterConfig();
  return (
    <>
      <LegalPageRender title={page.title} contentMd={page.content_md} updatedAt={page.updated_at} />
      <SiteFooter footer={footer} />
    </>
  );
}
