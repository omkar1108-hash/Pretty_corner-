"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getSupabase, supabaseConfigured } from "@/lib/supabase";
import { SHOP_NAME, SHOP_URL } from "@/lib/config";

const NAV = [
  { href: "/", label: "Overview", icon: "◎" },
  { href: "/products", label: "Products", icon: "▦" },
  { href: "/categories", label: "Categories", icon: "☰" },
  { href: "/enquiries", label: "Enquiries", icon: "✉" },
];

const isActive = (path: string, href: string) => (href === "/" ? path === "/" : path.startsWith(href));

/** Login guard + dashboard chrome: sidebar on desktop, bottom tab bar on phones. */
export default function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [state, setState] = useState<"loading" | "in" | "out">("loading");

  useEffect(() => {
    if (!supabaseConfigured) return setState("out");
    const db = getSupabase();
    db.auth.getSession().then(({ data }) => setState(data.session ? "in" : "out"));
    const { data: sub } = db.auth.onAuthStateChange((_e, s) => setState(s ? "in" : "out"));
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (state === "out") router.replace("/login");
  }, [state, router]);

  if (state !== "in") return <p className="p-6 text-muted">Loading…</p>;

  const nav = (cls: string, item: (typeof NAV)[number]) => (
    <Link key={item.href} href={item.href} className={cls}>
      <span aria-hidden className="text-lg leading-none">{item.icon}</span>
      <span>{item.label}</span>
    </Link>
  );

  return (
    <div className="min-h-dvh md:grid md:grid-cols-[230px_1fr]">
      {/* desktop sidebar */}
      <aside className="sticky top-0 hidden h-dvh flex-col bg-plum p-4 text-white md:flex">
        <div className="mb-6 px-2">
          <p className="text-lg font-bold">{SHOP_NAME}</p>
          <p className="text-xs uppercase tracking-widest text-gold">Studio</p>
        </div>
        <nav className="flex flex-col gap-1">
          {NAV.map((n) =>
            nav(
              `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold ${isActive(pathname, n.href) ? "bg-brand text-white" : "text-white/70 hover:bg-white/10"}`,
              n,
            ),
          )}
        </nav>
        <div className="mt-auto space-y-1 text-sm">
          <a href={SHOP_URL} target="_blank" rel="noreferrer" className="block rounded-lg px-3 py-2 text-white/70 hover:bg-white/10">Open shop ↗</a>
          <button onClick={() => getSupabase().auth.signOut()} className="block w-full rounded-lg px-3 py-2 text-left text-white/70 hover:bg-white/10">Sign out</button>
        </div>
      </aside>

      {/* phone top bar */}
      <header className="sticky top-0 z-20 flex items-center justify-between bg-plum px-4 py-3 text-white md:hidden">
        <span className="font-bold">{SHOP_NAME} <span className="text-xs uppercase tracking-widest text-gold">Studio</span></span>
        <button onClick={() => getSupabase().auth.signOut()} className="text-sm text-white/70">Sign out</button>
      </header>

      <main className="mx-auto w-full max-w-4xl px-4 pb-28 pt-5 md:px-8 md:pb-10 md:pt-8">{children}</main>

      {/* phone bottom tabs */}
      <nav className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-4 border-t border-line bg-white md:hidden">
        {NAV.map((n) =>
          nav(
            `flex flex-col items-center gap-0.5 py-2 text-[11px] font-semibold ${isActive(pathname, n.href) ? "text-brand" : "text-muted"}`,
            n,
          ),
        )}
      </nav>
    </div>
  );
}
