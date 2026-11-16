"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  ImagePlus,
  Save,
  Star,
  Trash2,
} from "lucide-react";
import { getListingImageUrl } from "@/lib/storage";
import { ADMIN_CATEGORIES, slugifyTitle } from "@/lib/admin/catalog";
import {
  createProductAction,
  updateProductAction,
  uploadProductImagesAction,
  setCoverImageAction,
  moveImageAction,
  deleteImageAction,
} from "@/app/admin/anuncios/catalog-actions";
import { AdminVariantsManager } from "@/components/admin/admin-variants-manager";
import type { Database } from "@/lib/supabase/types";

type Listing = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  equipment_type: string;
  brand: string | null;
  status: string;
  price: number | null;
};

type ImageRow = Database["public"]["Tables"]["listing_images"]["Row"];
type Variant = Database["public"]["Tables"]["listing_variants"]["Row"];

const inputClass =
  "w-full rounded-md border border-[var(--line)] bg-white px-3 py-2 text-sm outline-none focus:border-primary";

export function AdminProductEditor({
  mode,
  listing,
  images: initialImages,
  variants,
}: {
  mode: "create" | "edit";
  listing?: Listing;
  images?: ImageRow[];
  variants?: Variant[];
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();
  const [toast, setToast] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [images, setImages] = useState(initialImages ?? []);
  const [slugManual, setSlugManual] = useState(false);

  useEffect(() => {
    setImages(initialImages ?? []);
  }, [initialImages]);

  const [title, setTitle] = useState(listing?.title ?? "");
  const [slug, setSlug] = useState(listing?.slug ?? "");
  const [equipmentType, setEquipmentType] = useState(
    listing?.equipment_type ?? "reformer"
  );
  const [description, setDescription] = useState(listing?.description ?? "");
  const [status, setStatus] = useState<"active" | "draft">(
    listing?.status === "active" ? "active" : "draft"
  );
  const [priceReais, setPriceReais] = useState(
    listing?.price != null ? String(listing.price).replace(".", ",") : ""
  );
  const [brand, setBrand] = useState(listing?.brand ?? "Metalife");
  const [dragOver, setDragOver] = useState(false);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  };

  const onTitleChange = (value: string) => {
    setTitle(value);
    if (!slugManual && mode === "create") {
      setSlug(slugifyTitle(value));
    }
  };

  const parsePrice = (): number | null => {
    const raw = priceReais.replace(/\./g, "").replace(",", ".").trim();
    if (!raw) return null;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  };

  const saveMain = () => {
    setError(null);
    const payload = {
      title,
      slug,
      equipment_type: equipmentType,
      description,
      status,
      price_reais: parsePrice(),
      brand,
    };

    startTransition(async () => {
      if (mode === "create") {
        const r = await createProductAction(payload);
        if (!r.ok) {
          setError(r.error);
          return;
        }
        showToast("Produto criado.");
        router.push(`/admin/anuncios/${r.id}`);
        router.refresh();
        return;
      }
      if (!listing) return;
      const r = await updateProductAction(listing.id, payload);
      if (!r.ok) {
        setError(r.error);
        return;
      }
      showToast("Informações salvas.");
      router.refresh();
    });
  };

  const uploadFiles = (files: FileList | File[]) => {
    if (!listing || mode !== "edit") return;
    const list = Array.from(files);
    if (list.length === 0) return;
    const fd = new FormData();
    for (const f of list) fd.append("files", f);
    startTransition(async () => {
      const r = await uploadProductImagesAction(listing.id, fd);
      if (!r.ok) {
        setError(r.error);
        return;
      }
      showToast(`${r.paths.length} imagem(ns) enviada(s).`);
      router.refresh();
    });
  };

  return (
    <div className="mx-auto max-w-5xl p-6 md:p-8">
      <div className="mb-6">
        <Link
          href="/admin/anuncios"
          className="text-label-bold text-[var(--text-muted)] hover:text-[var(--ink)]"
        >
          ← Catálogo
        </Link>
        <h1 className="mt-2 font-display text-3xl font-bold uppercase text-[var(--ink)]">
          {mode === "create" ? "Novo Produto" : listing?.title}
        </h1>
        {mode === "edit" && listing && (
          <p className="mt-1 text-sm text-[var(--ink-soft)]">
            <Link href={`/${listing.slug}`} className="text-primary underline" target="_blank">
              Ver na loja
            </Link>
          </p>
        )}
      </div>

      {toast && (
        <div className="mb-4 rounded-md border border-green-200 bg-green-50 px-4 py-2 text-sm text-green-800">
          {toast}
        </div>
      )}
      {error && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Bloco A */}
      <section className="mb-8 rounded-md border border-[var(--line)] bg-white p-6">
        <div className="mb-4">
          <div className="text-label-bold text-[var(--text-muted)] mb-1">BLOCO A</div>
          <h2 className="font-display text-xl font-bold uppercase">Informações Principais</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="text-label-bold mb-1 block text-[var(--text-muted)]">
              Nome do equipamento
            </label>
            <input
              className={inputClass}
              value={title}
              onChange={(e) => onTitleChange(e.target.value)}
              placeholder="Ex: Reformer Classic"
            />
          </div>
          <div>
            <label className="text-label-bold mb-1 block text-[var(--text-muted)]">
              Slug URL
            </label>
            <div className="flex gap-2">
              <input
                className={inputClass}
                value={slug}
                onChange={(e) => {
                  setSlugManual(true);
                  setSlug(slugifyTitle(e.target.value) || e.target.value);
                }}
              />
              <button
                type="button"
                className="whitespace-nowrap border border-[var(--line)] px-3 text-[10px] font-bold uppercase"
                onClick={() => {
                  setSlug(slugifyTitle(title));
                  setSlugManual(true);
                }}
              >
                Gerar
              </button>
            </div>
          </div>
          <div>
            <label className="text-label-bold mb-1 block text-[var(--text-muted)]">
              Categoria
            </label>
            <select
              className={inputClass}
              value={equipmentType}
              onChange={(e) => setEquipmentType(e.target.value)}
            >
              {ADMIN_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-label-bold mb-1 block text-[var(--text-muted)]">
              Status
            </label>
            <select
              className={inputClass}
              value={status}
              onChange={(e) => setStatus(e.target.value as "active" | "draft")}
            >
              <option value="draft">Rascunho</option>
              <option value="active">Ativo</option>
            </select>
          </div>
          <div>
            <label className="text-label-bold mb-1 block text-[var(--text-muted)]">
              Preço base (R$)
            </label>
            <input
              className={inputClass}
              value={priceReais}
              onChange={(e) => setPriceReais(e.target.value)}
              placeholder="0,00"
            />
            <p className="mt-1 text-xs text-[var(--text-muted)]">
              Atualizado automaticamente pelo menor preço das variantes ativas.
            </p>
          </div>
          <div>
            <label className="text-label-bold mb-1 block text-[var(--text-muted)]">
              Marca
            </label>
            <input
              className={inputClass}
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
            />
          </div>
          <div className="sm:col-span-2">
            <label className="text-label-bold mb-1 block text-[var(--text-muted)]">
              Descrição detalhada
            </label>
            <textarea
              className={`${inputClass} min-h-[140px]`}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>
        <div className="mt-4">
          <button
            type="button"
            disabled={pending}
            onClick={saveMain}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {mode === "create" ? "Criar produto" : "Salvar informações"}
          </button>
        </div>
      </section>

      {mode === "edit" && listing && (
        <>
          {/* Bloco B */}
          <section className="mb-8 rounded-md border border-[var(--line)] bg-white p-6">
            <div className="mb-4">
              <div className="text-label-bold text-[var(--text-muted)] mb-1">BLOCO B</div>
              <h2 className="font-display text-xl font-bold uppercase">Galeria de Imagens</h2>
            </div>

            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                uploadFiles(e.dataTransfer.files);
              }}
              className={`mb-4 flex flex-col items-center justify-center gap-2 border-2 border-dashed px-4 py-10 ${
                dragOver
                  ? "border-primary bg-primary/5"
                  : "border-[var(--line)] bg-[var(--bg-section)]"
              }`}
            >
              <ImagePlus className="h-8 w-8 text-[var(--text-muted)]" />
              <p className="text-sm text-[var(--ink-soft)]">
                Arraste imagens .jpg / .png / .webp ou
              </p>
              <input
                ref={fileRef}
                type="file"
                accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                multiple
                className="hidden"
                onChange={(e) => {
                  if (e.target.files) uploadFiles(e.target.files);
                  e.target.value = "";
                }}
              />
              <button
                type="button"
                disabled={pending}
                onClick={() => fileRef.current?.click()}
                className="rounded-md border border-[var(--line)] bg-white px-4 py-2 text-xs font-bold uppercase"
              >
                Selecionar arquivos
              </button>
            </div>

            {images.length === 0 ? (
              <p className="text-sm text-[var(--text-muted)]">Nenhuma imagem cadastrada.</p>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                {[...images]
                  .sort((a, b) => a.position - b.position)
                  .map((img, idx) => (
                    <div
                      key={img.id}
                      className="group relative overflow-hidden border border-[var(--line)] bg-[var(--bg-section)]"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={getListingImageUrl(img.storage_path)}
                        alt=""
                        className="aspect-square w-full object-cover"
                      />
                      {idx === 0 && (
                        <span className="absolute left-2 top-2 rounded bg-primary px-2 py-0.5 text-[9px] font-bold uppercase text-white">
                          Capa
                        </span>
                      )}
                      <div className="absolute inset-x-0 bottom-0 flex flex-wrap gap-1 bg-black/70 p-2 opacity-0 transition group-hover:opacity-100">
                        <button
                          type="button"
                          disabled={pending || idx === 0}
                          title="Definir como capa"
                          className="rounded bg-white/20 p-1 text-white hover:bg-white/40 disabled:opacity-40"
                          onClick={() => {
                            startTransition(async () => {
                              const r = await setCoverImageAction(listing.id, img.id);
                              if (!r.ok) {
                                setError(r.error);
                                return;
                              }
                              setImages((prev) => {
                                const cover = prev.find((i) => i.id === img.id)!;
                                const rest = prev.filter((i) => i.id !== img.id);
                                return [cover, ...rest].map((i, pos) => ({
                                  ...i,
                                  position: pos,
                                }));
                              });
                              showToast("Capa atualizada.");
                              router.refresh();
                            });
                          }}
                        >
                          <Star className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={pending}
                          title="Mover esquerda"
                          className="rounded bg-white/20 p-1 text-white hover:bg-white/40"
                          onClick={() => {
                            startTransition(async () => {
                              const r = await moveImageAction(listing.id, img.id, "left");
                              if (!r.ok) {
                                setError(r.error);
                                return;
                              }
                              router.refresh();
                            });
                          }}
                        >
                          <ArrowLeft className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={pending}
                          title="Mover direita"
                          className="rounded bg-white/20 p-1 text-white hover:bg-white/40"
                          onClick={() => {
                            startTransition(async () => {
                              const r = await moveImageAction(listing.id, img.id, "right");
                              if (!r.ok) {
                                setError(r.error);
                                return;
                              }
                              router.refresh();
                            });
                          }}
                        >
                          <ArrowRight className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={pending}
                          title="Excluir"
                          className="rounded bg-red-500/80 p-1 text-white hover:bg-red-600"
                          onClick={() => {
                            if (!confirm("Excluir esta imagem?")) return;
                            startTransition(async () => {
                              const r = await deleteImageAction(listing.id, img.id);
                              if (!r.ok) {
                                setError(r.error);
                                return;
                              }
                              setImages((prev) => prev.filter((i) => i.id !== img.id));
                              showToast("Imagem excluída.");
                              router.refresh();
                            });
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </section>

          {/* Bloco C */}
          <section className="rounded-md border border-[var(--line)] bg-white p-6">
            <div className="mb-4">
              <div className="text-label-bold text-[var(--text-muted)] mb-1">BLOCO C</div>
              <h2 className="font-display text-xl font-bold uppercase">
                Variantes STR / STF / Protheus
              </h2>
              <p className="mt-1 text-sm text-[var(--text-muted)]">
                O preço base do produto sincroniza com o menor preço das variantes ativas.
              </p>
            </div>
            <AdminVariantsManager
              listingId={listing.id}
              initialVariants={variants ?? []}
            />
          </section>
        </>
      )}
    </div>
  );
}
