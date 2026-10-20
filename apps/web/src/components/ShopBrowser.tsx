"use client";

import Dropdown from "./Dropdown";
import { useMemo, useState } from "react";
import type { Catalog, Kind } from "@/lib/types";
import { useT } from "./LanguageProvider";
import ProductCard from "./ProductCard";

type Sort = "new" | "low" | "high";

function Select({ label, all, value, onChange, children }: { label: string; all: string; value: string; onChange: (v: string) => void; children: React.ReactNode }) {
  return (
    <div>
      <label className="label">{label}</label>
      <Dropdown value={value} onChange={onChange}>
        <option value="">{all}</option>
        {children}
      </Dropdown>
    </div>
  );
}

const uniq = (xs: string[]) => [...new Set(xs.map((x) => x.trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b));

export default function ShopBrowser({ catalog }: { catalog: Catalog }) {
  const t = useT();
  const { products, materials, types } = catalog;

  const [q, setQ] = useState("");
  const [kind, setKind] = useState<Kind | "all">("all");
  const [material, setMaterial] = useState("");
  const [type, setType] = useState("");
  const [size, setSize] = useState("");
  const [color, setColor] = useState("");
  const [min, setMin] = useState("");
  const [max, setMax] = useState("");
  const [sort, setSort] = useState<Sort>("new");
  const [open, setOpen] = useState(false);

  const sizes = useMemo(() => uniq(products.map((p) => p.size)), [products]);
  const colors = useMemo(() => uniq(products.map((p) => p.color)), [products]);

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const lo = min === "" ? -Infinity : Number(min);
    const hi = max === "" ? Infinity : Number(max);

    const list = products.filter((p) => {
      if (kind !== "all" && p.kind !== kind) return false;
      if (material && p.material_id !== material) return false;
      if (type && p.type_id !== type) return false;
      if (size && p.size !== size) return false;
      if (color && p.color !== color) return false;
      if (p.price < lo || p.price > hi) return false;
      if (needle) {
        const hay = [p.name, p.description, p.material, p.type, p.color, p.size].join(" ").toLowerCase();
        if (!hay.includes(needle)) return false;
      }
      return true;
    });

    if (sort === "low") list.sort((a, b) => a.price - b.price);
    else if (sort === "high") list.sort((a, b) => b.price - a.price);
    return list;
  }, [products, q, kind, material, type, size, color, min, max, sort]);

  const active = [kind !== "all", material, type, size, color, min, max].filter(Boolean).length;

  const clear = () => {
    setKind("all"); setMaterial(""); setType(""); setSize(""); setColor(""); setMin(""); setMax("");
  };

  const searchInput = (
    <input className="input" type="search" placeholder={t.search} value={q} onChange={(e) => setQ(e.target.value)} />
  );
  const sortRow = (
    <div className="flex items-center justify-between gap-3">
      <p className="rounded-full border border-line bg-white px-3 py-1.5 text-sm text-muted">
        {shown.length} {t.results}
      </p>
      <label className="flex items-center gap-2 text-sm">
        <span className="rounded-full border border-line bg-white px-3 py-1.5 text-muted">{t.sortBy}</span>
        <Dropdown className="input !w-auto !py-1.5" align="right" value={sort} onChange={(v) => setSort(v as Sort)}>
          <option value="new">{t.sortNew}</option>
          <option value="low">{t.sortLow}</option>
          <option value="high">{t.sortHigh}</option>
        </Dropdown>
      </label>
    </div>
  );

  return (
    <div className="grid gap-x-6 gap-y-4 md:grid-cols-[230px_1fr] md:items-start">
      {/* PHONE: one bar (search + Filters button + count/sort) pinned under the header. */}
      <div className="sticky top-[var(--header-h)] z-20 -mx-4 space-y-3 px-4 py-3 md:hidden">
        <div className="flex gap-2">
          {searchInput}
          <button
            type="button"
            className="btn btn-ghost whitespace-nowrap"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
          >
            {t.filters}{active > 0 && ` (${active})`}
          </button>
        </div>
        {sortRow}
      </div>

      {/* DESKTOP: the left column (search + filters) is pinned while the products scroll. */}
      <aside
        className={`${open ? "" : "hidden"} md:sticky md:top-[calc(var(--header-h)+1rem)] md:block md:max-h-[calc(100vh-var(--header-h)-2rem)] md:overflow-y-auto md:p-1`}
      >
        <div className="mb-4 hidden md:block">{searchInput}</div>
        <div className={`${open ? "block" : "hidden"} space-y-3 rounded-2xl border border-line bg-white p-4 md:block`}>
          <div>
            <label className="label">{t.show}</label>
            <Dropdown value={kind} onChange={(v) => setKind(v as Kind | "all")}>
              <option value="all">{t.kindAll}</option>
              <option value="product">{t.kindProduct}</option>
              <option value="supply">{t.kindSupply}</option>
            </Dropdown>
          </div>

          <Select all={t.all} label={t.material} value={material} onChange={setMaterial}>
            {materials.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
          </Select>
          <Select all={t.all} label={t.type} value={type} onChange={setType}>
            {types.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
          </Select>
          <Select all={t.all} label={t.size} value={size} onChange={setSize}>
            {sizes.map((s) => <option key={s}>{s}</option>)}
          </Select>
          <Select all={t.all} label={t.color} value={color} onChange={setColor}>
            {colors.map((s) => <option key={s}>{s}</option>)}
          </Select>

          <div>
            <label className="label">{t.price} (₹)</label>
            <div className="flex gap-2">
              <input className="input" inputMode="numeric" placeholder={t.minPrice} value={min} onChange={(e) => setMin(e.target.value.replace(/\D/g, ""))} />
              <input className="input" inputMode="numeric" placeholder={t.maxPrice} value={max} onChange={(e) => setMax(e.target.value.replace(/\D/g, ""))} />
            </div>
          </div>

          {active > 0 && (
            <button type="button" className="w-full text-sm font-semibold text-rose underline" onClick={clear}>
              {t.clear}
            </button>
          )}
        </div>
      </aside>

      {/* ---- results ---- */}
      <section>
        <div className="sticky top-[calc(var(--header-h)+1rem)] z-20 mb-4 hidden md:block">{sortRow}</div>
        {shown.length === 0 ? (
          <div data-fx className="rounded-2xl border border-dashed border-line bg-white p-10 text-center">
            <p className="font-semibold">{t.noResults}</p>
            <p className="mt-1 text-sm text-muted">{t.noResultsHint}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
            {shown.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        )}
      </section>
    </div>
  );
}
