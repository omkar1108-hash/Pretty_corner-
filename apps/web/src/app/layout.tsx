import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import { LanguageProvider } from "@/components/LanguageProvider";
import { LANGS, type Lang } from "@/lib/i18n";
import { SHOP_NAME } from "@/lib/config";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: `${SHOP_NAME} | Handmade accessories`, template: `%s | ${SHOP_NAME}` },
  description:
    "Handmade chenille flowers, crochet accessories and pearl & kundan jewellery, made to order. Pickup between Virar and Borivali.",
};

export const viewport: Viewport = { themeColor: "#c2185b", width: "device-width", initialScale: 1 };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const saved = (await cookies()).get("lang")?.value as Lang | undefined;
  const lang: Lang = saved && LANGS.includes(saved) ? saved : "en";

  return (
    <html lang={lang}>
      <body>
        <LanguageProvider initial={lang}>{children}</LanguageProvider>
      </body>
    </html>
  );
}
