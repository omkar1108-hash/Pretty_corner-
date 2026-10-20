import { NextResponse } from "next/server";
import { Resend } from "resend";
import { getProduct } from "@/lib/data";
import { getSupabase, supabaseConfigured } from "@/lib/supabase";
import { MAX_CUSTOM_IMAGES, STATIONS } from "@/lib/config";
import { formatPrice } from "@/lib/format";
import { absoluteUrl, customMessage, orderMessage, waLink } from "@/lib/whatsapp";

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

  // ------------------------------------------------------------ product order
  if (body.kind === "order") {
    const product = await getProduct(clean(body.productId, 64));
    if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });

    const [saved, emailed] = await Promise.all([
      save({ kind: "order", name, station, product_id: supabaseConfigured ? product.id : null, details: { product: product.name, price: product.price } }),
      sendEmail(
        `New order: ${product.name} (${station})`,
        `<h2>New order enquiry</h2>
         <p><b>${esc(product.name)}</b> &middot; ${formatPrice(product.price)}</p>
         <p>Name: <b>${esc(name)}</b><br>Pickup station: <b>${esc(station)}</b></p>
         ${product.images[0] ? `<p><img src="${esc(absoluteUrl(product.images[0]))}" width="240"></p>` : ""}
         <p>The buyer is being redirected to WhatsApp (8655434260). Payment and pickup time are decided there.</p>`,
        [],
      ),
    ]);

    return NextResponse.json({ waUrl: waLink(orderMessage(product, name, station)), saved, emailed });
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
         <p>The buyer is being redirected to WhatsApp (8655434260). Payment and pickup time are decided there.</p>`,
        custom.images,
      ),
    ]);

    return NextResponse.json({ waUrl: waLink(customMessage(custom)), saved, emailed });
  }

  return NextResponse.json({ error: "Invalid request" }, { status: 400 });
}
