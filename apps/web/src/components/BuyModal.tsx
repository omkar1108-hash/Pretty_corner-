"use client";

import Dropdown from "./Dropdown";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { Product } from "@/lib/types";
import { STATIONS } from "@/lib/config";
import { formatPrice } from "@/lib/format";
import { useT } from "./LanguageProvider";
import ThanksPanel from "./ThanksPanel";

export default function BuyModal({ product, onClose }: { product: Product; onClose: () => void }) {
  const t = useT();
  const [name, setName] = useState("");
  const [station, setStation] = useState("");
  const [color, setColor] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [waUrl, setWaUrl] = useState("");

  useEffect(() => setError(""), [name, station, color]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return setError(t.nameRequired);
    if (!station) return setError(t.stationRequired);
    if (product.colors.length > 0 && !color) return setError(t.colorRequired);

    setError("");
    setBusy(true);
    try {
      const res = await fetch("/api/enquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: "order", name, station, productId: product.id, color }),
      });
      const data = await res.json();
      if (!res.ok || !data.waUrl) throw new Error(data.error);
      setWaUrl(data.waUrl);
    } catch {
      setError(t.somethingWrong);
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
        className="w-full max-w-md rounded-t-3xl bg-cream p-6 shadow-xl sm:rounded-3xl"
      >
        <h2 className="font-display text-2xl font-bold text-rose">{t.buyTitle}</h2>
        <p className="mt-1 text-sm text-muted">{t.buySub}</p>

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

        <div className="mt-4 space-y-3">
          <div>
            <label className="label" htmlFor="buy-name">{t.yourName}</label>
            <input id="buy-name" className="input" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" maxLength={80} autoFocus />
          </div>
          {product.colors.length > 0 && (
            <div role="radiogroup" aria-label={t.chooseColor}>
              <span className="label">{t.chooseColor}</span>
              <div className="flex flex-wrap gap-2">
                {product.colors.map((c) => (
                  <button
                    key={c}
                    type="button"
                    role="radio"
                    aria-checked={color === c}
                    onClick={() => setColor(c)}
                    className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                      color === c ? "border-rose bg-rose text-white" : "border-line bg-white text-ink hover:bg-blush"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div>
            <label className="label" htmlFor="buy-station">{t.pickupStation}</label>
            <Dropdown id="buy-station" value={station} onChange={setStation}>
              <option value="">{t.chooseStation}</option>
              {STATIONS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </Dropdown>
          </div>
        </div>

        <p className="mt-3 text-xs text-muted">{t.pickupNote}</p>
        {error && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

        <div className="mt-5 flex gap-3">
          <button type="button" className="btn btn-ghost flex-1" onClick={onClose} disabled={busy}>
            {t.cancel}
          </button>
          <button type="submit" className="btn btn-wa flex-1" disabled={busy}>
            {busy ? t.opening : t.next}
          </button>
        </div>
      </form>
      )}
    </div>,
    document.body,
  );
}
