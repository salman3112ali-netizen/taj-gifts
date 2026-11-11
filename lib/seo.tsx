import type { Product, Settings } from "./types";

const BASE = process.env.NEXT_PUBLIC_SITE_URL || "https://tajgifts.netlify.app";

export function JsonLd({ data }: { data: unknown }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}

export function siteJsonLd(s: Settings) {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": ["GiftShop", "LocalBusiness"],
        "@id": BASE + "#business",
        name: s.shopName,
        slogan: s.tagline,
        url: BASE,
        logo: BASE + "/icon.svg",
        image: BASE + "/img/hero.jpg",
        telephone: s.phone,
        email: s.email,
        priceRange: "₹₹",
        currenciesAccepted: "INR",
        paymentAccepted: "Cash on Delivery, UPI, Bank Transfer",
        address: {
          "@type": "PostalAddress",
          streetAddress: s.address,
          addressLocality: s.city,
          addressRegion: s.state,
          postalCode: s.pincode,
          addressCountry: "IN",
        },
        geo: { "@type": "GeoCoordinates", latitude: 29.2097, longitude: 79.0077 },
        areaServed: [s.city, s.state, "India"],
        hasMap: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(s.shopName + " " + s.city)}`,
        sameAs: [
          "https://www.youtube.com/@tajgifts",
          "https://www.instagram.com/tajgifts.kashipur",
        ],
        contactPoint: [{
          "@type": "ContactPoint",
          telephone: s.phone,
          contactType: "customer service",
          areaServed: "IN",
          availableLanguage: ["en", "hi"],
        }],
      },
      {
        "@type": "WebSite",
        "@id": BASE + "#website",
        url: BASE,
        name: s.shopName,
        description: s.tagline,
        publisher: { "@id": BASE + "#business" },
        inLanguage: "en-IN",
      },
    ],
  };
}

export function productJsonLd(p: Product, s: Settings) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${BASE}/product/${p.slug}#product`,
    name: p.name,
    description: (p.description || p.tagline || "").slice(0, 400),
    image: (p.gallery?.length ? p.gallery : [p.image]).map((g) => BASE + g),
    sku: p.slug,
    brand: { "@type": "Brand", name: s.shopName },
    category: `${p.occasion} gift hamper`,
    ...(p.rating && p.reviews
      ? { aggregateRating: { "@type": "AggregateRating", ratingValue: p.rating, reviewCount: p.reviews, bestRating: 5 } }
      : {}),
    offers: {
      "@type": "Offer",
      url: `${BASE}/product/${p.slug}`,
      priceCurrency: "INR",
      price: p.price,
      ...(p.compare_at ? { priceSpecification: { "@type": "PriceSpecification", price: p.compare_at, priceCurrency: "INR" } } : {}),
      availability: p.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      seller: { "@id": BASE + "#business" },
      areaServed: "IN",
    },
  };
}

export function collectionJsonLd(name: string, description: string, path: string, products: Product[]) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": `${BASE}${path}#collection`,
    name,
    description,
    url: `${BASE}${path}`,
    isPartOf: { "@id": `${BASE}#website` },
    about: { "@id": `${BASE}#business` },
    mainEntity: {
      "@type": "ItemList",
      itemListElement: products.slice(0, 24).map((p, index) => ({
        "@type": "ListItem",
        position: index + 1,
        url: `${BASE}/product/${p.slug}`,
        name: p.name,
      })),
    },
  };
}

export function breadcrumbJsonLd(crumbs: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.name,
      item: BASE + c.path,
    })),
  };
}

export function faqJsonLd(items: { q: string; a: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
}
