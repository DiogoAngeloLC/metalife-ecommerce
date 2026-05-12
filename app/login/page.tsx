import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/supabase/auth";
import { LoginForm } from "./login-form";

export const metadata = {
  title: "Entrar · Reforma",
};

export default async function LoginPage({
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
          <div className="w-12 h-12 rounded-full bg-[var(--ink)] flex items-center justify-center">
            <span className="font-display text-white text-2xl italic">R</span>
          </div>
          <div className="flex flex-col leading-none">
            <span className="font-display text-2xl tracking-tight">Reforma</span>
            <span className="text-[10px] uppercase tracking-[0.2em] text-[var(--text-muted)] mt-0.5">
              Marketplace · Pilates
            </span>
          </div>
        </Link>

        <div className="text-center mb-10">
          <div className="text-xs uppercase tracking-[0.25em] text-[var(--terra)] mb-3">
            Acesso ao painel
          </div>
          <h1 className="font-display text-4xl leading-tight mb-3">Entre na sua conta</h1>
          <p className="text-[var(--text-muted)] text-sm">
            Enviamos um link mágico pro seu email. Sem senha, sem complicação.
          </p>
        </div>

        <LoginForm next={searchParams.next} />

        {searchParams.error && (
          <p className="mt-6 text-sm text-red-700 text-center">
            Não foi possível autenticar. Tente novamente.
          </p>
        )}

        <p className="mt-10 text-xs text-center text-[var(--text-muted)]">
          Ao continuar você concorda com os termos do <strong>Reforma</strong>.
        </p>
      </div>
    </div>
  );
}
