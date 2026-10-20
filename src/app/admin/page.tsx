"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { getSupabase } from "@/lib/supabase";
import { formatPrice } from "@/lib/format";
import type { Product } from "@/lib/types";

type Row = Pick<Product, "id" | "name" | "price" | "kind" | "images" | "available"> & {
  material: { name: string } | null;
  type: { name: string } | null;
};

export default function AdminProducts() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const { data, error } = await getSupabase()
      .from("products")
      .select("id, name, price, kind, images, available, material:materials(name), type:product_types(name)")
      .order("created_at", { ascending: false });
    if (error) setError(error.message);
    else setRows(data as unknown as Row[]);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function toggle(r: Row) {
    await getSupabase().from("products").update({ available: !r.available }).eq("id", r.id);
    load();
  }

  async function remove(r: Row) {
    if (!confirm(`Delete "${r.name}"? This cannot be undone.`)) return;
    await getSupabase().from("products").delete().eq("id", r.id);
    load();
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Products</h1>
        <Link href="/admin/products/new" className="btn btn-primary">+ Add product</Link>
      </div>

      {error && <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      {rows === null && !error && <p className="mt-6 text-muted">Loading…</p>}
      {rows?.length === 0 && (
        <p className="mt-6 rounded-2xl border border-dashed border-line bg-white p-8 text-center text-muted">
          No products yet. Add your first one!
        </p>
      )}

      <ul className="mt-4 space-y-3">
        {rows?.map((r) => (
          <li key={r.id} className="flex items-center gap-3 rounded-2xl border border-line bg-white p-3">
            {r.images[0] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={r.images[0]} alt="" className="h-16 w-16 shrink-0 rounded-xl object-cover" />
            ) : (
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-blush text-2xl">🎀</div>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold">{r.name}</p>
              <p className="truncate text-xs text-muted">
                {[r.kind === "supply" ? "Crafting material" : null, r.type?.name, r.material?.name].filter(Boolean).join(" · ")}
              </p>
              <p className="font-bold text-rose">{formatPrice(Number(r.price))}</p>
            </div>
            <div className="flex flex-col items-end gap-1 text-sm sm:flex-row sm:items-center sm:gap-3">
              <button onClick={() => toggle(r)} className={`rounded-full px-3 py-1 text-xs font-semibold ${r.available ? "bg-green-100 text-green-800" : "bg-gray-200 text-gray-600"}`}>
                {r.available ? "Taking orders" : "Paused"}
              </button>
              <Link href={`/admin/products/${r.id}`} className="font-semibold text-rose hover:underline">Edit</Link>
              <button onClick={() => remove(r)} className="text-muted hover:text-red-700">Delete</button>
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
