"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft } from "lucide-react";
import { updateVendorAction } from "./actions";
import type { Database } from "@/lib/supabase/types";

type Vendor = Database["public"]["Tables"]["vendors"]["Row"];

const FormSchema = z.object({
  name: z.string().trim().min(2, "Mínimo 2 caracteres"),
  whatsapp: z.string().trim().min(10, "Número incompleto"),
  city: z.string().trim().min(2, "Informe sua cidade"),
  state: z.string().trim().length(2, "UF tem 2 letras"),
});

type FormValues = z.infer<typeof FormSchema>;

function formatWhatsapp(v: string): string {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

export function PerfilForm({ vendor }: { vendor: Vendor }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      name: vendor.name ?? "",
      whatsapp: vendor.whatsapp ? formatWhatsapp(vendor.whatsapp) : "",
      city: vendor.city ?? "",
      state: vendor.state ?? "",
    },
  });

  const whatsappValue = watch("whatsapp");

  const onSubmit = async (data: FormValues) => {
    setBusy(true);
    setError(null);
    try {
      await updateVendorAction({
        name: data.name,
        whatsapp: data.whatsapp.replace(/\D/g, ""),
        city: data.city,
        state: data.state,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro inesperado");
      setBusy(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-5 md:px-8 py-10 md:py-14">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 text-sm text-[var(--ink-soft)] hover:text-[var(--ink)] mb-6 transition"
      >
        <ArrowLeft className="w-4 h-4" />
        Voltar ao painel
      </Link>

      <div className="text-xs uppercase tracking-[0.25em] text-[var(--terra)] mb-3">Meu perfil</div>
      <h1 className="font-display text-4xl md:text-5xl leading-tight mb-2">
        {vendor.onboarding_completed ? "Edite seus dados" : "Complete seu perfil"}
      </h1>
      <p className="text-[var(--text-muted)] mb-10">
        Seu WhatsApp é usado para receber os leads dos compradores interessados nos seus anúncios.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Field label="Nome ou nome do estúdio" error={errors.name?.message}>
          <input {...register("name")} className="input" placeholder="Mariana Costa / Studio Pilates BH" />
        </Field>

        <Field label="WhatsApp" error={errors.whatsapp?.message}>
          <input
            value={whatsappValue}
            onChange={(e) => setValue("whatsapp", formatWhatsapp(e.target.value))}
            className="input"
            placeholder="(11) 99999-9999"
          />
        </Field>

        <div className="grid md:grid-cols-3 gap-5">
          <div className="md:col-span-2">
            <Field label="Cidade" error={errors.city?.message}>
              <input {...register("city")} className="input" placeholder="São Paulo" />
            </Field>
          </div>
          <Field label="UF" error={errors.state?.message}>
            <input {...register("state")} maxLength={2} className="input uppercase" placeholder="SP" />
          </Field>
        </div>

        {error && <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-800">{error}</div>}

        <button
          type="submit"
          disabled={busy}
          className="w-full bg-[var(--ink)] text-white rounded-full py-3.5 font-medium hover:opacity-90 transition disabled:opacity-40"
        >
          {busy ? "Salvando…" : "Salvar e continuar"}
        </button>
      </form>

      <style jsx>{`
        :global(.input) {
          width: 100%;
          background: transparent;
          border-bottom: 1px solid var(--line);
          outline: none;
          padding: 0.5rem 0;
          font-size: 15px;
          transition: border-color 0.2s;
        }
        :global(.input:focus) {
          border-color: var(--terra);
        }
      `}</style>
    </div>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs uppercase tracking-wider text-[var(--text-muted)] block mb-2">{label}</label>
      {children}
      {error && <p className="text-xs text-red-700 mt-1">{error}</p>}
    </div>
  );
}
