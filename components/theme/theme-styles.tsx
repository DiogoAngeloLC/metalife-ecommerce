import { getThemeTokens, generateThemeCss } from "@/lib/site-config";

export async function ThemeStyles() {
  const tokens = await getThemeTokens();
  const css = generateThemeCss(tokens);
  return <style dangerouslySetInnerHTML={{ __html: css }} />;
}
