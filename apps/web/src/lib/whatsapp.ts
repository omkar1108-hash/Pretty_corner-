import { SHOP_NAME, SITE_URL, WHATSAPP_NUMBER } from "./config";
import { formatPrice } from "./format";
import type { Product } from "./types";

export const absoluteUrl = (u: string) => (u.startsWith("http") ? u : SITE_URL + u);

export const waLink = (text: string) =>
  `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;

export function orderMessage(p: Product, name: string, station: string) {
  const lines = [
    `Hi ${SHOP_NAME}! 👋 I'd like to order this:`,
    "",
    `*${p.name}*`,
    `Price: ${formatPrice(p.price)}`,
    p.material ? `Material: ${p.material}` : false,
    p.type ? `Type: ${p.type}` : false,
    p.size ? `Size: ${p.size}` : false,
    p.color ? `Colour: ${p.color}` : false,
    `Link: ${SITE_URL}/product/${p.id}`,
    ...p.images.slice(0, 3).map((u, i) => `Photo ${i + 1}: ${absoluteUrl(u)}`),
    "",
    `Name: ${name}`,
    `Pickup station: ${station}`,
  ];
  return lines.filter((l) => l !== false).join("\n");
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
