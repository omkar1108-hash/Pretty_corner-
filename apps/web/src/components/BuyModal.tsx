"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import type { Product } from "@/lib/types";
import { formatPrice } from "@/lib/format";
import { useT } from "./LanguageProvider";
import { MAX_QTY, useCart } from "./CartProvider";
import Stepper from "./Stepper";

/**
 * Step 1 of ordering: how many of this product, in which colours.
 * A buyer can take the same product in several colours (e.g. 1 pink + 2 violet).
 * "Add to cart" keeps shopping; "Order now" goes straight to the cart.
 */
export default function BuyModal({ product, onClose }: { product: Product; onClose: () => void }) {
  const t = useT();
  const { add, openCart } = useCart();
  const hasColors = product.colors.length > 0;
  // one row per colour (or a single row when the product has no colour choice)
  const rows = hasColors ? product.colors : [""];
  const [qty, setQty] = useState<Record<string, number>>(hasColors ? {} : { "": 1 });
  const [error, setError] = useState("");

  const picked = rows.map((c) => ({ color: c, qty: qty[c] ?? 0 })).filter((r) => r.qty > 0);
  const totalQty = picked.reduce((n, r) => n + r.qty, 0);

  function commit(thenOpenCart: boolean) {
    if (totalQty === 0) return setError(hasColors ? t.colorRequired : t.qtyRequired);
    add(
      picked.map((r) => ({
        productId: product.id,
        name: product.name,
        price: product.price,
        image: product.images[0] ?? "",
        color: r.color,
        qty: r.qty,
      })),
    );
    onClose();
    if (thenOpenCart) openCart();
  }

  return createPortal(
    <div
      data-lenis-prevent
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="max-h-[92svh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-cream p-6 shadow-xl sm:rounded-3xl"
      >
        <h2 className="font-display text-2xl font-bold text-rose">{t.optionsTitle}</h2>
        {hasColors && <p className="mt-1 text-sm text-muted">{t.optionsSub}</p>}

        <div className="mt-4 flex items-center gap-3 rounded-2xl border border-line bg-white p-2">
          {product.images[0] && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={product.images[0]} alt="" className="h-14 w-14 rounded-xl object-cover" />
          )}
          <div className="min-w-0">
            <p className="truncate font-semibold">{product.name}</p>
            <p className="text-sm font-bold text-rose">{formatPrice(product.price)}</p>
          </div>
        </div>

        <ul className="mt-4 space-y-2">
          {rows.map((c) => (
            <li
              key={c || "one"}
              className={`flex items-center justify-between gap-3 rounded-2xl border bg-white px-4 py-2.5 ${
                (qty[c] ?? 0) > 0 ? "border-rose" : "border-line"
              }`}
            >
              <span className="font-semibold">{c || t.quantity}</span>
              <Stepper
                value={qty[c] ?? 0}
                max={MAX_QTY}
                label={c || t.quantity}
                onChange={(n) => {
                  setError("");
                  setQty((cur) => ({ ...cur, [c]: n }));
                }}
              />
            </li>
          ))}
        </ul>

        {totalQty > 0 && (
          <p className="mt-3 text-right text-sm text-muted">
            {totalQty} × {formatPrice(product.price)} = <b className="text-rose">{formatPrice(totalQty * product.price)}</b>
          </p>
        )}
        {error && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

        <div className="mt-5 flex gap-3">
          <button type="button" className="btn btn-ghost flex-1" onClick={() => commit(false)}>
            {t.addToCart}
          </button>
          <button type="button" className="btn btn-wa flex-1" onClick={() => commit(true)}>
            {t.orderNow}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
