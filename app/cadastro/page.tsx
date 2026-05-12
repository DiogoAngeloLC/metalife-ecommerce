import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/supabase/auth";
import { SignupForm } from "./signup-form";

export const metadata = {
  title: "Criar conta · Classificado Pilates",
};

export default async function CadastroPage({
  searchParams,
}: {
  searchParams: { next?: string; error?: string };
}) {
  const user = await getCurrentUser();
  if (user) redirect(searchParams.next ?? "/dashboard");

  return (
    <div className="min-h-screen bg-[var(--bg)] flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md">
        <Link href="/" className="flex items-center justify-center gap-3 mb-12 group">
          <span className="font-display text-2xl font-black italic uppercase text-[var(--action)]">
            CLASSIFICADO PILATES
          </span>
        </Link>

        <div className="text-center mb-8">
          <div className="text-label-bold text-[var(--action)] mb-3">
            NOVA CONTA
          </div>
          <h1 className="font-display text-3xl font-bold uppercase leading-tight mb-3 text-[var(--ink)]">
            Crie sua conta
          </h1>
          <p className="text-[var(--text-muted)] text-sm">
            Preencha os dados abaixo para começar a anunciar.
          </p>
        </div>

        <SignupForm next={searchParams.next} />

        {searchParams.error && (
          <p className="mt-6 text-sm text-[var(--danger)] text-center">
            Não foi possível criar a conta. Tente novamente.
          </p>
        )}

        <p className="mt-10 text-xs text-center text-[var(--text-muted)]">
          Ao continuar você concorda com os termos do <strong>Classificado Pilates</strong>.
        </p>
      </div>
    </div>
  );
}
