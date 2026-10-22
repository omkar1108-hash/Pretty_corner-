"use client";

import Dropdown from "./Dropdown";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { STATIONS } from "@/lib/config";
import { formatPrice } from "@/lib/format";
import { useT } from "./LanguageProvider";
import { MAX_QTY, useCart } from "./CartProvider";
import Stepper from "./Stepper";
import ThanksPanel from "./ThanksPanel";

/** The cart: review items, then name + pickup station and send everything as one order. */
export default function CartModal({ onClose }: { onClose: () => void }) {
  const t = useT();
  const { lines, total, setQty, remove, clear } = useCart();
  const [name, setName] = useState("");
  const [station, setStation] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [waUrl, setWaUrl] = useState("");

  useEffect(() => setError(""), [name, station]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (lines.length === 0) return;
    if (!name.trim()) return setError(t.nameRequired);
    if (!station) return setError(t.stationRequired);

    setError("");
    setBusy(true);
    try {
      const res = await fetch("/api/enquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "order",
          name,
          station,
          items: lines.map((l) => ({ productId: l.productId, color: l.color, qty: l.qty })),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.waUrl) throw new Error(data.error);
      setWaUrl(data.waUrl);
      clear();
    } catch (err) {
      setError((err as Error).message || t.somethingWrong);
      setBusy(false);
    }
  }

  return createPortal(
    <div
      data-lenis-prevent
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4"
      onClick={onClose}
    >
      {waUrl ? (
        <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-t-3xl bg-cream p-6 shadow-xl sm:rounded-3xl">
          <ThanksPanel waUrl={waUrl} />
        </div>
      ) : (
        <form
          onSubmit={submit}
          onClick={(e) => e.stopPropagation()}
          className="flex max-h-[92svh] w-full max-w-md flex-col rounded-t-3xl bg-cream shadow-xl sm:rounded-3xl"
        >
          <div className="flex items-start justify-between gap-3 px-6 pt-6">
            <h2 className="font-display text-2xl font-bold text-rose">{t.yourOrder}</h2>
            <button type="button" onClick={onClose} aria-label={t.cancel} className="-mr-2 -mt-1 h-9 w-9 rounded-full text-2xl leading-none text-muted hover:bg-blush">
              ×
            </button>
          </div>

          {lines.length === 0 ? (
            <div className="px-6 py-10 text-center">
              <p className="text-muted">{t.cartEmpty}</p>
              <button type="button" className="btn btn-primary mt-4" onClick={onClose}>
                {t.continueShopping}
              </button>
            </div>
          ) : (
            <>
              <div className="mt-3 flex-1 space-y-3 overflow-y-auto px-6 pb-2">
                <ul className="space-y-2">
                  {lines.map((l) => (
                    <li key={l.key} className="flex items-center gap-3 rounded-2xl border border-line bg-white p-2">
                      {l.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={l.image} alt="" className="h-14 w-14 shrink-0 rounded-xl object-cover" />
                      ) : (
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-blush text-2xl">🎀</div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold">{l.name}</p>
                        {l.color && <p className="truncate text-xs text-muted">{t.color}: {l.color}</p>}
                        <p className="text-sm font-bold text-rose">{formatPrice(l.price * l.qty)}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <Stepper value={l.qty} min={1} max={MAX_QTY} label={l.name} onChange={(n) => setQty(l.key, n)} />
                        <button type="button" className="text-xs text-muted underline hover:text-rose" onClick={() => remove(l.key)}>
                          {t.remove}
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>

                <div className="flex items-center justify-between rounded-2xl bg-blush px-4 py-2.5">
                  <span className="font-semibold">{t.total}</span>
                  <span className="text-lg font-bold text-rose">{formatPrice(total)}</span>
                </div>

                <div>
                  <label className="label" htmlFor="cart-name">{t.yourName}</label>
                  <input id="cart-name" className="input" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" maxLength={80} />
                </div>
                <div>
                  <label className="label" htmlFor="cart-station">{t.pickupStation}</label>
                  <Dropdown id="cart-station" value={station} onChange={setStation}>
                    <option value="">{t.chooseStation}</option>
                    {STATIONS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </Dropdown>
                </div>
                <p className="text-xs text-muted">{t.pickupNote}</p>
                {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
              </div>

              <div className="flex gap-3 border-t border-line px-6 py-4">
                <button type="button" className="btn btn-ghost flex-1" onClick={onClose} disabled={busy}>
                  {t.continueShopping}
                </button>
                <button type="submit" className="btn btn-wa flex-1" disabled={busy}>
                  {busy ? t.opening : t.sendOrder}
                </button>
              </div>
            </>
          )}
        </form>
      )}
    </div>,
    document.body,
  );
}
