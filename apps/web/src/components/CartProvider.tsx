"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { CartLine } from "@/lib/types";
import { useT } from "./LanguageProvider";
import CartModal from "./CartModal";

export const MAX_QTY = 20;
const STORAGE_KEY = "pc-cart-v1";

type Ctx = {
  lines: CartLine[];
  count: number;
  total: number;
  add: (items: Omit<CartLine, "key">[]) => void;
  setQty: (key: string, qty: number) => void;
  remove: (key: string) => void;
  clear: () => void;
  openCart: () => void;
};

const CartContext = createContext<Ctx | null>(null);

const lineKey = (productId: string, color: string) => `${productId}|${color}`;

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}

/**
 * Holds the buyer's cart (remembered in this browser), the cart window and the small
 * "added to cart" message. Prices here are only for display: the server re-reads them.
 */
export default function CartProvider({ children }: { children: React.ReactNode }) {
  const t = useT();
  const [lines, setLines] = useState<CartLine[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      if (Array.isArray(saved)) setLines(saved.filter((l) => l && l.productId && l.qty > 0));
    } catch {
      /* ignore a broken saved cart */
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
    } catch {
      /* private mode etc. */
    }
  }, [lines, loaded]);

  const add = useCallback((items: Omit<CartLine, "key">[]) => {
    setLines((cur) => {
      const next = [...cur];
      for (const it of items) {
        const key = lineKey(it.productId, it.color);
        const i = next.findIndex((l) => l.key === key);
        if (i >= 0) next[i] = { ...next[i], qty: Math.min(MAX_QTY, next[i].qty + it.qty) };
        else next.push({ ...it, key, qty: Math.min(MAX_QTY, it.qty) });
      }
      return next;
    });
    setToast(true);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(false), 3500);
  }, []);

  const setQty = useCallback((key: string, qty: number) => {
    setLines((cur) =>
      qty <= 0 ? cur.filter((l) => l.key !== key) : cur.map((l) => (l.key === key ? { ...l, qty: Math.min(MAX_QTY, qty) } : l)),
    );
  }, []);
  const remove = useCallback((key: string) => setLines((cur) => cur.filter((l) => l.key !== key)), []);
  const clear = useCallback(() => setLines([]), []);
  const openCart = useCallback(() => {
    setToast(false);
    setOpen(true);
  }, []);

  const value = useMemo<Ctx>(
    () => ({
      lines,
      count: lines.reduce((n, l) => n + l.qty, 0),
      total: lines.reduce((n, l) => n + l.qty * l.price, 0),
      add,
      setQty,
      remove,
      clear,
      openCart,
    }),
    [lines, add, setQty, remove, clear, openCart],
  );

  return (
    <CartContext.Provider value={value}>
      {children}
      {open && <CartModal onClose={() => setOpen(false)} />}
      {toast && !open && (
        <div
          role="status"
          className="fixed inset-x-0 bottom-24 z-[60] mx-auto flex w-fit max-w-[90vw] items-center gap-3 rounded-full border border-gold/40 bg-white px-4 py-2.5 text-sm font-semibold shadow-xl md:bottom-8"
        >
          <span>✓ {t.addedToCart}</span>
          <button className="text-rose underline" onClick={openCart}>
            {t.viewCart}
          </button>
        </div>
      )}
    </CartContext.Provider>
  );
}
