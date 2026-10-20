import { getSupabase, supabaseConfigured } from "./supabase";
import { sampleCatalog } from "./sample-data";
import type { Catalog, Product } from "./types";

type Row = Omit<Product, "material" | "type" | "price"> & {
  price: number | string;
  material: { name: string } | null;
  type: { name: string } | null;
};

const SELECT = "*, material:materials(name), type:product_types(name)";

const toProduct = (r: Row): Product => ({
  ...r,
  price: Number(r.price),
  material: r.material?.name ?? null,
  type: r.type?.name ?? null,
});

export async function getCatalog(): Promise<Catalog> {
  if (!supabaseConfigured) return sampleCatalog();

  const db = getSupabase();
  const [products, materials, types] = await Promise.all([
    db.from("products").select(SELECT).order("created_at", { ascending: false }),
    db.from("materials").select("id, name").order("name"),
    db.from("product_types").select("id, name").order("name"),
  ]);

  if (products.error) throw products.error;
  return {
    products: (products.data as unknown as Row[]).map(toProduct),
    materials: materials.data ?? [],
    types: types.data ?? [],
    demo: false,
  };
}

export async function getProduct(id: string): Promise<Product | null> {
  if (!supabaseConfigured) return sampleCatalog().products.find((p) => p.id === id) ?? null;

  const { data } = await getSupabase().from("products").select(SELECT).eq("id", id).maybeSingle();
  return data ? toProduct(data as unknown as Row) : null;
}
