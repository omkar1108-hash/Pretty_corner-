export type Kind = "product" | "supply";

export type Category = { id: string; name: string };

export type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  kind: Kind;
  material_id: string | null;
  type_id: string | null;
  material: string | null;
  type: string | null;
  size: string;
  /** display text, e.g. "Pink, Yellow" */
  color: string;
  /** the colours a buyer can pick from when ordering (empty = no choice) */
  colors: string[];
  images: string[];
  available: boolean;
  created_at: string;
};

export type Catalog = {
  products: Product[];
  materials: Category[];
  types: Category[];
  /** true when Supabase isn't configured and sample data is shown */
  demo: boolean;
};

export type EnquiryPayload =
  | {
      kind: "order";
      name: string;
      station: string;
      productId: string;
      color?: string;
    }
  | {
      kind: "custom";
      name: string;
      station: string;
      material: string;
      type: string;
      budget: string;
      description: string;
      images: string[];
    };
