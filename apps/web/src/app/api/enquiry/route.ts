import { NextResponse } from "next/server";
import { Resend } from "resend";
import { getProduct } from "@/lib/data";
import { getSupabase, supabaseConfigured } from "@/lib/supabase";
import { MAX_CUSTOM_IMAGES, STATIONS, WHATSAPP_NUMBER } from "@/lib/config";
import { formatPrice } from "@/lib/format";
import { absoluteUrl, customMessage, orderMessage, waLink, type OrderLine } from "@/lib/whatsapp";

const MAX_ORDER_LINES = 20;
const MAX_QTY_PER_LINE = 20;

export const dynamic = "force-dynamic";

const clean = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const isSupabaseUrl = (u: string) => {
  try {
    const url = new URL(u);
    return url.protocol === "https:" && url.hostname.endsWith(".supabase.co");
  } catch {
    return false;
  }
};

async function sendEmail(subject: string, html: string, images: string[]) {
  const key = process.env.RESEND_API_KEY;
  const to = process.env.SELLER_EMAIL;
  if (!key || !to) {
    console.warn("[enquiry] RESEND_API_KEY / SELLER_EMAIL not set, skipping email");
    return false;
  }
  try {
    const { error } = await new Resend(key).emails.send({
      from: process.env.EMAIL_FROM || "Pretty Corner <onboarding@resend.dev>",
      to,
      subject,
      html,
      attachments: images.map((path, i) => ({ path, filename: `picture-${i + 1}.jpg` })),
    });
    if (error) throw new Error(error.message);
    return true;
  } catch (e) {
    console.error("[enquiry] email failed", e);
    return false;
  }
}

async function save(row: Record<string, unknown>) {
  if (!supabaseConfigured) return false;
  const { error } = await getSupabase().from("enquiries").insert(row);
  if (error) console.error("[enquiry] save failed", error.message);
  return !error;
}

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const name = clean(body.name, 80);
  const station = clean(body.station, 40);
  if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });
  if (!(STATIONS as readonly string[]).includes(station))
    return NextResponse.json({ error: "Invalid station" }, { status: 400 });

  // ------------------------------------------------------------ product order (one or more items)
  if (body.kind === "order") {
    const raw: unknown[] = Array.isArray(body.items)
      ? body.items
      : body.productId
        ? [{ productId: body.productId, color: body.color, qty: 1 }]
        : [];
    if (raw.length === 0) return NextResponse.json({ error: "Your cart is empty" }, { status: 400 });
    if (raw.length > MAX_ORDER_LINES) return NextResponse.json({ error: "Too many items in one order" }, { status: 400 });

    const lines: OrderLine[] = [];
    for (const r of raw) {
      const it = (r ?? {}) as Record<string, unknown>;
      const product = await getProduct(clean(it.productId, 64));
      if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });
      if (!product.available)
        return NextResponse.json({ error: `${product.name} is not taking orders right now` }, { status: 400 });

      // if the seller listed colours for this product, the buyer must have chosen one of them
      let color = clean(it.color, 40);
      if (product.colors.length > 0 && !product.colors.includes(color))
        return NextResponse.json({ error: "Please choose a colour" }, { status: 400 });
      if (product.colors.length === 0) color = "";

      const qty = Math.floor(Number(it.qty));
      if (!(qty >= 1 && qty <= MAX_QTY_PER_LINE))
        return NextResponse.json({ error: "Invalid quantity" }, { status: 400 });

      lines.push({ product, color, qty });
    }
    const total = lines.reduce((n, l) => n + l.qty * l.product.price, 0);
    const pieces = lines.reduce((n, l) => n + l.qty, 0);
    const distinct = [...new Set(lines.map((l) => l.product.id))];

    const subject =
      lines.length === 1
        ? `New order: ${lines[0].qty} × ${lines[0].product.name}${lines[0].color ? ` - ${lines[0].color}` : ""} (${station})`
        : `New order: ${pieces} items, ${formatPrice(total)} (${station})`;

    const rows = lines
      .map(
        (l) => `<tr>
          <td style="padding:6px 10px 6px 0">${l.product.images[0] ? `<img src="${esc(absoluteUrl(l.product.images[0]))}" width="64" style="border-radius:8px">` : ""}</td>
          <td style="padding:6px 10px 6px 0"><b>${esc(l.product.name)}</b>${l.color ? `<br>Colour: <b>${esc(l.color)}</b>` : ""}</td>
          <td style="padding:6px 10px 6px 0;white-space:nowrap">${l.qty} &times; ${formatPrice(l.product.price)}</td>
          <td style="padding:6px 0;white-space:nowrap"><b>${formatPrice(l.qty * l.product.price)}</b></td>
        </tr>`,
      )
      .join("");

    const [saved, emailed] = await Promise.all([
      save({
        kind: "order",
        name,
        station,
        product_id: supabaseConfigured && distinct.length === 1 ? distinct[0] : null,
        details: {
          items: lines.map((l) => ({
            product: l.product.name,
            colour: l.color,
            qty: l.qty,
            price: l.product.price,
          })),
          total,
        },
      }),
      sendEmail(
        subject,
        `<h2>New order enquiry</h2>
         <table cellspacing="0" cellpadding="0" style="border-collapse:collapse">${rows}</table>
         <p style="font-size:16px"><b>Total: ${formatPrice(total)}</b> (${pieces} ${pieces === 1 ? "item" : "items"})</p>
         <p>Name: <b>${esc(name)}</b><br>Pickup station: <b>${esc(station)}</b></p>
         <p>The buyer is being redirected to WhatsApp (${WHATSAPP_NUMBER.replace(/^91/, "")}). Payment and pickup time are decided there.</p>`,
        [],
      ),
    ]);

    return NextResponse.json({ waUrl: waLink(orderMessage(lines, total, name, station)), saved, emailed });
  }

  // ------------------------------------------------------------ custom request
  if (body.kind === "custom") {
    const custom = {
      name,
      station,
      material: clean(body.material, 80),
      type: clean(body.type, 80),
      budget: clean(body.budget, 12).replace(/[^\d]/g, ""),
      description: clean(body.description, 1500),
      images: (Array.isArray(body.images) ? body.images : [])
        .filter((u): u is string => typeof u === "string" && isSupabaseUrl(u))
        .slice(0, MAX_CUSTOM_IMAGES),
    };
    if (!custom.description)
      return NextResponse.json({ error: "Description is required" }, { status: 400 });

    const [saved, emailed] = await Promise.all([
      save({
        kind: "custom",
        name,
        station,
        images: custom.images,
        details: { material: custom.material, type: custom.type, budget: custom.budget, description: custom.description },
      }),
      sendEmail(
        `New CUSTOM request from ${name} (${station})`,
        `<h2>New custom request</h2>
         <p>Name: <b>${esc(name)}</b><br>Pickup station: <b>${esc(station)}</b></p>
         <p>Material: ${esc(custom.material) || "-"}<br>Type: ${esc(custom.type) || "-"}<br>
            Budget: ${custom.budget ? "₹" + esc(custom.budget) : "-"}</p>
         <p>${esc(custom.description).replace(/\n/g, "<br>")}</p>
         ${custom.images.map((u) => `<p><img src="${esc(u)}" width="240"></p>`).join("")}
         <p>The buyer is being redirected to WhatsApp (${WHATSAPP_NUMBER.replace(/^91/, "")}). Payment and pickup time are decided there.</p>`,
        custom.images,
      ),
    ]);

    return NextResponse.json({ waUrl: waLink(customMessage(custom)), saved, emailed });
  }

  return NextResponse.json({ error: "Invalid request" }, { status: 400 });
}
