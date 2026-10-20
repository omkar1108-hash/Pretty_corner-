import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ProductDetail from "@/components/ProductDetail";
import { getProduct } from "@/lib/data";
import { formatPrice } from "@/lib/format";
import { absoluteUrl } from "@/lib/whatsapp";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const product = await getProduct((await params).id);
  if (!product) return {};
  const title = `${product.name} · ${formatPrice(product.price)}`;
  // The Open Graph image is what WhatsApp shows when this link is shared in a chat.
  return {
    title: product.name,
    description: product.description,
    openGraph: {
      title,
      description: product.description,
      images: product.images[0] ? [absoluteUrl(product.images[0])] : [],
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const product = await getProduct((await params).id);
  if (!product) notFound();
  return <ProductDetail product={product} />;
}
