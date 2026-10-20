"use client";

import { useT } from "./LanguageProvider";
import { SHOP_NAME } from "@/lib/config";

export default function Footer() {
  const t = useT();
  return (
    <footer data-fx className="mt-16 border-t border-line bg-cream/70 pb-24 pt-8 backdrop-blur md:pb-8 text-center text-sm text-muted">
      <p className="font-display text-lg italic text-rose">{SHOP_NAME}</p>
      <p className="mt-1">{t.footerArea}</p>
      <p>{t.footerPay}</p>
    </footer>
  );
}
