import BackgroundStage from "@/components/BackgroundStage";
import BottomNav from "@/components/BottomNav";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import SmoothScroll from "@/components/SmoothScroll";
import { getCatalog } from "@/lib/data";

/** One photo per product, up to 8, used as the moving background. */
async function backgroundImages() {
  try {
    const { products } = await getCatalog();
    return [...new Set(products.map((p) => p.images[0]).filter(Boolean))].slice(0, 8);
  } catch {
    return [];
  }
}

export default async function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <BackgroundStage images={await backgroundImages()} />
      <SmoothScroll />
      <Header />
      <main>{children}</main>
      <Footer />
      <BottomNav />
    </>
  );
}
