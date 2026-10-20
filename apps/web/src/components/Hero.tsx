"use client";

import Link from "next/link";
import { useT } from "./LanguageProvider";

export default function Hero({ demo }: { demo: boolean }) {
  const t = useT();
  return (
    <>
      {demo && <div className="bg-gold px-4 py-2 text-center text-sm font-medium text-white">{t.demoBanner}</div>}
      <section>
        <div data-fx className="mx-auto max-w-6xl px-4 py-12 text-center sm:py-20">
          <p className="text-sm font-semibold uppercase tracking-widest text-gold">{t.heroPickup}</p>
          <h1 className="mt-3 font-display text-4xl font-bold italic text-rose sm:text-6xl">{t.heroTitle}</h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-muted">{t.heroSub}</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link href="#shop" className="btn btn-primary">{t.heroCta}</Link>
            <Link href="/custom" className="btn btn-ghost">{t.heroCustom}</Link>
          </div>
        </div>
      </section>
    </>
  );
}
