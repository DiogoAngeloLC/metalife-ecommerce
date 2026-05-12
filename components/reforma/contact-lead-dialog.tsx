"use client";

import { useState } from "react";
import { Check, Loader2, Send, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import type { ListingWithImages } from "@/lib/listings";
import { submitLeadAction } from "@/app/lead-actions";

function formatWhatsappInput(v: string): string {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

export function ContactLeadDialog({
  listing,
  open,
  onOpenChange,
}: {
  listing: ListingWithImages;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [step, setStep] = useState<"form" | "sending" | "success">("form");
  const [form, setForm] = useState({ name: "", whatsapp: "", email: "" });
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isValid =
    form.name.length > 2 &&
    form.whatsapp.replace(/\D/g, "").length >= 10 &&
    form.email.includes("@");

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setTimeout(() => {
        setStep("form");
        setForm({ name: "", whatsapp: "", email: "" });
        setErrorMsg(null);
      }, 200);
    }
    onOpenChange(next);
  };

  const handleSubmit = async () => {
    setErrorMsg(null);
    setStep("sending");

    const result = await submitLeadAction({
      listing_id: listing.id,
      name: form.name.trim(),
      whatsapp: form.whatsapp.replace(/\D/g, ""),
      email: form.email.trim().toLowerCase(),
    });

    if (result.success) {
      setStep("success");
    } else {
      setErrorMsg(result.error);
      setStep("form");
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="max-w-md gap-0 overflow-hidden rounded-3xl border-[var(--line)] bg-[var(--bg-card)] p-0 shadow-2xl sm:max-w-md"
      >
        <div className="relative px-6 pb-2 pt-6 md:px-8">
          <button
            type="button"
            onClick={() => handleOpenChange(false)}
            className="absolute right-5 top-5 flex h-9 w-9 items-center justify-center rounded-full transition hover:bg-[var(--bone)]"
            aria-label="Fechar"
          >
            <X className="h-4 w-4" />
          </button>

          {step !== "success" && (
            <>
              <div className="mb-2 text-xs uppercase tracking-[0.25em] text-[var(--terra)]">
                Receba no WhatsApp
              </div>
              <DialogTitle className="font-display text-3xl leading-tight text-[var(--ink)]">
                {listing.title}
              </DialogTitle>
              <p className="mt-2 text-sm text-[var(--ink-soft)]">
                Em segundos você recebe o nome e WhatsApp do vendedor
                diretamente no seu WhatsApp.
              </p>
            </>
          )}
        </div>

        {step === "form" && (
          <div className="space-y-4 px-6 pb-8 pt-6 md:px-8">
            <div>
              <label className="mb-2 block text-xs uppercase tracking-wider text-[var(--text-muted)]">
                Seu nome
              </label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Como você quer ser chamado"
                className="w-full border-0 border-b border-[var(--line)] bg-transparent py-2 text-[15px] outline-none transition focus:border-[var(--terra)]"
              />
            </div>
            <div>
              <label className="mb-2 block text-xs uppercase tracking-wider text-[var(--text-muted)]">
                WhatsApp
              </label>
              <input
                value={form.whatsapp}
                onChange={(e) =>
                  setForm({
                    ...form,
                    whatsapp: formatWhatsappInput(e.target.value),
                  })
                }
                placeholder="(11) 99999-9999"
                className="w-full border-0 border-b border-[var(--line)] bg-transparent py-2 text-[15px] outline-none transition focus:border-[var(--terra)]"
              />
              <div className="mt-1 text-[11px] text-[var(--text-muted)]">
                Validamos se o número existe antes de enviar.
              </div>
            </div>
            <div>
              <label className="mb-2 block text-xs uppercase tracking-wider text-[var(--text-muted)]">
                E-mail
              </label>
              <input
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="voce@email.com"
                type="email"
                className="w-full border-0 border-b border-[var(--line)] bg-transparent py-2 text-[15px] outline-none transition focus:border-[var(--terra)]"
              />
            </div>

            {errorMsg && (
              <p className="text-sm text-red-700">{errorMsg}</p>
            )}

            <button
              type="button"
              onClick={handleSubmit}
              disabled={!isValid}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-[var(--ink)] py-3.5 font-medium text-white transition hover:bg-[var(--terra-dark)] disabled:cursor-not-allowed disabled:opacity-30"
            >
              <Send className="h-4 w-4" />
              Receber no WhatsApp
            </button>

            <p className="pt-2 text-center text-[11px] text-[var(--text-muted)]">
              Ao continuar você concorda em receber uma mensagem do{" "}
              <strong className="text-[var(--ink-soft)]">Classificado Pilates</strong> via
              WhatsApp.
            </p>
          </div>
        )}

        {step === "sending" && (
          <div className="px-8 pb-12 pt-8 text-center">
            <div className="relative mx-auto mb-6 h-16 w-16">
              <div className="absolute inset-0 rounded-full border-2 border-[var(--bone)]" />
              <Loader2 className="absolute inset-0 m-auto h-8 w-8 animate-spin text-[var(--terra)]" />
            </div>
            <div className="font-display mb-2 text-xl">
              Registrando seu interesse…
            </div>
            <p className="text-sm text-[var(--ink-soft)]">
              Isso leva só alguns segundos.
            </p>
          </div>
        )}

        {step === "success" && (
          <div className="px-8 pb-10 pt-2 text-center">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--sage)]">
              <Check className="h-7 w-7 text-white" />
            </div>
            <h2 className="font-display mb-3 text-2xl text-[var(--ink)]">
              Recebido!
            </h2>
            <p className="mb-6 text-sm leading-relaxed text-[var(--ink-soft)]">
              Em instantes você recebe o nome e contato do vendedor de{" "}
              <strong>{listing.title}</strong> no seu WhatsApp.
            </p>
            <button
              type="button"
              onClick={() => handleOpenChange(false)}
              className="text-sm text-[var(--ink-soft)] underline hover:text-[var(--ink)]"
            >
              Continuar navegando
            </button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
