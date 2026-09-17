import { notFound } from "next/navigation";
import { getProduct, getSettings } from "@/lib/store";
import AppProduct from "./app-product";

export const dynamic = "force-dynamic";

export default async function AppProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [p, settings] = await Promise.all([getProduct(slug), getSettings()]);
  if (!p) notFound();
  return <AppProduct p={p} settings={settings} />;
}
