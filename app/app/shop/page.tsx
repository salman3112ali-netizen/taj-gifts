import { getProducts } from "@/lib/store";
import ShopScreen from "./shop-screen";

export const metadata = { title: "Shop · Taj Gifts App" };

export default async function AppShop({ searchParams }: { searchParams: Promise<{ occasion?: string }> }) {
  const { occasion } = await searchParams;
  const products = await getProducts();
  return <ShopScreen products={products} initialOccasion={occasion || "All"} />;
}
