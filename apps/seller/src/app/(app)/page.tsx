"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getSupabase } from "@/lib/supabase";

type Recent = { id: string; kind: "order" | "custom"; name: string; station: string; created_at: string; details: Record<string, string | number> };

export default function Overview() {
  const [stats, setStats] = useState<{ products: number; paused: number; fresh: number } | null>(null);
  const [recent, setRecent] = useState<Recent[]>([]);

  useEffect(() => {
    const db = getSupabase();
    (async () => {
      const count = (q: PromiseLike<{ count: number | null }>) => q.then((r) => r.count ?? 0);
      const [products, paused, fresh, latest] = await Promise.all([
        count(db.from("products").select("id", { count: "exact", head: true })),
        count(db.from("products").select("id", { count: "exact", head: true }).eq("available", false)),
        count(db.from("enquiries").select("id", { count: "exact", head: true }).eq("status", "new")),
        db.from("enquiries").select("id, kind, name, station, created_at, details").eq("status", "new").order("created_at", { ascending: false }).limit(5),
      ]);
      setStats({ products, paused, fresh });
      setRecent((latest.data as Recent[]) ?? []);
    })();
  }, []);

  const tiles = [
    { label: "New enquiries", value: stats?.fresh, href: "/enquiries", hot: (stats?.fresh ?? 0) > 0 },
    { label: "Products", value: stats?.products, href: "/products" },
    { label: "Paused", value: stats?.paused, href: "/products" },
  ];

  return (
    <>
      <h1 className="text-2xl font-bold">Overview</h1>

      <div className="mt-4 grid grid-cols-3 gap-3">
        {tiles.map((t) => (
          <Link key={t.label} href={t.href} className={`card p-4 hover:border-brand ${t.hot ? "border-brand" : ""}`}>
            <p className="text-3xl font-bold text-brand">{t.value ?? "–"}</p>
            <p className="text-xs text-muted sm:text-sm">{t.label}</p>
          </Link>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <Link href="/products/new" className="btn btn-primary">+ Add product</Link>
        <Link href="/categories" className="btn btn-ghost">Manage categories</Link>
      </div>

      <h2 className="mt-8 text-lg font-bold">Needs a reply</h2>
      {recent.length === 0 ? (
        <p className="card mt-3 p-6 text-center text-muted">All caught up 🎉</p>
      ) : (
        <ul className="card mt-3 divide-y divide-line">
          {recent.map((r) => (
            <li key={r.id} className="flex items-center justify-between gap-3 p-3">
              <div className="min-w-0">
                <p className="truncate font-semibold">
                  <span className={`mr-2 rounded-full px-2 py-0.5 text-xs ${r.kind === "custom" ? "bg-gold text-white" : "bg-tint text-brand"}`}>
                    {r.kind === "custom" ? "Custom" : "Order"}
                  </span>
                  {r.name} · {r.station}
                </p>
                <p className="truncate text-sm text-muted">{String(r.details.product ?? r.details.description ?? "")}</p>
              </div>
              <time className="shrink-0 text-xs text-muted">{new Date(r.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</time>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
