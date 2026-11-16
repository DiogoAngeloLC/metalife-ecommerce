"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  cartItemKey,
  type AddToCartInput,
  type CartItem,
  type CartState,
} from "./types";

const STORAGE_KEY = "metalife-cart-v2";

type AddResult = { ok: true };

type CartContextValue = {
  items: CartItem[];
  itemCount: number;
  subtotalCents: number;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  addItem: (input: AddToCartInput) => AddResult;
  setQuantity: (key: string, quantity: number) => void;
  increment: (key: string) => void;
  decrement: (key: string) => void;
  removeItem: (key: string) => void;
  clearCart: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

function loadCart(): CartState {
  if (typeof window === "undefined") return { items: [] };
  try {
    const raw =
      localStorage.getItem(STORAGE_KEY) ??
      localStorage.getItem("metalife-cart-v1");
    if (!raw) return { items: [] };
    const parsed = JSON.parse(raw) as CartState & { vendorId?: string | null };
    if (!Array.isArray(parsed.items)) return { items: [] };
    return {
      items: parsed.items.filter((i) => i && i.listingId && i.quantity > 0),
    };
  } catch {
    return { items: [] };
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setItems(loadCart().items);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ items } satisfies CartState));
  }, [items, hydrated]);

  const openCart = useCallback(() => setIsOpen(true), []);
  const closeCart = useCallback(() => setIsOpen(false), []);
  const toggleCart = useCallback(() => setIsOpen((v) => !v), []);

  const addItem = useCallback((input: AddToCartInput): AddResult => {
    const qty = Math.max(1, input.quantity ?? 1);
    const key = cartItemKey(input.listingId, input.variantId);

    setItems((prev) => {
      const existing = prev.find((i) => i.key === key);
      if (existing) {
        return prev.map((i) =>
          i.key === key ? { ...i, quantity: i.quantity + qty } : i
        );
      }
      const next: CartItem = {
        key,
        listingId: input.listingId,
        variantId: input.variantId ?? null,
        vendorId: input.vendorId,
        vendorName: input.vendorName ?? null,
        title: input.title,
        imageUrl: input.imageUrl ?? null,
        unitPriceCents: input.unitPriceCents,
        quantity: qty,
        slug: input.slug,
        variant: input.variant ?? null,
      };
      return [...prev, next];
    });
    setIsOpen(true);
    return { ok: true };
  }, []);

  const setQuantity = useCallback((key: string, quantity: number) => {
    setItems((prev) => {
      if (quantity <= 0) return prev.filter((i) => i.key !== key);
      return prev.map((i) => (i.key === key ? { ...i, quantity } : i));
    });
  }, []);

  const increment = useCallback((key: string) => {
    setItems((prev) =>
      prev.map((i) => (i.key === key ? { ...i, quantity: i.quantity + 1 } : i))
    );
  }, []);

  const decrement = useCallback((key: string) => {
    setItems((prev) =>
      prev
        .map((i) => (i.key === key ? { ...i, quantity: i.quantity - 1 } : i))
        .filter((i) => i.quantity > 0)
    );
  }, []);

  const removeItem = useCallback((key: string) => {
    setItems((prev) => prev.filter((i) => i.key !== key));
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const itemCount = useMemo(
    () => items.reduce((sum, i) => sum + i.quantity, 0),
    [items]
  );

  const subtotalCents = useMemo(
    () => items.reduce((sum, i) => sum + i.unitPriceCents * i.quantity, 0),
    [items]
  );

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      itemCount,
      subtotalCents,
      isOpen,
      openCart,
      closeCart,
      toggleCart,
      addItem,
      setQuantity,
      increment,
      decrement,
      removeItem,
      clearCart,
    }),
    [
      items,
      itemCount,
      subtotalCents,
      isOpen,
      openCart,
      closeCart,
      toggleCart,
      addItem,
      setQuantity,
      increment,
      decrement,
      removeItem,
      clearCart,
    ]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error("useCart deve ser usado dentro de <CartProvider>");
  }
  return ctx;
}
