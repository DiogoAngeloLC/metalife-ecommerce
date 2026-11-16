"use client";

import Link from "next/link";
import { Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import { useCart } from "@/lib/cart/cart-context";
import { formatCentsBRL } from "@/lib/format";
import { madeToOrderLabel } from "@/lib/official-store";

export function CartDrawer() {
  const {
    items,
    itemCount,
    subtotalCents,
    isOpen,
    closeCart,
    increment,
    decrement,
    removeItem,
  } = useCart();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[80]" role="dialog" aria-modal="true" aria-label="Carrinho">
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        aria-label="Fechar carrinho"
        onClick={closeCart}
      />

      <aside className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-white shadow-2xl anim-scale">
        <div className="flex items-center justify-between border-b border-[var(--line)] px-5 py-4">
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-primary" />
            <h2 className="font-display text-lg font-bold uppercase tracking-tight text-[var(--ink)]">
              Carrinho
            </h2>
            {itemCount > 0 && (
              <span className="rounded-md bg-primary px-2 py-0.5 text-xs font-bold text-white">
                {itemCount}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={closeCart}
            className="rounded-md p-2 text-[var(--text-muted)] hover:bg-[var(--bg-section)] hover:text-[var(--ink)]"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
              <ShoppingBag className="h-10 w-10 text-[var(--line-strong)]" />
              <p className="text-sm text-[var(--text-muted)]">Seu carrinho está vazio.</p>
              <button
                type="button"
                onClick={closeCart}
                className="rounded-md bg-primary px-4 py-2 text-sm font-bold uppercase tracking-wider text-white hover:bg-[var(--action-dark)]"
              >
                Continuar comprando
              </button>
            </div>
          ) : (
            <ul className="space-y-4">
              {items.map((item) => (
                <li
                  key={item.key}
                  className="flex gap-3 border-b border-[var(--line)] pb-4 last:border-0"
                >
                  <div className="h-20 w-20 shrink-0 overflow-hidden rounded-md border border-[var(--line)] bg-[var(--bg-section)]">
                    {item.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.imageUrl}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-xs text-[var(--text-muted)]">
                        Sem foto
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/${item.slug}`}
                      onClick={closeCart}
                      className="line-clamp-2 text-sm font-semibold text-[var(--ink)] hover:text-primary"
                    >
                      {item.title}
                    </Link>
                    {item.variant && (
                      <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                        {[item.variant.structure_color, item.variant.upholstery_color]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    )}
                    {item.variant?.is_made_to_order && (
                      <p className="mt-0.5 text-xs font-medium text-primary">
                        {madeToOrderLabel(item.variant.production_days)}
                      </p>
                    )}
                    <p className="mt-1 text-sm font-bold text-primary">
                      {formatCentsBRL(item.unitPriceCents)}
                    </p>

                    <div className="mt-2 flex items-center justify-between gap-2">
                      <div className="inline-flex items-center rounded-md border border-[var(--line)]">
                        <button
                          type="button"
                          onClick={() => decrement(item.key)}
                          className="p-2 text-[var(--ink-soft)] hover:bg-[var(--bg-section)]"
                          aria-label="Diminuir quantidade"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="min-w-[2rem] text-center text-sm font-bold">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => increment(item.key)}
                          className="p-2 text-[var(--ink-soft)] hover:bg-[var(--bg-section)]"
                          aria-label="Aumentar quantidade"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeItem(item.key)}
                        className="rounded-md p-2 text-[var(--text-muted)] hover:bg-[var(--danger-bg)] hover:text-[var(--danger)]"
                        aria-label="Remover item"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {items.length > 0 && (
          <div className="border-t border-[var(--line)] bg-[var(--bg-section)] px-5 py-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-[var(--ink-soft)]">Subtotal</span>
              <span className="font-display text-xl font-bold text-[var(--ink)]">
                {formatCentsBRL(subtotalCents)}
              </span>
            </div>
            <p className="text-xs text-[var(--text-muted)]">
              Frete e descontos serão calculados no checkout.
            </p>
            <Link
              href="/checkout"
              onClick={closeCart}
              className="flex w-full items-center justify-center rounded-md bg-primary py-3.5 font-display text-sm font-bold uppercase tracking-wider text-white transition hover:bg-[var(--action-dark)]"
            >
              Finalizar Compra
            </Link>
          </div>
        )}
      </aside>
    </div>
  );
}
