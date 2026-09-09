import type { Metadata } from "next";
import { Fraunces, Manrope, Caveat } from "next/font/google";
import "./globals.css";
import { getSettings } from "@/lib/store";
import { CartProvider } from "@/lib/cart";
import Header from "@/components/header";
import Footer from "@/components/footer";
import CartDrawer from "@/components/cart-drawer";
import Cursor from "@/components/cursor";
import Toast from "@/components/toast";

const fraunces = Fraunces({ subsets: ["latin"], variable: "--ff-fraunces", display: "swap" });
const manrope = Manrope({ subsets: ["latin"], variable: "--ff-manrope", display: "swap" });
const caveat = Caveat({ subsets: ["latin"], variable: "--ff-caveat", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://tajgifts.example.com"),
  title: {
    default: "Taj Gifts — Hand-tied gift hampers from Kashipur, Uttarakhand",
    template: "%s · Taj Gifts",
  },
  description:
    "Small-batch gift hampers hand-tied at home in Kashipur, Uttarakhand. Festive, wedding, baby, corporate & pahadi-special hampers with COD, UPI and same-day local delivery.",
  keywords: ["gift hampers", "Uttarakhand", "Kashipur", "gift boxes India", "diwali hampers", "wedding return gifts"],
  openGraph: {
    title: "Taj Gifts — hand-tied hampers from the hills",
    description: "Pastel-perfect gift hampers made at home in Kashipur, Uttarakhand.",
    images: ["/img/hero.jpg"],
  },
};

export const revalidate = 60;

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSettings();
  return (
    <html lang="en" className={`${fraunces.variable} ${manrope.variable} ${caveat.variable}`}>
      <body>
        <div className="grain" aria-hidden />
        <Cursor />
        <CartProvider settings={settings}>
          <Header />
          <main>{children}</main>
          <Footer settings={settings} />
          <CartDrawer />
          <Toast />
        </CartProvider>
      </body>
    </html>
  );
}
