import { getProducts } from "@/lib/store";
import ShopClient from "./shop-client";
import type { Metadata } from "next";

const BASE = process.env.NEXT_PUBLIC_SITE_URL || "https://tajgifts.netlify.app";

export const metadata: Metadata = {
  title: "Shop Gift Hampers Online — Festive, Wedding, Baby & Corporate | Taj Gifts",
  description:
    "Browse every hand-tied gift hamper from Taj Gifts Kashipur — Diwali & festive boxes, wedding trays, baby shower, anniversary, self-care, corporate and pahadi-special hampers. Prices ₹1,299–₹3,299, COD & UPI.",
  alternates: { canonical: BASE + "/shop" },
};

export default async function Shop({ searchParams }: { searchParams: Promise<{ occasion?: string }> }) {
  const { occasion } = await searchParams;
  const products = await getProducts();
  return <ShopClient products={products} initialOccasion={occasion || "All"} />;
}
