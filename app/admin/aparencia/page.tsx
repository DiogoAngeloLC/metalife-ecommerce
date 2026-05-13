import { requireAdmin } from "@/lib/supabase/auth";
import { getHeroSettings } from "@/lib/content";
import { HeroEditor } from "./hero-editor";

export const dynamic = "force-dynamic";
export const metadata = { title: "Aparência · Admin" };

export default async function AparenciaPage() {
  await requireAdmin();
  const hero = await getHeroSettings();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold uppercase">Aparência</h1>
        <p className="text-sm text-[var(--text-muted)] mt-1">
          Gerencie o hero da home e identidade visual.
        </p>
      </div>

      <HeroEditor hero={hero} />
    </div>
  );
}
