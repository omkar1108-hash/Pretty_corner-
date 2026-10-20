"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getSupabase, supabaseConfigured } from "@/lib/supabase";
import { SHOP_NAME } from "@/lib/config";

const NAV = [
  { href: "/admin", label: "Products" },
  { href: "/admin/categories", label: "Categories" },
  { href: "/admin/enquiries", label: "Enquiries" },
];

/** Wraps every /admin page: shows setup help, enforces login, renders the nav. */
export default function AuthGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const onLogin = pathname === "/admin/login";

  useEffect(() => {
    if (!supabaseConfigured) return;
    const db = getSupabase();
    db.auth.getSession().then(({ data }) => {
      setSignedIn(Boolean(data.session));
      setReady(true);
    });
    const { data: sub } = db.auth.onAuthStateChange((_e, session) => setSignedIn(Boolean(session)));
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (ready && !signedIn && !onLogin) router.replace("/admin/login");
    if (ready && signedIn && onLogin) router.replace("/admin");
  }, [ready, signedIn, onLogin, router]);

  if (!supabaseConfigured) {
    return (
      <div className="mx-auto max-w-xl p-6">
        <h1 className="font-display text-2xl font-bold text-rose">Connect Supabase first</h1>
        <p className="mt-2 text-muted">
          The seller area needs the database. Add <code>NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
          <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> to <code>.env.local</code> and restart. Steps are in the README.
        </p>
        <Link href="/" className="btn btn-ghost mt-4">← Back to shop</Link>
      </div>
    );
  }

  if (!ready || (!signedIn && !onLogin)) return <p className="p-6 text-muted">Loading…</p>;
  if (onLogin) return <>{children}</>;

  return (
    <div className="mx-auto max-w-5xl px-4 pb-16">
      <header className="flex flex-wrap items-center justify-between gap-3 py-4">
        <span className="font-display text-xl font-bold italic text-rose">{SHOP_NAME} · Seller</span>
        <nav className="flex flex-wrap items-center gap-1 text-sm font-semibold">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={`rounded-full px-3 py-1.5 ${pathname === n.href ? "bg-rose text-white" : "hover:bg-blush"}`}
            >
              {n.label}
            </Link>
          ))}
          <Link href="/" className="rounded-full px-3 py-1.5 hover:bg-blush">View shop</Link>
          <button
            className="rounded-full px-3 py-1.5 text-muted hover:bg-blush"
            onClick={() => getSupabase().auth.signOut()}
          >
            Log out
          </button>
        </nav>
      </header>
      {children}
    </div>
  );
}
