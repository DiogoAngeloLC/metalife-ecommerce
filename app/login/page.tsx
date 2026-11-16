import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/supabase/auth";
import { getBrand } from "@/lib/site-config";
import { LoginForm } from "./login-form";

export async function generateMetadata() {
  const brand = await getBrand();
  return { title: `Entrar · ${brand.name}` };
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: { next?: string; error?: string };
}) {
  const user = await getCurrentUser();
  if (user) redirect(searchParams.next ?? "/dashboard");

  const brand = await getBrand();
  const logoSrc = brand.logo_url ?? "/images/logo-metalife-verde.png";

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md">
        <Link href="/" className="flex items-center justify-center mb-10">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={logoSrc}
            alt={brand.name}
            className="h-12 w-auto max-w-[240px] object-contain"
          />
        </Link>

        <div className="rounded-md border border-white/10 bg-white p-8 shadow-xl">
          <div className="text-center mb-8">
            <div className="text-label-bold text-primary mb-3">
              ACESSO AO PAINEL
            </div>
            <h1 className="font-display text-3xl font-bold uppercase leading-tight mb-3 text-[var(--ink)]">
              Entre na sua conta
            </h1>
            <p className="text-[var(--text-muted)] text-sm">
              Escolha como prefere acessar sua conta.
            </p>
          </div>

          <LoginForm next={searchParams.next} />

          {searchParams.error && (
            <p className="mt-6 text-sm text-[var(--danger)] text-center">
              Não foi possível autenticar. Tente novamente.
            </p>
          )}
        </div>

        <p className="mt-8 text-xs text-center text-white/50">
          Ao continuar você concorda com os termos da <strong className="text-white/80">{brand.name}</strong>.
        </p>
      </div>
    </div>
  );
}
