import { getThemeTokens } from "@/lib/site-config";
import { ThemeBuilderContent } from "@/components/admin/theme-builder-content";

export const dynamic = "force-dynamic";
export const metadata = { title: "Tema · Admin" };

export default async function ThemePage() {
  const tokens = await getThemeTokens();
  return <ThemeBuilderContent initialTokens={tokens} />;
}
