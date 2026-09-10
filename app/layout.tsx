import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Fraunces, Manrope, Caveat } from "next/font/google";
import "./globals.css";
import { getSettings } from "@/lib/store";
import { CartProvider } from "@/lib/cart";
import Header from "@/components/header";
import Footer from "@/components/footer";
import CartDrawer from "@/components/cart-drawer";
import MobileTabBar from "@/components/mobile-tabbar";
import Cursor from "@/components/cursor";
import Toast from "@/components/toast";

const fraunces = Fraunces({ subsets: ["latin"], variable: "--ff-fraunces", display: "swap" });
const manrope = Manrope({ subsets: ["latin"], variable: "--ff-manrope", display: "swap" });
const caveat = Caveat({ subsets: ["latin"], variable: "--ff-caveat", display: "swap" });

const BASE = process.env.NEXT_PUBLIC_SITE_URL || "https://tajgifts.netlify.app";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#fbf7ef",
};

export const metadata: Metadata = {
  metadataBase: new URL(BASE),
  title: {
    default: "Taj Gifts — Hand-tied Gift Hampers in Kashipur, Uttarakhand | Free Local Delivery",
    template: "%s · Taj Gifts",
  },
  description:
    "Buy hand-tied gift hampers online from Kashipur, Uttarakhand — Diwali & festive boxes, wedding return-gift trays, baby, anniversary, self-care and pahadi-special hampers. Same-day local delivery, COD & UPI, custom hampers on WhatsApp.",
  keywords: [
    "gift hampers Uttarakhand", "gift hampers Kashipur", "gift boxes India online",
    "diwali gift hamper", "wedding return gifts Uttarakhand", "corporate gifting Dehradun Nainital",
    "pahadi gift box", "rakhi hamper", "baby shower hamper India", "custom gift hamper WhatsApp",
  ],
  alternates: { canonical: BASE },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: BASE,
    siteName: "Taj Gifts",
    title: "Taj Gifts — hand-tied hampers from the hills of Uttarakhand",
    description: "Pastel-perfect gift hampers made at home in Kashipur. Same-day local delivery, COD & UPI, custom hampers on WhatsApp.",
    images: [{ url: BASE + "/img/hero.jpg", width: 1344, height: 768, alt: "Pastel gift hampers hand-tied in Kashipur" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Taj Gifts — hand-tied hampers from Uttarakhand",
    description: "Festive, wedding, baby & corporate gift hampers, hand-tied in Kashipur. COD & UPI.",
    images: [BASE + "/img/hero.jpg"],
  },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 } },
  category: "shopping",
};

export const revalidate = 60;

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSettings();
  return (
    <html lang="en" className={`${fraunces.variable} ${manrope.variable} ${caveat.variable}`}>
      <body>
        {process.env.NEXT_PUBLIC_META_PIXEL_ID && (
          <Script id="meta-pixel" strategy="afterInteractive">
            {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${process.env.NEXT_PUBLIC_META_PIXEL_ID}');fbq('track','PageView');`}
          </Script>
        )}
        <div className="grain" aria-hidden />
        <Cursor />
        <CartProvider settings={settings}>
          <Header />
          <main>{children}</main>
          <Footer settings={settings} />
          <CartDrawer />
          <Toast />
          <MobileTabBar />
        </CartProvider>
      </body>
    </html>
  );
}
