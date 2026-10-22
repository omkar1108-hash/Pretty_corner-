import { SHOP_NAME, SITE_URL, WHATSAPP_NUMBER } from "./config";
import { formatPrice } from "./format";
import type { Product } from "./types";

export const absoluteUrl = (u: string) => (u.startsWith("http") ? u : SITE_URL + u);

export const waLink = (text: string) =>
  `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;

export type OrderLine = { product: Product; color: string; qty: number };

export function orderMessage(lines: OrderLine[], total: number, name: string, station: string) {
  const showPhotos = lines.length <= 5; // keeps the message short for big orders
  const out = [`Hi ${SHOP_NAME}! 👋 I'd like to order:`, ""];
  lines.forEach((l, i) => {
    const p = l.product;
    out.push(
      `${i + 1}. *${p.name}*${l.color ? ` (${l.color})` : ""}`,
      `   ${l.qty} × ${formatPrice(p.price)} = ${formatPrice(l.qty * p.price)}`,
      `   Link: ${SITE_URL}/product/${p.id}`,
    );
    if (showPhotos && p.images[0]) out.push(`   Photo: ${absoluteUrl(p.images[0])}`);
  });
  out.push("", `*Total: ${formatPrice(total)}*`, "", `Name: ${name}`, `Pickup station: ${station}`);
  return out.join("\n");
}

export function customMessage(c: {
  name: string;
  station: string;
  material: string;
  type: string;
  budget: string;
  description: string;
  images: string[];
}) {
  const lines = [
    `Hi ${SHOP_NAME}! 👋 I'd like a *custom order*:`,
    "",
    c.material ? `Material: ${c.material}` : false,
    c.type ? `Type: ${c.type}` : false,
    c.budget ? `Approx. budget: ₹${c.budget}` : false,
    `Details: ${c.description}`,
    ...c.images.map((u, i) => `Picture ${i + 1}: ${u}`),
    "",
    `Name: ${c.name}`,
    `Pickup station: ${c.station}`,
  ];
  return lines.filter((l) => l !== false).join("\n");
}
