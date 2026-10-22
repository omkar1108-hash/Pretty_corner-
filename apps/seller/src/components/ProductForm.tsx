"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { getSupabase } from "@/lib/supabase";
import { uploadProductImage } from "@/lib/image";
import { SIZE_SUGGESTIONS } from "@/lib/config";
import type { Category, Kind } from "@/lib/types";

const NEW = "__new__";

/** Looks up a category by name (case-insensitive) or creates it. Returns its id. */
async function resolveCategory(table: "materials" | "product_types", choice: string, newName: string) {
  if (choice !== NEW) return choice || null;
  const name = newName.trim();
  if (!name) return null;
  const db = getSupabase();
  const existing = await db.from(table).select("id").ilike("name", name).maybeSingle();
  if (existing.data) return existing.data.id as string;
  const created = await db.from(table).insert({ name }).select("id").single();
  if (created.error) throw created.error;
  return created.data.id as string;
}

/** Finds a colour by name (case-insensitive) or creates it. Returns its id. */
async function resolveColor(rawName: string) {
  const name = rawName.trim();
  const db = getSupabase();
  const existing = await db.from("colors").select("id").ilike("name", name).maybeSingle();
  if (existing.data) return existing.data.id as string;
  const created = await db.from("colors").insert({ name }).select("id").single();
  if (created.error) throw created.error;
  return created.data.id as string;
}

