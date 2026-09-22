import { getProducts } from "@/lib/store";
import SearchScreen from "./search-screen";

export const metadata = { title: "Search · Taj Gifts App" };

export default async function AppSearch() {
  const products = await getProducts();
  return <SearchScreen products={products} />;
}
