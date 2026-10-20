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
  color: string;
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
