import { getLegalPage } from "@/lib/content";
import { getFooterConfig } from "@/lib/site-config";
import { LegalPageRender } from "@/components/reforma/legal-page-render";
import { SiteFooter } from "@/components/reforma/site-footer";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";
export const metadata = { title: "Termos de Uso · Classificado Pilates" };

export default async function TermsPage() {
  const page = await getLegalPage("termos-de-uso");
  if (!page) notFound();
  const footer = await getFooterConfig();
  return (
    <>
      <LegalPageRender title={page.title} contentMd={page.content_md} updatedAt={page.updated_at} />
      <SiteFooter footer={footer} />
    </>
  );
}
