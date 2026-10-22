"use client";

import { useCart } from "./CartProvider";
import { useT } from "./LanguageProvider";

/** Bag icon with a count badge, shown in the header. */
export default function CartButton() {
  const t = useT();
  const { count, openCart } = useCart();

  return (
    <button
      type="button"
      onClick={openCart}
      aria-label={`${t.cart}${count ? ` (${count})` : ""}`}
      className="relative ml-1 flex h-9 w-9 items-center justify-center rounded-full border border-line bg-white text-rose transition hover:bg-blush"
    >
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M5 8h14l-1 12H6L5 8Zm4 0V6a3 3 0 0 1 6 0v2" />
      </svg>
      {count > 0 && (
        <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose px-1 text-[11px] font-bold text-white">
          {count}
        </span>
      )}
    </button>
  );
}
