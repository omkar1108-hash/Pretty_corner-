import type { Catalog, Product } from "./types";

// Shown only while Supabase isn't configured, so the site can be previewed.
// Prices are placeholders.
const materials = [
  { id: "m-chenille", name: "Chenille (Pipe Cleaner)" },
  { id: "m-crochet", name: "Crochet (Wool)" },
  { id: "m-beads", name: "Beads, Pearl & Kundan" },
];

const types = [
  { id: "t-clip", name: "Hair Clip" },
  { id: "t-key", name: "Keychain" },
  { id: "t-scrunchie", name: "Scrunchie" },
  { id: "t-charm", name: "Bag Charm" },
  { id: "t-phone", name: "Phone Cover" },
  { id: "t-neck", name: "Necklace" },
  { id: "t-ear", name: "Earrings" },
  { id: "t-flower", name: "Flower" },
  { id: "t-pipe", name: "Pipe Cleaners" },
];

const img = (...n: number[]) => n.map((i) => `/samples/${String(i).padStart(2, "0")}.jpg`);

type Seed = [
  id: string,
  name: string,
  desc: string,
  price: number,
  mat: string,
  type: string,
  size: string,
  color: string,
  images: string[],
  kind?: "product" | "supply",
];

const seeds: Seed[] = [
  ["s1", "Magenta Flower Claw Clip", "Soft chenille flower with a pearl centre and a curling green vine, on a sturdy claw clip.", 149, "m-chenille", "t-clip", "Medium", "Magenta", img(1)],
  ["s2", "Pink Bud Claw Clip", "Two plump pink chenille buds on green stems. Sweet and lightweight.", 149, "m-chenille", "t-clip", "Medium", "Pink", img(3)],
  ["s3", "Triple Flower Claw Clip", "Three magenta blossoms with pearl centres climbing up a claw clip.", 199, "m-chenille", "t-clip", "Medium", "Magenta", img(8, 12)],
  ["s4", "Pastel Lily Hair Flower", "A large blush-pink chenille lily with a pearl heart. Perfect for half-up hairstyles.", 129, "m-chenille", "t-clip", "Large", "Blush pink", img(5)],
  ["s5", "Chenille Rose Keychain", "A little velvety rose with a pearl in the middle. Sold as one keychain.", 99, "m-chenille", "t-key", "Small", "Magenta", img(13, 16)],
  ["s6", "Cherry Blossom Keychain", "Five-petal two-tone chenille flower. Available in pink, orange, purple and more.", 99, "m-chenille", "t-key", "Small", "Pink", img(14, 20)],
  ["s7", "Chenille Hibiscus", "Life-size hibiscus flower made from chenille wire. Lovely for gifting or decor.", 249, "m-chenille", "t-flower", "Large", "Red / White", img(17)],
  ["s8", "Ruffle Crochet Scrunchie, Blue", "Soft wool scrunchie with a two-tone ruffled edge.", 129, "m-crochet", "t-scrunchie", "Free size", "Blue", img(18)],
  ["s9", "Ruffle Crochet Scrunchie, Red & White", "Wool scrunchie with a bright red scalloped edge.", 129, "m-crochet", "t-scrunchie", "Free size", "Red & White", img(11)],
  ["s10", "Peacock Feather Bag Charm", "Hand-crocheted mor pankh with a pearl chain, made to hang on your bag.", 179, "m-crochet", "t-charm", "Small", "Green & Blue", img(10)],
  ["s11", "Crochet Phone Cover with Bow", "Snug crochet phone cover with a big coquette bow. Made to fit your phone model.", 349, "m-crochet", "t-phone", "Custom fit", "Brown & Pink", img(19)],
  ["s12", "Crochet Cigarette Keychain", "Novelty crochet keychain for the cheeky friend.", 89, "m-crochet", "t-key", "Small", "Cream & Brown", img(2)],
  ["s13", "Green Kundan Lotus Earrings", "Gold-tone lotus tops with green kundan stones and long pearl tassels with ghungroo.", 249, "m-beads", "t-ear", "Long", "Gold & Green", img(4)],
  ["s14", "Enamel Lotus Jhumka Earrings", "Red and green enamel lotus with gold bead drops.", 229, "m-beads", "t-ear", "Medium", "Red & Gold", img(15)],
  ["s15", "Red Lotus Pearl Necklace", "Delicate wire choker with a ruby-red lotus and pearl clusters.", 299, "m-beads", "t-neck", "Adjustable", "Red & Pearl", img(6, 9)],
  ["s16", "Kundan Pearl Pendant Necklace", "Wire necklace with freshwater-style pearls and a kundan pendant with pearl drops.", 299, "m-beads", "t-neck", "Adjustable", "White & Gold", img(7)],
  ["s17", "Chenille Pipe Cleaners (pack of 20)", "Assorted colours for your own crafting.", 80, "m-chenille", "t-pipe", "Standard", "Assorted", [], "supply"],
];

export function sampleCatalog(): Catalog {
  const name = (list: { id: string; name: string }[], id: string) =>
    list.find((x) => x.id === id)?.name ?? null;

  const products: Product[] = seeds.map(
    ([id, n, description, price, mat, type, size, color, images, kind], i) => ({
      id,
      name: n,
      description,
      price,
      kind: kind ?? "product",
      material_id: mat,
      type_id: type,
      material: name(materials, mat),
      type: name(types, type),
      size,
      color,
      colors: color.split(",").map((x) => x.trim()).filter((x) => x && x !== "Assorted"),
      images,
      available: true,
      created_at: new Date(Date.now() - i * 86_400_000).toISOString(),
    }),
  );

  return { products, materials, types, demo: true };
}
