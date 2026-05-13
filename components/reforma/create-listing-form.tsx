"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { nanoid } from "nanoid";
import Link from "next/link";
import { ArrowLeft, Upload, Camera, Sparkle, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { createListingAction, updateListingAction } from "@/app/dashboard/novo/actions";
import type { Database } from "@/lib/supabase/types";
import { getListingImageUrl } from "@/lib/storage";

type Vendor = Database["public"]["Tables"]["vendors"]["Row"];
type ListingRow = Database["public"]["Tables"]["listings"]["Row"];

export type InitialListingForEdit = Pick<
  ListingRow,
  | "id"
  | "title"
  | "description"
  | "equipment_type"
  | "brand"
  | "year"
  | "condition"
  | "has_fixed_price"
  | "price"
  | "is_negotiable"
  | "city"
  | "state"
> & {
  listing_images: { storage_path: string; position: number }[];
};

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

type ImgSlot =
  | { kind: "existing"; path: string; preview: string }
  | { kind: "new"; file: File; preview: string };

function slotsFromListing(listing: InitialListingForEdit): ImgSlot[] {
  return [...listing.listing_images]
    .sort((a, b) => a.position - b.position)
    .map((img) => ({
      kind: "existing" as const,
      path: img.storage_path,
      preview: getListingImageUrl(img.storage_path),
    }));
}

export function CreateListingForm({
  vendor,
  initialListing,
}: {
  vendor: Vendor;
  initialListing?: InitialListingForEdit;
}) {
  const router = useRouter();
  const isEdit = Boolean(initialListing);
  const [slots, setSlots] = useState<ImgSlot[]>(() =>
    initialListing ? slotsFromListing(initialListing) : []
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const defaultValues = useMemo<FormValues>(
    () =>
      initialListing
        ? {
            title: initialListing.title,
            equipment_type: initialListing.equipment_type,
            brand: initialListing.brand ?? "",
            year: initialListing.year != null ? String(initialListing.year) : "",
            condition: initialListing.condition as FormValues["condition"],
            description: initialListing.description ?? "",
            city: initialListing.city,
            state: initialListing.state,
            has_fixed_price: initialListing.has_fixed_price ? "true" : "false",
            price:
              initialListing.has_fixed_price && initialListing.price != null
                ? String(initialListing.price)
                : "",
            is_negotiable: initialListing.is_negotiable,
          }
        : {
            has_fixed_price: "true",
            is_negotiable: true,
            condition: "seminovo",
            state: vendor.state ?? "",
            city: vendor.city ?? "",
            title: "",
            equipment_type: "",
            brand: "",
            year: "",
            description: "",
            price: "",
          },
    [initialListing, vendor.state, vendor.city]
  );

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues,
  });

  useEffect(() => {
    if (!initialListing) return;
    reset({
      title: initialListing.title,
      equipment_type: initialListing.equipment_type,
      brand: initialListing.brand ?? "",
      year: initialListing.year != null ? String(initialListing.year) : "",
      condition: initialListing.condition as FormValues["condition"],
      description: initialListing.description ?? "",
      city: initialListing.city,
      state: initialListing.state,
      has_fixed_price: initialListing.has_fixed_price ? "true" : "false",
      price:
        initialListing.has_fixed_price && initialListing.price != null
          ? String(initialListing.price)
          : "",
      is_negotiable: initialListing.is_negotiable,
    });
    setSlots(slotsFromListing(initialListing));
  }, [initialListing, reset]);

  const hasFixedPrice = watch("has_fixed_price") === "true";

  const onFiles = (selected: FileList | null) => {
    if (!selected) return;
    const next = Array.from(selected).slice(0, MAX_IMAGES - slots.length);
    setSlots((prev) => [
      ...prev,
      ...next.map((file) => ({
        kind: "new" as const,
        file,
        preview: URL.createObjectURL(file),
      })),
    ]);
  };

  const removeSlot = (idx: number) => {
    setSlots((prev) => {
      const s = prev[idx];
      if (s?.kind === "new") URL.revokeObjectURL(s.preview);
      return prev.filter((_, i) => i !== idx);
    });
  };

  const onSubmit = async (data: FormValues) => {
    setBusy(true);
    setError(null);

    try {
      const supabase = createClient();
      const listingId = initialListing?.id ?? crypto.randomUUID();

      const imagePaths: string[] = [];
      for (let i = 0; i < slots.length; i++) {
        const slot = slots[i];
        if (slot.kind === "existing") {
          imagePaths.push(slot.path);
          continue;
        }
        const file = slot.file;
        const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
        const path = `${vendor.id}/${listingId}/${i}-${nanoid(8)}.${ext}`;

        const { error: upErr } = await supabase.storage
          .from("listing-images")
          .upload(path, file, { contentType: file.type });

        if (upErr) throw new Error(`Erro ao enviar imagem ${i + 1}: ${upErr.message}`);
        imagePaths.push(path);
      }

      let priceNum: number | undefined;
      if (data.has_fixed_price === "true" && data.price !== "" && data.price != null) {
        const n = Number(String(data.price).replace(",", "."));
        priceNum = Number.isFinite(n) ? n : undefined;
      }

      if (isEdit && initialListing) {
        await updateListingAction({
          listing_id: initialListing.id,
          title: data.title,
          description: data.description || "",
          equipment_type: data.equipment_type,
          brand: data.brand || "",
          year: data.year ? parseInt(data.year, 10) : undefined,
          condition: data.condition,
          has_fixed_price: data.has_fixed_price === "true",
          price: data.has_fixed_price === "true" ? priceNum : undefined,
          is_negotiable: data.is_negotiable,
          city: data.city,
          state: data.state,
          imagePaths,
        });
        router.push("/dashboard?updated=1");
      } else {
        await createListingAction({
          id: listingId,
          title: data.title,
          description: data.description || "",
          equipment_type: data.equipment_type,
          brand: data.brand || "",
          year: data.year ? parseInt(data.year, 10) : undefined,
          condition: data.condition,
          has_fixed_price: data.has_fixed_price === "true",
          price: data.has_fixed_price === "true" ? priceNum : undefined,
          is_negotiable: data.is_negotiable,
          city: data.city,
          state: data.state,
          imagePaths,
        });
        router.push("/dashboard?published=1");
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro inesperado");
      setBusy(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 md:py-12">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 text-label-bold text-[var(--ink-soft)] hover:text-[var(--action)] mb-6 transition"
      >
        <ArrowLeft className="w-4 h-4" />
        Voltar ao painel
      </Link>

      <div className="text-label-bold text-[var(--action)] mb-3">{isEdit ? "EDITAR ANÚNCIO" : "NOVO ANÚNCIO"}</div>
      <h1 className="font-display text-3xl md:text-4xl font-bold uppercase leading-tight mb-2 text-[var(--ink)]">
        {isEdit ? "Atualize as informações do anúncio." : "Conte sobre seu equipamento."}
      </h1>
      <p className="text-sm text-[var(--text-muted)] mb-8">
        {isEdit
          ? "Ao salvar, o anúncio volta para análise da equipe e some do catálogo até ser aprovado novamente."
          : "Quanto mais detalhe, mais qualificado o comprador chega."}
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        <section>
          <h2 className="font-display text-lg font-bold uppercase mb-1">Fotos</h2>
          <p className="text-xs text-[var(--text-muted)] mb-4">
            Adicione até {MAX_IMAGES} fotos. A primeira será a principal.
          </p>
          <div className="grid grid-cols-4 gap-2">
            {slots.length < MAX_IMAGES && (
              <label className="aspect-square border-2 border-dashed border-[var(--line)] hover:border-[var(--action)] transition flex flex-col items-center justify-center cursor-pointer group">
                <input
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => onFiles(e.target.files)}
                />
                <Upload className="w-6 h-6 text-[var(--text-muted)] group-hover:text-[var(--action)] mb-1.5 transition" />
                <span className="text-[10px] font-bold uppercase text-[var(--text-muted)] group-hover:text-[var(--action)] transition">
                  Adicionar
                </span>
              </label>
            )}
            {slots.map((slot, i) => (
              <div key={`${slot.kind}-${i}-${slot.kind === "existing" ? slot.path : slot.preview}`} className="relative aspect-square overflow-hidden group border border-[var(--line)]">
                <img src={slot.preview} alt="" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeSlot(i)}
                  className="absolute top-1.5 right-1.5 w-7 h-7 bg-black/60 text-white opacity-0 group-hover:opacity-100 transition flex items-center justify-center"
                  aria-label="Remover"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
                {i === 0 && (
                  <div className="absolute bottom-1.5 left-1.5 text-[10px] uppercase tracking-wider bg-[var(--action)] text-white px-2 py-0.5 font-bold">
                    Capa
                  </div>
                )}
              </div>
            ))}
            {Array.from({
              length: Math.max(0, Math.min(3, MAX_IMAGES - slots.length - 1)),
            }).map((_, i) => (
              <div key={`ph-${i}`} className="aspect-square bg-[var(--bg-section)] flex items-center justify-center border border-[var(--line)]">
                <Camera className="w-5 h-5 text-[var(--text-muted)]" />
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-5">
          <h2 className="font-display text-lg font-bold uppercase">Informações</h2>

          <Field label="Título do anúncio" error={errors.title?.message}>
            <input
              {...register("title")}
              placeholder="Ex: Reformer Arktus Clássico seminovo"
              className="w-full border border-[var(--line)] p-3 text-sm outline-none transition focus:border-[var(--action)] bg-white"
            />
          </Field>

          <div className="grid md:grid-cols-2 gap-5">
            <Field label="Tipo de equipamento" error={errors.equipment_type?.message}>
              <input
                {...register("equipment_type")}
                placeholder="Reformer, Cadillac, Wall Unit…"
                className="w-full border border-[var(--line)] p-3 text-sm outline-none transition focus:border-[var(--action)] bg-white"
              />
            </Field>

            <Field label="Marca" error={errors.brand?.message}>
              <input
                {...register("brand")}
                placeholder="Arktus, Metalife, Polestar…"
                className="w-full border border-[var(--line)] p-3 text-sm outline-none transition focus:border-[var(--action)] bg-white"
              />
            </Field>

            <Field label="Estado de conservação" error={errors.condition?.message}>
              <select {...register("condition")} className="w-full border border-[var(--line)] p-3 text-sm outline-none transition focus:border-[var(--action)] bg-white cursor-pointer">
                <option value="novo">Novo</option>
                <option value="seminovo">Seminovo</option>
                <option value="usado_bom">Usado · Bom estado</option>
                <option value="usado_regular">Usado · Estado regular</option>
              </select>
            </Field>

            <Field label="Ano" error={errors.year?.message}>
              <input {...register("year")} type="number" placeholder="2022" className="w-full border border-[var(--line)] p-3 text-sm outline-none transition focus:border-[var(--action)] bg-white" />
            </Field>
          </div>

          <Field label="Descrição" error={errors.description?.message}>
            <textarea
              {...register("description")}
              rows={4}
              placeholder="Conte detalhes: manutenção, acessórios inclusos, motivo da venda…"
              className="w-full border border-[var(--line)] p-3 text-sm outline-none transition focus:border-[var(--action)] bg-white resize-none"
            />
          </Field>
        </section>

        <section className="space-y-5">
          <h2 className="font-display text-lg font-bold uppercase">Onde está o equipamento</h2>
          <div className="grid md:grid-cols-3 gap-5">
            <div className="md:col-span-2">
              <Field label="Cidade" error={errors.city?.message}>
                <input {...register("city")} placeholder="São Paulo" className="w-full border border-[var(--line)] p-3 text-sm outline-none transition focus:border-[var(--action)] bg-white" />
              </Field>
            </div>
            <Field label="UF" error={errors.state?.message}>
              <input
                {...register("state")}
                placeholder="SP"
                maxLength={2}
                className="w-full border border-[var(--line)] p-3 text-sm outline-none transition focus:border-[var(--action)] bg-white uppercase"
              />
            </Field>
          </div>
        </section>

        <section className="space-y-5">
          <h2 className="font-display text-lg font-bold uppercase">Valor</h2>
          <div className="flex gap-3">
            <label className="flex-1 cursor-pointer">
              <input type="radio" value="true" {...register("has_fixed_price")} className="peer sr-only" />
              <div className="p-4 border border-[var(--line)] peer-checked:border-[var(--action)] peer-checked:bg-[var(--action)]/5 transition">
                <div className="font-display font-bold text-sm uppercase mb-1">Valor fixo</div>
                <div className="text-xs text-[var(--text-muted)]">Defino o preço do anúncio</div>
              </div>
            </label>
            <label className="flex-1 cursor-pointer">
              <input type="radio" value="false" {...register("has_fixed_price")} className="peer sr-only" />
              <div className="p-4 border border-[var(--line)] peer-checked:border-[var(--action)] peer-checked:bg-[var(--action)]/5 transition">
                <div className="font-display font-bold text-sm uppercase mb-1">A combinar</div>
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
                  className="w-full border border-[var(--line)] p-3 text-sm outline-none transition focus:border-[var(--action)] bg-white"
                />
              </Field>
              <div className="flex items-end">
                <label className="flex items-center gap-3 cursor-pointer pb-2">
                  <input type="checkbox" {...register("is_negotiable")} className="w-4 h-4 accent-[var(--action)]" />
                  <span className="text-sm">Aceito propostas / negociável</span>
                </label>
              </div>
            </div>
          )}
        </section>

        {error && (
          <div className="p-4 bg-red-50 border border-[var(--danger)] text-sm text-[var(--danger)]">{error}</div>
        )}

        <div className="border-t border-[var(--line)] pt-6 flex flex-col md:flex-row gap-3 justify-end">
          <button
            type="submit"
            disabled={busy}
            className="bg-[var(--action)] text-white px-8 py-4 hover:bg-[var(--action-dark)] transition flex items-center justify-center gap-2 font-display font-bold uppercase tracking-wider disabled:opacity-40"
          >
            {busy ? (
              <>Enviando…</>
            ) : isEdit ? (
              <>
                <Sparkle className="w-4 h-4" />
                Salvar e enviar para análise
              </>
            ) : (
              <>
                <Sparkle className="w-4 h-4" />
                Publicar anúncio
              </>
            )}
          </button>
        </div>
      </form>
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
      <label className="text-label-bold text-[var(--text-muted)] block mb-2">{label}</label>
      {children}
      {error && <p className="text-xs text-[var(--danger)] mt-1">{error}</p>}
    </div>
  );
}
