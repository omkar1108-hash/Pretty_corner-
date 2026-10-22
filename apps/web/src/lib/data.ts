import { cache } from "react";
import { getSupabase, supabaseConfigured } from "./supabase";
import { sampleCatalog } from "./sample-data";
import type { Catalog, Product } from "./types";

type Row = Omit<Product, "material" | "type" | "price" | "colors"> & {
  color_ids?: string[] | null;
  price: number | string;
  material: { name: string } | null;
  type: { name: string } | null;
};

const SELECT = "*, material:materials(name), type:product_types(name)";

export const splitColors = (text: string) =>
  text.split(",").map((x) => x.trim()).filter(Boolean);

/** Colour names come from the seller's colour list; older products only have text like "Pink, Yellow". */
const toProduct = (r: Row, colorNames: Map<string, string>): Product => {
  const fromList = (r.color_ids ?? []).map((id) => colorNames.get(id)).filter((n): n is string => Boolean(n));
  const colors = fromList.length ? fromList : splitColors(r.color ?? "");
  return {
    ...r,
    price: Number(r.price),
    material: r.material?.name ?? null,
    type: r.type?.name ?? null,
    colors,
    color: colors.join(", "),
  };
};

export const getCatalog = cache(async (): Promise<Catalog> => {
  if (!supabaseConfigured) return sampleCatalog();

  const db = getSupabase();
  const [products, materials, types, colors] = await Promise.all([
    db.from("products").select(SELECT).order("created_at", { ascending: false }),
    db.from("materials").select("id, name").order("name"),
    db.from("product_types").select("id, name").order("name"),
    db.from("colors").select("id, name"),
  ]);

  if (products.error) throw products.error;
  return {
    products: (products.data as unknown as Row[]).map((r) =>
      toProduct(r, new Map((colors.data ?? []).map((c) => [c.id, c.name]))),
    ),
    materials: materials.data ?? [],
    types: types.data ?? [],
    demo: false,
  };
});

export async function getProduct(id: string): Promise<Product | null> {
  if (!supabaseConfigured) return sampleCatalog().products.find((p) => p.id === id) ?? null;

  const db = getSupabase();
  const [{ data }, colors] = await Promise.all([
    db.from("products").select(SELECT).eq("id", id).maybeSingle(),
    db.from("colors").select("id, name"),
  ]);
  return data
    ? toProduct(data as unknown as Row, new Map((colors.data ?? []).map((c) => [c.id, c.name])))
    : null;
}
