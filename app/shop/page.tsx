import { getProducts } from "@/lib/store";
import ShopClient from "./shop-client";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Shop hampers", description: "Browse every hand-tied gift hamper — festive, wedding, baby, corporate, self-care and pahadi-special." };

export default async function Shop({ searchParams }: { searchParams: Promise<{ occasion?: string }> }) {
  const { occasion } = await searchParams;
  const products = await getProducts();
  return <ShopClient products={products} initialOccasion={occasion || "All"} />;
}
