"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/cart/cart-context";
import { formatCentsBRL } from "@/lib/format";
import { maskCep, maskCpfCnpj, maskPhone, digitsOnly } from "@/lib/documents";
import {
  createOrderAction,
  getShippingRulesAction,
} from "@/app/checkout/actions";
import type { Database, PaymentMethod } from "@/lib/supabase/types";
import { madeToOrderLabel } from "@/lib/official-store";

type ShippingRule = Database["public"]["Tables"]["shipping_rules"]["Row"];

const inputClass =
  "w-full rounded-md border border-[var(--line)] bg-white px-3 py-2.5 text-sm outline-none transition focus:border-primary";

export function CheckoutForm() {
  const router = useRouter();
  const { items, subtotalCents, clearCart } = useCart();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [buyerName, setBuyerName] = useState("");
  const [buyerEmail, setBuyerEmail] = useState("");
  const [buyerPhone, setBuyerPhone] = useState("");
  const [buyerDocument, setBuyerDocument] = useState("");
  const [buyerCompanyName, setBuyerCompanyName] = useState("");
  const [buyerStateRegistration, setBuyerStateRegistration] = useState("");
  const [ieIsento, setIeIsento] = useState(false);

  const [cep, setCep] = useState("");
  const [street, setStreet] = useState("");
  const [number, setNumber] = useState("");
  const [complement, setComplement] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [cepLoading, setCepLoading] = useState(false);
  const [cepError, setCepError] = useState<string | null>(null);

  const [shippingRules, setShippingRules] = useState<ShippingRule[]>([]);
  const [shippingRuleId, setShippingRuleId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("pix");
  const [optIn, setOptIn] = useState(false);

  const [cardHolder, setCardHolder] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");

  const selectedShipping = useMemo(
    () => shippingRules.find((r) => r.id === shippingRuleId) ?? null,
    [shippingRules, shippingRuleId]
  );

  const shippingCents = selectedShipping?.price_cents ?? 0;
  const totalCents = subtotalCents + shippingCents;
  const docDigits = digitsOnly(buyerDocument);
  const isCnpj = docDigits.length === 14;

  useEffect(() => {
    const digits = digitsOnly(cep);
    if (digits.length !== 8) return;

    let cancelled = false;
    (async () => {
      setCepLoading(true);
      setCepError(null);
      try {
        const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
        const data = (await res.json()) as {
          erro?: boolean;
          logradouro?: string;
          bairro?: string;
          localidade?: string;
          uf?: string;
        };
        if (cancelled) return;
        if (data.erro) {
          setCepError("CEP não encontrado");
          return;
        }
        setStreet(data.logradouro ?? "");
        setNeighborhood(data.bairro ?? "");
        setCity(data.localidade ?? "");
        setState((data.uf ?? "").toUpperCase());
      } catch {
        if (!cancelled) setCepError("Falha ao buscar CEP");
      } finally {
        if (!cancelled) setCepLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [cep]);

  useEffect(() => {
    if (state.length !== 2) {
      setShippingRules([]);
      setShippingRuleId("");
      return;
    }

    let cancelled = false;
    (async () => {
      const result = await getShippingRulesAction(state);
      if (cancelled) return;
      if (!result.ok) {
        setShippingRules([]);
        setShippingRuleId("");
        return;
      }
      setShippingRules(result.rules);
      setShippingRuleId(result.rules[0]?.id ?? "");
    })();

    return () => {
      cancelled = true;
    };
  }, [state]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!items.length) {
      setError("Seu carrinho está vazio");
      return;
    }
    if (!optIn) {
      setError("Aceite os Termos e a Política de Privacidade para continuar");
      return;
    }

    startTransition(async () => {
      const result = await createOrderAction({
        buyer_name: buyerName,
        buyer_email: buyerEmail,
        buyer_phone: buyerPhone,
        buyer_document: buyerDocument,
        buyer_company_name: isCnpj ? buyerCompanyName : null,
        buyer_state_registration: isCnpj
          ? ieIsento
            ? "ISENTO"
            : buyerStateRegistration
          : null,
        ie_isento: isCnpj ? ieIsento : false,
        shipping_address: {
          cep,
          street,
          number,
          complement: complement || null,
          neighborhood,
          city,
          state,
        },
        shipping_rule_id: shippingRuleId,
        payment_method: paymentMethod,
        opt_in: optIn,
        items: items.map((i) => ({
          listingId: i.listingId,
          variantId: i.variantId,
          quantity: i.quantity,
        })),
        card_holder: cardHolder,
        card_number: cardNumber,
        card_expiry: cardExpiry,
        card_cvv: cardCvv,
      });

      if (!result.ok) {
        setError(result.error);
        return;
      }

      clearCart();
      const token = encodeURIComponent(result.accessToken);
      router.push(`/checkout/pedido/${result.orderNumber}?token=${token}`);
    });
  };

  if (!items.length) {
    return (
      <div className="rounded-md border border-[var(--line)] bg-white p-10 text-center">
        <p className="text-[var(--text-muted)] mb-4">Seu carrinho está vazio.</p>
        <Link
          href="/catalogo"
          className="inline-flex rounded-md bg-primary px-5 py-3 text-sm font-bold uppercase tracking-wider text-white"
        >
          Ver catálogo
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-12">
      <div className="lg:col-span-7 space-y-6">
        {/* Bloco 1 */}
        <section className="rounded-md border border-[var(--line)] bg-white p-6 space-y-4">
          <h2 className="font-display text-lg font-bold uppercase text-[var(--ink)]">
            1. Dados do comprador
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nome completo" className="sm:col-span-2">
              <input
                required
                className={inputClass}
                value={buyerName}
                onChange={(e) => setBuyerName(e.target.value)}
              />
            </Field>
            <Field label="E-mail">
              <input
                required
                type="email"
                className={inputClass}
                value={buyerEmail}
                onChange={(e) => setBuyerEmail(e.target.value)}
              />
            </Field>
            <Field label="WhatsApp">
              <input
                required
                className={inputClass}
                value={buyerPhone}
                onChange={(e) => setBuyerPhone(maskPhone(e.target.value))}
                placeholder="(11) 99999-9999"
              />
            </Field>
            <Field label="CPF ou CNPJ" className="sm:col-span-2">
              <input
                required
                className={inputClass}
                value={buyerDocument}
                onChange={(e) => setBuyerDocument(maskCpfCnpj(e.target.value))}
                placeholder="000.000.000-00"
              />
            </Field>
            {isCnpj && (
              <>
                <Field label="Razão Social" className="sm:col-span-2">
                  <input
                    required
                    className={inputClass}
                    value={buyerCompanyName}
                    onChange={(e) => setBuyerCompanyName(e.target.value)}
                    placeholder="Empresa Ltda"
                  />
                </Field>
                <Field label="Inscrição Estadual" className="sm:col-span-2">
                  <input
                    required={!ieIsento}
                    disabled={ieIsento}
                    className={`${inputClass} disabled:bg-[var(--bg-section)] disabled:text-[var(--text-muted)]`}
                    value={ieIsento ? "ISENTO" : buyerStateRegistration}
                    onChange={(e) => setBuyerStateRegistration(e.target.value)}
                    placeholder="10.20.30-4"
                  />
                  <label className="mt-2 flex items-center gap-2 text-sm text-[var(--ink-soft)] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={ieIsento}
                      onChange={(e) => {
                        setIeIsento(e.target.checked);
                        if (e.target.checked) setBuyerStateRegistration("");
                      }}
                      className="accent-[var(--brand-primary)]"
                    />
                    Isento de Inscrição Estadual
                  </label>
                </Field>
              </>
            )}
          </div>
        </section>

        {/* Bloco 2 */}
        <section className="rounded-md border border-[var(--line)] bg-white p-6 space-y-4">
          <h2 className="font-display text-lg font-bold uppercase text-[var(--ink)]">
            2. Entrega e frete
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="CEP">
              <input
                required
                className={inputClass}
                value={cep}
                onChange={(e) => setCep(maskCep(e.target.value))}
                placeholder="00000-000"
              />
              {cepLoading && (
                <p className="mt-1 text-xs text-[var(--text-muted)]">Buscando CEP…</p>
              )}
              {cepError && (
                <p className="mt-1 text-xs text-[var(--danger)]">{cepError}</p>
              )}
            </Field>
            <Field label="Número">
              <input
                required
                className={inputClass}
                value={number}
                onChange={(e) => setNumber(e.target.value)}
              />
            </Field>
            <Field label="Logradouro" className="sm:col-span-2">
              <input
                required
                className={inputClass}
                value={street}
                onChange={(e) => setStreet(e.target.value)}
              />
            </Field>
            <Field label="Complemento">
              <input
                className={inputClass}
                value={complement}
                onChange={(e) => setComplement(e.target.value)}
              />
            </Field>
            <Field label="Bairro">
              <input
                required
                className={inputClass}
                value={neighborhood}
                onChange={(e) => setNeighborhood(e.target.value)}
              />
            </Field>
            <Field label="Cidade">
              <input
                required
                className={inputClass}
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
            </Field>
            <Field label="UF">
              <input
                required
                maxLength={2}
                className={inputClass}
                value={state}
                onChange={(e) => setState(e.target.value.toUpperCase().slice(0, 2))}
              />
            </Field>
          </div>

          {shippingRules.length > 0 && (
            <div className="space-y-2 pt-2">
              <div className="text-label-bold text-[var(--text-muted)]">Opções de frete</div>
              {shippingRules.map((rule) => (
                <label
                  key={rule.id}
                  className={`flex cursor-pointer items-start gap-3 rounded-md border p-3 transition ${
                    shippingRuleId === rule.id
                      ? "border-primary bg-primary-100"
                      : "border-[var(--line)] hover:border-primary/40"
                  }`}
                >
                  <input
                    type="radio"
                    name="shipping"
                    className="mt-1 accent-[var(--brand-primary)]"
                    checked={shippingRuleId === rule.id}
                    onChange={() => setShippingRuleId(rule.id)}
                  />
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-[var(--ink)]">{rule.name}</div>
                    <div className="text-xs text-[var(--text-muted)]">
                      {rule.estimated_days != null
                        ? `Prazo estimado: ${rule.estimated_days} dias úteis`
                        : "Sob cotação / retirada"}
                    </div>
                  </div>
                  <div className="text-sm font-bold text-primary">
                    {rule.price_cents === 0 ? "Grátis" : formatCentsBRL(rule.price_cents)}
                  </div>
                </label>
              ))}
            </div>
          )}
        </section>

        {/* Bloco 3 */}
        <section className="rounded-md border border-[var(--line)] bg-white p-6 space-y-4">
          <h2 className="font-display text-lg font-bold uppercase text-[var(--ink)]">
            3. Pagamento & LGPD
          </h2>

          <div className="grid gap-2 sm:grid-cols-3">
            {(
              [
                ["pix", "Pix"],
                ["credit_card", "Cartão"],
                ["boleto", "Boleto"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setPaymentMethod(value)}
                className={`rounded-md border px-3 py-3 text-sm font-bold uppercase tracking-wider transition ${
                  paymentMethod === value
                    ? "border-primary bg-primary text-white"
                    : "border-[var(--line)] text-[var(--ink-soft)] hover:border-primary"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {paymentMethod === "credit_card" && (
            <div className="grid gap-4 sm:grid-cols-2 pt-2">
              <Field label="Nome no cartão" className="sm:col-span-2">
                <input
                  className={inputClass}
                  value={cardHolder}
                  onChange={(e) => setCardHolder(e.target.value)}
                />
              </Field>
              <Field label="Número" className="sm:col-span-2">
                <input
                  className={inputClass}
                  value={cardNumber}
                  onChange={(e) =>
                    setCardNumber(
                      digitsOnly(e.target.value)
                        .slice(0, 16)
                        .replace(/(\d{4})(?=\d)/g, "$1 ")
                        .trim()
                    )
                  }
                  placeholder="0000 0000 0000 0000"
                />
              </Field>
              <Field label="Validade">
                <input
                  className={inputClass}
                  value={cardExpiry}
                  onChange={(e) => {
                    const d = digitsOnly(e.target.value).slice(0, 4);
                    setCardExpiry(
                      d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d
                    );
                  }}
                  placeholder="MM/AA"
                />
              </Field>
              <Field label="CVV">
                <input
                  className={inputClass}
                  value={cardCvv}
                  onChange={(e) => setCardCvv(digitsOnly(e.target.value).slice(0, 4))}
                  placeholder="000"
                />
              </Field>
            </div>
          )}

          <label className="flex items-start gap-3 rounded-md border border-[var(--line)] p-4 cursor-pointer">
            <input
              type="checkbox"
              checked={optIn}
              onChange={(e) => setOptIn(e.target.checked)}
              className="mt-1 accent-[var(--brand-primary)]"
            />
            <span className="text-sm text-[var(--ink-soft)] leading-relaxed">
              Li e concordo com os{" "}
              <Link
                href="/termos-de-uso"
                target="_blank"
                className="text-primary underline"
              >
                Termos de Uso
              </Link>{" "}
              e a{" "}
              <Link
                href="/politica-de-privacidade"
                target="_blank"
                className="text-primary underline"
              >
                Política de Privacidade
              </Link>{" "}
              da Metalife Pilates
            </span>
          </label>
        </section>

        {error && (
          <p className="rounded-md border border-[var(--danger)] bg-[var(--danger-bg)] px-4 py-3 text-sm text-[var(--danger)]">
            {error}
          </p>
        )}
      </div>

      {/* Resumo */}
      <aside className="lg:col-span-5">
        <div className="lg:sticky lg:top-24 rounded-md border border-[var(--line)] bg-white p-6 space-y-4">
          <h2 className="font-display text-lg font-bold uppercase">Resumo do pedido</h2>
          <ul className="space-y-3 max-h-64 overflow-y-auto">
            {items.map((item) => (
              <li key={item.key} className="flex justify-between gap-3 text-sm">
                <div className="min-w-0">
                  <div className="font-medium text-[var(--ink)] line-clamp-2">
                    {item.quantity}× {item.title}
                  </div>
                  {item.variant?.is_made_to_order && (
                    <div className="text-xs text-primary mt-0.5">
                      {madeToOrderLabel(item.variant.production_days)}
                    </div>
                  )}
                </div>
                <div className="shrink-0 font-semibold">
                  {formatCentsBRL(item.unitPriceCents * item.quantity)}
                </div>
              </li>
            ))}
          </ul>
          <div className="border-t border-[var(--line)] pt-3 space-y-2 text-sm">
            <Row label="Subtotal" value={formatCentsBRL(subtotalCents)} />
            <Row
              label="Frete"
              value={
                selectedShipping
                  ? shippingCents === 0
                    ? "Grátis / cotação"
                    : formatCentsBRL(shippingCents)
                  : "—"
              }
            />
            <div className="flex justify-between pt-2 text-base font-bold">
              <span>Total</span>
              <span className="text-primary">{formatCentsBRL(totalCents)}</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={pending || !optIn || !shippingRuleId}
            className="w-full rounded-md bg-primary py-4 font-display text-sm font-bold uppercase tracking-wider text-white transition hover:bg-[var(--action-dark)] disabled:cursor-not-allowed disabled:bg-[var(--disabled)]"
          >
            {pending ? "Processando…" : "Confirmar pedido"}
          </button>
        </div>
      </aside>
    </form>
  );
}

function Field({
  label,
  children,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="text-label-bold text-[var(--text-muted)] block mb-1.5">
        {label}
      </label>
      {children}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-[var(--ink-soft)]">
      <span>{label}</span>
      <span className="font-medium text-[var(--ink)]">{value}</span>
    </div>
  );
}
