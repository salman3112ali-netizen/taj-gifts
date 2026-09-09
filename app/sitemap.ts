import type { MetadataRoute } from "next";
import { getProducts } from "@/lib/store";

const BASE = process.env.NEXT_PUBLIC_SITE_URL || "https://tajgifts.netlify.app";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = await getProducts().catch(() => []);
  const now = new Date();
  const statics: MetadataRoute.Sitemap = [
    { url: BASE + "/", changeFrequency: "daily", priority: 1.0, lastModified: now },
    { url: BASE + "/shop", changeFrequency: "daily", priority: 0.9, lastModified: now },
    { url: BASE + "/about", changeFrequency: "monthly", priority: 0.6, lastModified: now },
    { url: BASE + "/contact", changeFrequency: "monthly", priority: 0.6, lastModified: now },
  ];
  const prod: MetadataRoute.Sitemap = products.map((p) => ({
    url: `${BASE}/product/${p.slug}`,
    changeFrequency: "weekly",
    priority: 0.85,
    lastModified: p.updated_at ? new Date(p.updated_at) : now,
  }));
  return [...statics, ...prod];
}
