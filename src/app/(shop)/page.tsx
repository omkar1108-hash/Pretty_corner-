import Hero from "@/components/Hero";
import ShopBrowser from "@/components/ShopBrowser";
import { getCatalog } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const catalog = await getCatalog();
  return (
    <>
      <Hero demo={catalog.demo} />
      <div id="shop" className="mx-auto max-w-6xl scroll-mt-16 px-4 py-8">
        <ShopBrowser catalog={catalog} />
      </div>
    </>
  );
}
