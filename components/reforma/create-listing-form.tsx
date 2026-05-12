"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { nanoid } from "nanoid";
import Link from "next/link";
import { ArrowLeft, Upload, Camera, Sparkle, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { createListingAction } from "@/app/dashboard/novo/actions";
import type { Database } from "@/lib/supabase/types";

type Vendor = Database["public"]["Tables"]["vendors"]["Row"];

// Schema sem `id` e `imagePaths` (preenchidos no submit)
const FormSchema = z.object({
  title: z.string().min(3, "Mínimo 3 caracteres").max(120),
  equipment_type: z.string().min(2, "Informe o tipo de equipamento"),
  brand: z.string().optional(),
  year: z.string().optional(),
  condition: z.enum(["novo", "seminovo", "usado_bom", "usado_regular"]),
  description: z.string().optional(),
  city: z.string().min(2, "Informe a cidade"),
  state: z.string().length(2, "UF tem 2 letras"),
  has_fixed_price: z.enum(["true", "false"]),
  price: z.string().optional(),
  is_negotiable: z.boolean(),
});

type FormValues = z.infer<typeof FormSchema>;

const MAX_IMAGES = 8;

export function CreateListingForm({ vendor }: { vendor: Vendor }) {
  const router = useRouter();
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      has_fixed_price: "true",
      is_negotiable: true,
      condition: "seminovo",
      state: vendor.state ?? "",
      city: vendor.city ?? "",
    },
  });

  const hasFixedPrice = watch("has_fixed_price") === "true";

  const onFiles = (selected: FileList | null) => {
    if (!selected) return;
    const next = Array.from(selected).slice(0, MAX_IMAGES - files.length);
    setFiles((prev) => [...prev, ...next]);
    setPreviews((prev) => [...prev, ...next.map((f) => URL.createObjectURL(f))]);
  };

  const removeFile = (idx: number) => {
    URL.revokeObjectURL(previews[idx]);
    setFiles((prev) => prev.filter((_, i) => i !== idx));
    setPreviews((prev) => prev.filter((_, i) => i !== idx));
  };

  const onSubmit = async (data: FormValues) => {
    setBusy(true);
    setError(null);

    try {
      const supabase = createClient();
      const listingId = crypto.randomUUID();

      // Upload das imagens
      const imagePaths: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
        const path = `${vendor.id}/${listingId}/${i}-${nanoid(8)}.${ext}`;

        const { error: upErr } = await supabase.storage
          .from("listing-images")
          .upload(path, file, { contentType: file.type });

        if (upErr) throw new Error(`Erro ao enviar imagem ${i + 1}: ${upErr.message}`);
        imagePaths.push(path);
      }

      // Criar listing
      await createListingAction({
        id: listingId,
        title: data.title,
        description: data.description || "",
        equipment_type: data.equipment_type,
        brand: data.brand || "",
        year: data.year ? parseInt(data.year, 10) : undefined,
        condition: data.condition,
        has_fixed_price: data.has_fixed_price === "true",
        price:
          data.has_fixed_price === "true" && data.price
            ? parseFloat(data.price.replace(/\D/g, "")) / 100
            : undefined,
        is_negotiable: data.is_negotiable,
        city: data.city,
        state: data.state,
        imagePaths,
      });

      router.push("/dashboard?published=1");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro inesperado");
      setBusy(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-5 md:px-8 py-10 md:py-14">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 text-sm text-[var(--ink-soft)] hover:text-[var(--ink)] mb-6 transition"
      >
        <ArrowLeft className="w-4 h-4" />
        Voltar ao painel
      </Link>

      <div className="text-xs uppercase tracking-[0.25em] text-[var(--terra)] mb-3">Novo anúncio</div>
      <h1 className="font-display text-4xl md:text-5xl leading-tight mb-2">Conte sobre seu equipamento.</h1>
      <p className="text-[var(--text-muted)] mb-10">Quanto mais detalhe, mais qualificado o comprador chega.</p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-10">
        {/* FOTOS */}
        <section>
          <h2 className="font-display text-xl mb-1">Fotos</h2>
          <p className="text-sm text-[var(--text-muted)] mb-4">
            Adicione até {MAX_IMAGES} fotos. A primeira será a principal.
          </p>
          <div className="grid grid-cols-4 gap-3">
            {previews.length < MAX_IMAGES && (
              <label className="aspect-square rounded-xl border-2 border-dashed border-[var(--line)] hover:border-[var(--terra)] transition flex flex-col items-center justify-center cursor-pointer group">
                <input
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => onFiles(e.target.files)}
                />
                <Upload className="w-6 h-6 text-[var(--text-muted)] group-hover:text-[var(--terra)] mb-1.5 transition" />
                <span className="text-xs text-[var(--text-muted)] group-hover:text-[var(--terra)] transition">Adicionar</span>
              </label>
            )}
            {previews.map((src, i) => (
              <div key={i} className="relative aspect-square rounded-xl overflow-hidden group">
                <img src={src} alt="" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeFile(i)}
                  className="absolute top-1.5 right-1.5 w-7 h-7 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition flex items-center justify-center"
                  aria-label="Remover"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
                {i === 0 && (
                  <div className="absolute bottom-1.5 left-1.5 text-[10px] uppercase tracking-wider bg-[var(--terra)] text-white px-2 py-0.5 rounded">
                    Capa
                  </div>
                )}
              </div>
            ))}
            {Array.from({ length: Math.max(0, MAX_IMAGES - previews.length - 1) }).slice(0, 3 - previews.length).map((_, i) => (
              <div key={`ph-${i}`} className="aspect-square rounded-xl bg-[var(--bone)] flex items-center justify-center">
                <Camera className="w-5 h-5 text-[var(--text-muted)]" />
              </div>
            ))}
          </div>
        </section>

        {/* INFO */}
        <section className="space-y-5">
          <h2 className="font-display text-xl">Informações</h2>

          <Field label="Título do anúncio" error={errors.title?.message}>
            <input
              {...register("title")}
              placeholder="Ex: Reformer Arktus Clássico seminovo"
              className="input"
            />
          </Field>

          <div className="grid md:grid-cols-2 gap-5">
            <Field label="Tipo de equipamento" error={errors.equipment_type?.message}>
              <input
                {...register("equipment_type")}
                placeholder="Reformer, Cadillac, Wall Unit…"
                className="input"
              />
            </Field>

            <Field label="Marca" error={errors.brand?.message}>
              <input
                {...register("brand")}
                placeholder="Arktus, Metalife, Polestar…"
                className="input"
              />
            </Field>

            <Field label="Estado de conservação" error={errors.condition?.message}>
              <select {...register("condition")} className="input cursor-pointer">
                <option value="novo">Novo</option>
                <option value="seminovo">Seminovo</option>
                <option value="usado_bom">Usado · Bom estado</option>
                <option value="usado_regular">Usado · Estado regular</option>
              </select>
            </Field>

            <Field label="Ano" error={errors.year?.message}>
              <input {...register("year")} type="number" placeholder="2022" className="input" />
            </Field>
          </div>

          <Field label="Descrição" error={errors.description?.message}>
            <textarea
              {...register("description")}
              rows={4}
              placeholder="Conte detalhes: manutenção, acessórios inclusos, motivo da venda…"
              className="input resize-none"
            />
          </Field>
        </section>

        {/* LOCALIZAÇÃO */}
        <section className="space-y-5">
          <h2 className="font-display text-xl">Onde está o equipamento</h2>
          <div className="grid md:grid-cols-3 gap-5">
            <div className="md:col-span-2">
              <Field label="Cidade" error={errors.city?.message}>
                <input {...register("city")} placeholder="São Paulo" className="input" />
              </Field>
            </div>
            <Field label="UF" error={errors.state?.message}>
              <input
                {...register("state")}
                placeholder="SP"
                maxLength={2}
                className="input uppercase"
              />
            </Field>
          </div>
        </section>

        {/* PREÇO */}
        <section className="space-y-5">
          <h2 className="font-display text-xl">Valor</h2>
          <div className="flex gap-3">
            <label className="flex-1 cursor-pointer">
              <input type="radio" value="true" {...register("has_fixed_price")} className="peer sr-only" />
              <div className="p-4 border border-[var(--line)] rounded-2xl peer-checked:border-[var(--terra)] peer-checked:bg-[var(--terra)]/5 transition">
                <div className="font-medium mb-1">Valor fixo</div>
                <div className="text-xs text-[var(--text-muted)]">Defino o preço do anúncio</div>
              </div>
            </label>
            <label className="flex-1 cursor-pointer">
              <input type="radio" value="false" {...register("has_fixed_price")} className="peer sr-only" />
              <div className="p-4 border border-[var(--line)] rounded-2xl peer-checked:border-[var(--terra)] peer-checked:bg-[var(--terra)]/5 transition">
                <div className="font-medium mb-1">A combinar</div>
                <div className="text-xs text-[var(--text-muted)]">Negocio direto com interessado</div>
              </div>
            </label>
          </div>

          {hasFixedPrice && (
            <div className="grid md:grid-cols-2 gap-5">
              <Field label="Valor (R$)" error={errors.price?.message}>
                <input
                  {...register("price")}
                  type="number"
                  step="0.01"
                  placeholder="18500"
                  className="input"
                />
              </Field>
              <div className="flex items-end">
                <label className="flex items-center gap-3 cursor-pointer pb-2">
                  <input
                    type="checkbox"
                    {...register("is_negotiable")}
                    className="w-4 h-4 rounded accent-[var(--terra)]"
                  />
                  <span className="text-sm">Aceito propostas / negociável</span>
                </label>
              </div>
            </div>
          )}
        </section>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-800">
            {error}
          </div>
        )}

        <div className="border-t border-[var(--line)] pt-6 flex flex-col md:flex-row gap-3 justify-end">
          <button
            type="submit"
            disabled={busy}
            className="bg-[var(--ink)] text-white rounded-full px-8 py-3 hover:opacity-90 transition flex items-center justify-center gap-2 font-medium disabled:opacity-40"
          >
            {busy ? (
              <>Publicando…</>
            ) : (
              <>
                <Sparkle className="w-4 h-4" />
                Publicar anúncio
              </>
            )}
          </button>
        </div>
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

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="text-xs uppercase tracking-wider text-[var(--text-muted)] block mb-2">{label}</label>
      {children}
      {error && <p className="text-xs text-red-700 mt-1">{error}</p>}
    </div>
  );
}
