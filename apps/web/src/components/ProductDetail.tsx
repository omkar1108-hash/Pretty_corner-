"use client";

import Link from "next/link";
import { useState } from "react";
import type { Product } from "@/lib/types";
import { formatPrice } from "@/lib/format";
import { useT } from "./LanguageProvider";
import BuyModal from "./BuyModal";

export default function ProductDetail({ product }: { product: Product }) {
  const t = useT();
  const [active, setActive] = useState(0);
  const [buying, setBuying] = useState(false);
  const [copied, setCopied] = useState(false);

  const facts: [string, string | null][] = [
    [t.material, product.material],
    [t.type, product.type],
    [t.size, product.size],
    [t.color, product.color],
  ];

  async function share() {
    const url = window.location.href;
    if (navigator.share) {
      try { await navigator.share({ title: product.name, url }); return; } catch { /* cancelled */ }
    }
    await navigator.clipboard?.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <Link href="/#shop" className="text-sm font-semibold text-rose hover:underline">← {t.backToShop}</Link>

      <div className="mt-4 grid gap-8 md:grid-cols-2">
        <div data-fx>
          <div className="aspect-square overflow-hidden rounded-3xl border border-line bg-blush">
            {product.images[active] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={product.images[active]} alt={product.name} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-7xl">🎀</div>
            )}
          </div>
          {product.images.length > 1 && (
            <div className="mt-3 flex gap-2 overflow-x-auto">
              {product.images.map((src, i) => (
                <button
                  key={src}
                  onClick={() => setActive(i)}
                  className={`h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 ${i === active ? "border-rose" : "border-transparent"}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div data-fx>
          {product.kind === "supply" && (
            <span className="rounded-full bg-gold px-3 py-1 text-xs font-semibold text-white">{t.supply}</span>
          )}
          <h1 className="mt-2 font-display text-3xl font-bold">{product.name}</h1>
          <p className="mt-2 text-3xl font-bold text-rose">{formatPrice(product.price)}</p>
          <p className="mt-1 text-sm font-medium text-gold">✦ {t.madeToOrder}</p>

          <dl className="mt-5 grid grid-cols-2 gap-3">
            {facts.filter(([, v]) => v).map(([k, v]) => (
              <div key={k} className="rounded-xl border border-line bg-white px-3 py-2">
                <dt className="text-xs text-muted">{k}</dt>
                <dd className="font-semibold">{v}</dd>
              </div>
            ))}
          </dl>

          {product.description && (
            <div className="mt-5">
              <h2 className="text-sm font-semibold text-muted">{t.description}</h2>
              <p className="mt-1 whitespace-pre-line">{product.description}</p>
            </div>
          )}

          <div className="mt-6 flex flex-wrap gap-3">
            <button className="btn btn-wa flex-1 sm:flex-none" disabled={!product.available} onClick={() => setBuying(true)}>
              {t.buy}
            </button>
            <button className="btn btn-ghost" onClick={share}>{copied ? t.copied : t.share}</button>
          </div>
          {!product.available && <p className="mt-2 text-sm text-red-700">{t.notAvailable}</p>}

          <div className="mt-8 rounded-2xl bg-blush p-4">
            <p className="font-semibold">{t.similarCustom}</p>
            <Link href="/custom" className="mt-1 inline-block text-sm font-semibold text-rose underline">
              {t.requestCustom}
            </Link>
          </div>
        </div>
      </div>

      {buying && <BuyModal product={product} onClose={() => setBuying(false)} />}
    </div>
  );
}
