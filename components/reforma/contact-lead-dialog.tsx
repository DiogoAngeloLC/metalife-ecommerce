"use client";

import { useState } from "react";
import { Check, Loader2, Timer, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import type { ListingWithImages } from "@/lib/listings";
import { submitLeadAction } from "@/app/lead-actions";
import { WhatsappInput } from "@/components/reforma/whatsapp-input";

export function ContactLeadDialog({
  listing,
  open,
  onOpenChange,
  recentLeadsCount,
}: {
  listing: ListingWithImages;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recentLeadsCount?: number;
}) {
  const [step, setStep] = useState<"form" | "sending" | "success">("form");
  const [form, setForm] = useState({ name: "", whatsapp: "", email: "" });
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [whatsappValid, setWhatsappValid] = useState(true);
  const [vendorInfo, setVendorInfo] = useState<{ name: string; phone: string } | null>(null);

  const isValid =
    form.name.length > 2 &&
    form.whatsapp.replace(/\D/g, "").length >= 10 &&
    form.email.includes("@") &&
    whatsappValid;

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setTimeout(() => {
        setStep("form");
        setForm({ name: "", whatsapp: "", email: "" });
        setErrorMsg(null);
        setVendorInfo(null);
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
      if (result.vendor) {
        setVendorInfo({ name: result.vendor.name, phone: result.vendor.whatsapp });
      }
      setStep("success");
    } else {
      setErrorMsg(result.error);
      setStep("form");
    }
  };

  const showUrgent = (recentLeadsCount ?? 0) >= 3;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="max-w-[500px] gap-0 overflow-hidden border border-[var(--line)] bg-white p-0 shadow-2xl sm:max-w-[500px]"
        style={{ borderRadius: 0 }}
      >
        {/* Progress bar */}
        <div className="h-2 w-full bg-[var(--bg-section)] overflow-hidden">
          <div className="h-full bg-[var(--action)] transition-all" style={{ width: step === "success" ? "100%" : "75%" }} />
        </div>

        {step === "form" && (
          <>
            {/* Header */}
            <div className="border-b border-[var(--line)] bg-[var(--bg-section)] p-6 flex justify-between items-start">
              <div>
                <DialogTitle className="font-display text-xl font-bold uppercase text-[var(--ink)]">
                  Ver contato do vendedor
                </DialogTitle>
                <p className="text-label-bold text-[var(--text-muted)] mt-1">
                  Apenas 1 passo restante para garantir esta oferta
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleOpenChange(false)}
                className="text-[var(--text-muted)] hover:text-[var(--action)]"
                aria-label="Fechar"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Form */}
            <div className="p-6 space-y-4">
              {showUrgent && (
                <div className="bg-[var(--action)] text-white p-3 flex items-center gap-2">
                  <Timer className="h-4 w-4" />
                  <span className="text-label-bold">
                    Alta demanda: {recentLeadsCount} pessoas interessadas hoje
                  </span>
                </div>
              )}

              <div>
                <label className="text-label-bold text-[var(--text-muted)] block mb-1">Nome completo</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Seu nome"
                  className="w-full border border-[var(--line)] p-4 text-base outline-none transition focus:border-[var(--action)]"
                />
              </div>

              <div>
                <label className="text-label-bold text-[var(--text-muted)] block mb-1">WhatsApp</label>
                <div className="flex">
                  <span className="inline-flex items-center px-4 border border-r-0 border-[var(--line)] bg-[var(--bg-section)] text-base">
                    +55
                  </span>
                  <WhatsappInput
                    value={form.whatsapp}
                    onChange={(v) => setForm({ ...form, whatsapp: v })}
                    onValidationChange={setWhatsappValid}
                    className="w-full border border-[var(--line)] p-4 text-base outline-none transition focus:border-[var(--action)]"
                  />
                </div>
              </div>

              <div>
                <label className="text-label-bold text-[var(--text-muted)] block mb-1">E-mail</label>
                <input
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="email@exemplo.com"
                  type="email"
                  className="w-full border border-[var(--line)] p-4 text-base outline-none transition focus:border-[var(--action)]"
                />
              </div>

              {errorMsg && <p className="text-sm text-[var(--danger)]">{errorMsg}</p>}

              <button
                type="button"
                onClick={handleSubmit}
                disabled={!isValid}
                className="w-full bg-[var(--action)] py-5 font-display text-lg font-bold uppercase tracking-widest text-white transition hover:bg-[var(--action-dark)] active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Garantir contato
              </button>

              <p className="text-center text-xs text-[var(--text-muted)]">
                Ao clicar em revelar, você concorda com nossos termos de proteção ao comprador.
              </p>
            </div>
          </>
        )}

        {step === "sending" && (
          <div className="px-8 py-16 text-center">
            <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-[var(--action)]" />
            <div className="font-display text-xl font-bold uppercase">Registrando seu interesse…</div>
            <p className="mt-2 text-sm text-[var(--text-muted)]">Isso leva só alguns segundos.</p>
          </div>
        )}

        {step === "success" && (
          <div className="px-8 py-10 text-center space-y-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center bg-[var(--success-bg)] border border-[var(--success)]">
              <Check className="h-8 w-8 text-[var(--success)]" />
            </div>
            <h2 className="font-display text-2xl font-bold uppercase text-[var(--action)]">
              Contato liberado!
            </h2>

            {vendorInfo && (
              <div className="bg-[var(--bg-section)] border border-[var(--line)] p-4 text-left">
                <p className="text-label-bold text-[var(--text-muted)] mb-1">
                  Vendedor: {vendorInfo.name}
                </p>
                <p className="font-display text-2xl font-extrabold text-[var(--trust)]">
                  +55 {vendorInfo.phone}
                </p>
              </div>
            )}

            {vendorInfo && (
              <a
                href={`https://wa.me/55${vendorInfo.phone.replace(/\D/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center justify-center gap-3 bg-[#25D366] py-4 font-display text-base font-bold uppercase tracking-wider text-white transition hover:brightness-90"
              >
                <svg className="h-6 w-6 fill-current" viewBox="0 0 24 24">
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.417-.003 6.557-5.338 11.892-11.893 11.892-1.997-.001-3.951-.5-5.688-1.448l-6.305 1.652zm6.599-3.835c1.516.893 3.135 1.364 4.795 1.365 5.148 0 9.337-4.189 9.34-9.339.001-2.495-.972-4.841-2.739-6.609-1.767-1.769-4.115-2.742-6.611-2.742-5.148 0-9.337 4.189-9.34 9.339-.001 1.893.562 3.736 1.629 5.333l-1.068 3.9 4.004-1.05z" />
                </svg>
                Falar no WhatsApp
              </a>
            )}

            <p className="text-xs text-[var(--text-muted)]">
              Mencione que viu o anúncio no <strong>Classificado Pilates</strong> para condições especiais.
            </p>

            {!vendorInfo && (
              <>
                <p className="text-sm text-[var(--ink-soft)]">
                  Em instantes você recebe o contato do vendedor de{" "}
                  <strong>{listing.title}</strong> no seu WhatsApp.
                </p>
                <button
                  type="button"
                  onClick={() => handleOpenChange(false)}
                  className="text-sm text-[var(--ink-soft)] underline hover:text-[var(--ink)]"
                >
                  Continuar navegando
                </button>
              </>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
