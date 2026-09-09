import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { getProduct, getProducts, getSettings, inr } from "@/lib/store";
import ProductView from "./product-view";
import ProductCard from "@/components/product-card";
import { Reveal } from "@/components/reveal";
import { JsonLd, productJsonLd, breadcrumbJsonLd } from "@/lib/seo";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const p = await getProduct(slug);
  const BASE = process.env.NEXT_PUBLIC_SITE_URL || "https://tajgifts.netlify.app";
  return p
    ? {
        title: `${p.name} — ${p.occasion} Gift Hamper (${inr(p.price)}) | Taj Gifts Kashipur`,
        description: (p.tagline || p.description || `${p.occasion} gift hamper hand-tied in Kashipur.`).slice(0, 155),
        alternates: { canonical: `${BASE}/product/${p.slug}` },
        openGraph: { title: `${p.name} · ${p.occasion} hamper`, description: p.tagline || undefined, images: [{ url: BASE + p.image, width: 896, height: 1120, alt: p.name }] },
      }
    : { title: "Hamper not found" };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [p, all, settings] = await Promise.all([getProduct(slug), getProducts(), getSettings()]);
  if (!p || !p.published) notFound();
  const related = all.filter((x) => x.id !== p.id && (x.occasion === p.occasion || x.featured)).slice(0, 4);

  return (
    <>
      <JsonLd data={productJsonLd(p, settings)} />
      <JsonLd data={breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Shop hampers", path: "/shop" }, { name: p.occasion, path: `/shop?occasion=${encodeURIComponent(p.occasion)}` }, { name: p.name, path: `/product/${p.slug}` }])} />
      <ProductView p={p} settings={settings} />
      {related.length > 0 && (
        <section className="wrap pb-24 pt-8">
          <Reveal className="flex items-end justify-between gap-6">
            <h2 className="font-display text-3xl font-medium md:text-4xl">Goes lovely with…</h2>
            <Link href="/shop" className="btn-ghost hidden md:inline-flex">All hampers</Link>
          </Reveal>
          <div className="mt-10 grid grid-cols-2 gap-x-5 gap-y-10 md:gap-x-8 lg:grid-cols-4">
            {related.map((r, i) => (
              <Reveal key={r.id} delay={i * 0.07}><ProductCard p={r} index={i} /></Reveal>
            ))}
          </div>
        </section>
      )}
      <span className="sr-only">{inr(p.price)}</span>
    </>
  );
}
