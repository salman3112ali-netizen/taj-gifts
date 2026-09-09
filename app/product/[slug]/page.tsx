import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { getProduct, getProducts, getSettings, inr } from "@/lib/store";
import ProductView from "./product-view";
import ProductCard from "@/components/product-card";
import { Reveal } from "@/components/reveal";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const p = await getProduct(slug);
  return p ? { title: p.name, description: p.tagline || p.description || undefined } : { title: "Hamper not found" };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [p, all, settings] = await Promise.all([getProduct(slug), getProducts(), getSettings()]);
  if (!p || !p.published) notFound();
  const related = all.filter((x) => x.id !== p.id && (x.occasion === p.occasion || x.featured)).slice(0, 4);

  return (
    <>
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
