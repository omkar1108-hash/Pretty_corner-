"use client";

import Link from "next/link";
import { useLang, useT } from "./LanguageProvider";
import { LANGS, LANG_LABELS } from "@/lib/i18n";
import { SHOP_NAME } from "@/lib/config";

export default function Header() {
  const t = useT();
  const { lang, setLang } = useLang();

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-cream/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
        <Link href="/" className="whitespace-nowrap font-display text-xl font-bold italic text-rose sm:text-2xl">
          {SHOP_NAME}
        </Link>

        <nav className="flex items-center gap-1 text-sm font-semibold sm:gap-4">
          <Link href="/#shop" className="whitespace-nowrap rounded-full px-2 py-1.5 hover:bg-blush sm:px-3">
            {t.navShop}
          </Link>
          <Link href="/custom" className="whitespace-nowrap rounded-full px-2 py-1.5 hover:bg-blush sm:px-3">
            {t.navCustom}
          </Link>
          <select
            aria-label="Language"
            value={lang}
            onChange={(e) => setLang(e.target.value as typeof lang)}
            className="rounded-full border border-line bg-white px-2 py-1.5 text-sm"
          >
            {LANGS.map((l) => (
              <option key={l} value={l}>
                {LANG_LABELS[l]}
              </option>
            ))}
          </select>
        </nav>
      </div>
    </header>
  );
}
