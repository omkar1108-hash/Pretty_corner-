"use client";

import Link from "next/link";
import { useState } from "react";
import type { Product } from "@/lib/types";
import { formatPrice } from "@/lib/format";
import { useT } from "./LanguageProvider";
import BuyModal from "./BuyModal";

export default function ProductCard({ product }: { product: Product }) {
  const t = useT();
  const [buying, setBuying] = useState(false);

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-sm transition hover:shadow-md">
      <Link href={`/product/${product.id}`} className="relative block aspect-square overflow-hidden bg-blush">
        {product.images[0] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.images[0]}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-5xl">🎀</div>
        )}
        {product.kind === "supply" && (
          <span className="absolute left-2 top-2 rounded-full bg-gold px-2.5 py-0.5 text-xs font-semibold text-white">
            {t.supply}
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col gap-1 p-3">
        <Link href={`/product/${product.id}`} className="line-clamp-2 font-semibold leading-snug hover:text-rose">
          {product.name}
        </Link>
        <p className="text-xs text-muted">{[product.type, product.material].filter(Boolean).join(" · ")}</p>
        <div className="mt-auto flex items-center justify-between gap-2 pt-2">
          <span className="text-lg font-bold text-rose">{formatPrice(product.price)}</span>
          <button
            className="btn btn-primary !px-4 !py-1.5 text-sm"
            disabled={!product.available}
            onClick={() => setBuying(true)}
          >
            {t.buyShort}
          </button>
        </div>
      </div>

      {buying && <BuyModal product={product} onClose={() => setBuying(false)} />}
    </article>
  );
}