export default function ProductForm({ productId }: { productId?: string }) {
  const router = useRouter();
  const fileInput = useRef<HTMLInputElement>(null);

  const [materials, setMaterials] = useState<Category[]>([]);
  const [types, setTypes] = useState<Category[]>([]);
  const [colors, setColors] = useState<Category[]>([]);
  const [colorIds, setColorIds] = useState<string[]>([]);
  const [newColors, setNewColors] = useState<string[]>([]); // typed here, saved with the product
  const [colorDraft, setColorDraft] = useState("");
  const [loading, setLoading] = useState(Boolean(productId));

  const [kind, setKind] = useState<Kind>("product");
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [material, setMaterial] = useState("");
  const [newMaterial, setNewMaterial] = useState("");
  const [type, setType] = useState("");
  const [newType, setNewType] = useState("");
  const [size, setSize] = useState("");
  const [description, setDescription] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [available, setAvailable] = useState(true);

  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const db = getSupabase();
    (async () => {
      const [m, t, c] = await Promise.all([
        db.from("materials").select("id, name").order("name"),
        db.from("product_types").select("id, name").order("name"),
        db.from("colors").select("id, name").order("name"),
      ]);
      setMaterials(m.data ?? []);
      setTypes(t.data ?? []);
      setColors(c.data ?? []);

      if (productId) {
        const { data } = await db.from("products").select("*").eq("id", productId).single();
        if (data) {
          setKind(data.kind);
          setName(data.name);
          setPrice(String(data.price));
          setMaterial(data.material_id ?? "");
          setType(data.type_id ?? "");
          setSize(data.size);
          // products saved before colours became a list only have a text like "Pink, Yellow"
          const saved: string[] = data.color_ids ?? [];
          if (saved.length) setColorIds(saved);
          else {
            const legacy = String(data.color ?? "").split(",").map((x: string) => x.trim().toLowerCase()).filter(Boolean);
            setColorIds((c.data ?? []).filter((x) => legacy.includes(x.name.toLowerCase())).map((x) => x.id));
          }
          setDescription(data.description);
          setImages(data.images);
          setAvailable(data.available);
        }
        setLoading(false);
      }
    })();
  }, [productId]);

  async function addFiles(list: FileList | null) {
    if (!list?.length) return;
    setUploading(true);
    setError("");
    try {
      const urls = await Promise.all(Array.from(list).map((f) => uploadProductImage(f)));
      setImages((cur) => [...cur, ...urls]);
    } catch (e) {
      setError("Could not upload picture: " + (e as Error).message);
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  }

  function addDraftColor() {
    const n = colorDraft.trim();
    if (!n) return;
    const existing = colors.find((c) => c.name.toLowerCase() === n.toLowerCase());
    if (existing) setColorIds((cur) => (cur.includes(existing.id) ? cur : [...cur, existing.id]));
    else if (!newColors.some((x) => x.toLowerCase() === n.toLowerCase())) setNewColors((cur) => [...cur, n]);
    setColorDraft("");
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return setError("Please enter a product name.");
    const amount = Number(price);
    if (price === "" || Number.isNaN(amount) || amount < 0) return setError("Please enter a valid price.");

    setSaving(true);
    setError("");
    try {
      const ids = [...colorIds];
      const names = colors.filter((c) => ids.includes(c.id)).map((c) => c.name);
      // a colour typed but not yet "Add"-ed still counts
      const pending = [...newColors];
      const draft = colorDraft.trim();
      if (draft && !pending.some((x) => x.toLowerCase() === draft.toLowerCase())) pending.push(draft);
      for (const n of pending) {
        const id = await resolveColor(n);
        if (!ids.includes(id)) { ids.push(id); names.push(n); }
      }
      const chosenNames = names.join(", ");
      const row = {
        kind,
        name: name.trim(),
        price: amount,
        description: description.trim(),
        size: size.trim(),
        color: chosenNames,
        color_ids: ids,
        images,
        available,
        material_id: await resolveCategory("materials", material, newMaterial),
        type_id: await resolveCategory("product_types", type, newType),
      };
      const db = getSupabase();
      const { error } = productId
        ? await db.from("products").update(row).eq("id", productId)
        : await db.from("products").insert(row);
      if (error) throw error;
      router.push("/products");
    } catch (e) {
      setError("Could not save: " + (e as Error).message);
      setSaving(false);
    }
  }

  if (loading) return <p className="text-muted">Loading…</p>;

  return (
    <form onSubmit={save} className="mx-auto max-w-2xl space-y-5 card p-5 sm:p-6">
      <h1 className="text-2xl font-bold">{productId ? "Edit product" : "Add product"}</h1>

      <fieldset>
        <legend className="label">What are you adding?</legend>
        <div className="flex flex-wrap gap-2">
          {([["product", "Finished product"], ["supply", "Crafting material"]] as const).map(([v, label]) => (
            <label key={v} className={`cursor-pointer rounded-full border px-4 py-2 text-sm font-semibold ${kind === v ? "border-brand bg-tint text-brand" : "border-line"}`}>
              <input type="radio" className="sr-only" name="kind" checked={kind === v} onChange={() => setKind(v)} />
              {label}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-[1fr_140px]">
        <div>
          <label className="label" htmlFor="p-name">Name</label>
          <input id="p-name" className="input" value={name} onChange={(e) => setName(e.target.value)} maxLength={120} />
        </div>
        <div>
          <label className="label" htmlFor="p-price">Price (₹)</label>
          <input id="p-price" className="input" inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value.replace(/[^\d.]/g, ""))} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="p-material">1. Material</label>
          <select id="p-material" className="input" value={material} onChange={(e) => setMaterial(e.target.value)}>
            <option value="">Select…</option>
            {materials.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
            <option value={NEW}>+ Add new material…</option>
          </select>
          {material === NEW && (
            <input className="input mt-2" placeholder="New material name" value={newMaterial} onChange={(e) => setNewMaterial(e.target.value)} maxLength={60} autoFocus />
          )}
        </div>
        <div>
          <label className="label" htmlFor="p-type">2. Product type</label>
          <select id="p-type" className="input" value={type} onChange={(e) => setType(e.target.value)}>
            <option value="">Select…</option>
            {types.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
            <option value={NEW}>+ Add new type…</option>
          </select>
          {type === NEW && (
            <input className="input mt-2" placeholder="New type name" value={newType} onChange={(e) => setNewType(e.target.value)} maxLength={60} autoFocus />
          )}
        </div>
      </div>

      <div>
        <div>
          <label className="label" htmlFor="p-size">Size</label>
          <input id="p-size" className="input" list="sizes" value={size} onChange={(e) => setSize(e.target.value)} maxLength={40} />
          <datalist id="sizes">{SIZE_SUGGESTIONS.map((s) => <option key={s} value={s} />)}</datalist>
        </div>
      </div>


      <div>
        <span className="label">Colours this comes in</span>
        <p className="mb-2 text-xs text-muted">Buyers pick one of these when they order. Add colours once in Categories, then tick them here.</p>
        <div className="flex flex-wrap gap-2">
          {colors.map((c) => {
            const on = colorIds.includes(c.id);
            return (
              <button
                key={c.id}
                type="button"
                aria-pressed={on}
                onClick={() => setColorIds((cur) => (on ? cur.filter((x) => x !== c.id) : [...cur, c.id]))}
                className={`rounded-full border px-4 py-2 text-sm font-semibold ${on ? "border-brand bg-tint text-brand" : "border-line"}`}
              >
                {on && "✓ "}{c.name}
              </button>
            );
          })}
          {newColors.map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setNewColors((cur) => cur.filter((x) => x !== n))}
              className="rounded-full border border-brand bg-tint px-4 py-2 text-sm font-semibold text-brand"
              title="Tap to remove"
            >
              ✓ {n} ×
            </button>
          ))}
        </div>
        <div className="mt-2 flex gap-2">
          <input
            className="input"
            placeholder="+ Add a new colour…"
            value={colorDraft}
            maxLength={40}
            onChange={(e) => setColorDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") { e.preventDefault(); addDraftColor(); }
            }}
          />
          <button type="button" className="btn btn-ghost" onClick={addDraftColor}>Add</button>
        </div>
      </div>

      <div>
        <label className="label" htmlFor="p-desc">Description</label>
        <textarea id="p-desc" className="input min-h-24" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={1500} />
      </div>

      <div>
        <span className="label">Pictures (first one is the cover)</span>
        <div className="flex flex-wrap gap-3">
          {images.map((src, i) => (
            <div key={src} className="relative h-24 w-24">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" className={`h-full w-full rounded-xl object-cover ${i === 0 ? "ring-2 ring-brand" : ""}`} />
              <div className="absolute inset-x-0 bottom-0 flex justify-between rounded-b-xl bg-black/50 px-1 text-xs text-white">
                {i > 0 ? <button type="button" onClick={() => setImages((a) => { const b = [...a]; [b[i - 1], b[i]] = [b[i], b[i - 1]]; return b; })} aria-label="Move earlier">◀</button> : <span />}
                {i < images.length - 1 ? <button type="button" onClick={() => setImages((a) => { const b = [...a]; [b[i + 1], b[i]] = [b[i], b[i + 1]]; return b; })} aria-label="Move later">▶</button> : <span />}
              </div>
              <button type="button" aria-label="Remove picture" onClick={() => setImages((a) => a.filter((_, j) => j !== i))} className="absolute -right-2 -top-2 h-6 w-6 rounded-full bg-brand text-sm font-bold leading-6 text-white">×</button>
            </div>
          ))}
          <button type="button" disabled={uploading} onClick={() => fileInput.current?.click()} className="flex h-24 w-24 flex-col items-center justify-center rounded-xl border-2 border-dashed border-line text-sm font-semibold text-brand hover:bg-tint">
            {uploading ? "Uploading…" : (<><span className="text-2xl leading-none">+</span>Add</>)}
          </button>
        </div>
        <input ref={fileInput} type="file" accept="image/*" multiple hidden onChange={(e) => addFiles(e.target.files)} />
      </div>

      <label className="flex items-center gap-2 text-sm font-semibold">
        <input type="checkbox" checked={available} onChange={(e) => setAvailable(e.target.checked)} className="h-4 w-4 accent-[var(--color-brand)]" />
        Taking orders for this item
      </label>

      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <div className="flex gap-3">
        <button type="button" className="btn btn-ghost" onClick={() => router.push("/products")} disabled={saving}>Cancel</button>
        <button className="btn btn-primary flex-1" disabled={saving || uploading}>{saving ? "Saving…" : "Save product"}</button>
      </div>
    </form>
  );
}
