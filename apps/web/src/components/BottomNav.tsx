"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useT } from "./LanguageProvider";

const icons = {
  home: "M3 11.5 12 4l9 7.5M5.5 10v9.5h13V10",
  shop: "M5 8h14l-1 12H6L5 8Zm4 0V6a3 3 0 0 1 6 0v2",
  custom: "M12 3l2.2 5.6L20 9.3l-4.3 3.9L17 19l-5-3-5 3 1.3-5.8L4 9.3l5.8-.7L12 3Z",
};

/** Phone-only tab bar: frosted glass with a gold edge. */
export default function BottomNav() {
  const t = useT();
  const path = usePathname();

  const items = [
    { href: "/", label: t.navHome, icon: icons.home, active: path === "/" },
    { href: "/#shop", label: t.navShop, icon: icons.shop, active: path.startsWith("/product") },
    { href: "/custom", label: t.navCustom, icon: icons.custom, active: path === "/custom" },
  ];

  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-3 border-t border-gold/40 bg-cream/75 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_24px_rgba(184,137,59,0.15)] backdrop-blur-xl md:hidden"
    >
      {items.map((it) => (
        <Link
          key={it.label}
          href={it.href}
          className={`flex flex-col items-center gap-1 py-2.5 text-[11px] font-semibold transition-colors ${it.active ? "text-rose" : "text-muted"}`}
        >
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
            <path d={it.icon} />
          </svg>
          <span className="whitespace-nowrap">{it.label}</span>
          <span className={`h-0.5 w-6 rounded-full transition-all ${it.active ? "bg-gold" : "bg-transparent"}`} />
        </Link>
      ))}
    </nav>
  );
}
