"use client";

import Dropdown from "./Dropdown";
import Link from "next/link";
import { useLang, useT } from "./LanguageProvider";
import { LANGS, LANG_LABELS } from "@/lib/i18n";
import { SHOP_NAME } from "@/lib/config";

export default function Header() {
  const t = useT();
  const { lang, setLang } = useLang();

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-cream/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-3 py-3 sm:px-4">
        <Link href="/" className="whitespace-nowrap font-display text-lg font-bold italic text-rose sm:text-2xl">
          {SHOP_NAME}
        </Link>

        <nav className="flex items-center text-sm font-semibold sm:gap-4">
          <Link href="/#shop" className="hidden whitespace-nowrap rounded-full px-2 py-1.5 hover:bg-blush sm:block sm:px-3">
            {t.navShop}
          </Link>
          <Link href="/custom" className="hidden whitespace-nowrap rounded-full px-2 py-1.5 hover:bg-blush sm:block sm:px-3">
            {t.navCustom}
          </Link>
          <Dropdown
            label="Language"
            value={lang}
            onChange={(v) => setLang(v as typeof lang)}
            align="right"
            className="ml-1 !w-auto rounded-full border border-line bg-white py-1.5 pl-3 pr-2.5 text-sm"
          >
            {LANGS.map((l) => (
              <option key={l} value={l}>
                {LANG_LABELS[l]}
              </option>
            ))}
          </Dropdown>
        </nav>
      </div>
    </header>
  );
}
