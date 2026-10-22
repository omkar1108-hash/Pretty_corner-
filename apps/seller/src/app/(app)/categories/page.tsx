"use client";

import { useCallback, useEffect, useState } from "react";
import { getSupabase } from "@/lib/supabase";
import type { Category } from "@/lib/types";

type Table = "materials" | "product_types" | "colors";

function CategoryList({ title, table, hint }: { title: string; table: Table; hint: string }) {
  const [items, setItems] = useState<Category[]>([]);
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const { data } = await getSupabase().from(table).select("id, name").order("name");
    setItems(data ?? []);
  }, [table]);
  useEffect(() => { load(); }, [load]);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    const { error } = await getSupabase().from(table).insert({ name: name.trim() });
    setError(error ? (error.code === "23505" ? "That one already exists." : error.message) : "");
    if (!error) setName("");
    load();
  }

  async function rename(c: Category) {
    const next = prompt("Rename to:", c.name)?.trim();
    if (!next || next === c.name) return;
    const { error } = await getSupabase().from(table).update({ name: next }).eq("id", c.id);
    setError(error ? error.message : "");
    load();
  }

  async function remove(c: Category) {
    if (!confirm(`Delete "${c.name}"? Products using it will just show no ${title.toLowerCase()}.`)) return;
    await getSupabase().from(table).delete().eq("id", c.id);
    load();
  }

  return (
    <section className="card p-5">
      <h2 className="text-lg font-bold">{title}</h2>
      <p className="text-sm text-muted">{hint}</p>
      <ul className="mt-3 divide-y divide-line">
        {items.map((c) => (
          <li key={c.id} className="flex items-center justify-between py-2">
            <span>{c.name}</span>
            <span className="flex gap-3 text-sm">
              <button className="font-semibold text-brand hover:underline" onClick={() => rename(c)}>Rename</button>
              <button className="text-muted hover:text-red-700" onClick={() => remove(c)}>Delete</button>
            </span>
          </li>
        ))}
      </ul>
      <form onSubmit={add} className="mt-3 flex gap-2">
        <input className="input" placeholder={`New ${title.toLowerCase()}…`} value={name} onChange={(e) => setName(e.target.value)} maxLength={60} />
        <button className="btn btn-primary">Add</button>
      </form>
      {error && <p className="mt-2 text-sm text-red-700">{error}</p>}
    </section>
  );
}

export default function CategoriesPage() {
  return (
    <>
      <h1 className="text-2xl font-bold">Categories</h1>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <CategoryList title="Materials" table="materials" hint="What it is made of, e.g. Chenille, Crochet, Kundan." />
        <CategoryList title="Product types" table="product_types" hint="What it is, e.g. Hair clip, Keychain, Earrings." />
        <CategoryList title="Colours" table="colors" hint="Colours you work with, e.g. Pink, Red, Violet. You choose which ones each product comes in, and buyers pick one when they order." />
      </div>
    </>
  );
}
