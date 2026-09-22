import { NextRequest, NextResponse } from "next/server";
import { admin } from "@/lib/supabase";
import { isAdminRequest } from "@/lib/admin";

const slugify = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

export async function POST(req: NextRequest) {
  if (!(await isAdminRequest())) return NextResponse.json({ ok: false }, { status: 401 });
  const b = await req.json();
  const slug = b.slug ? slugify(b.slug) : slugify(b.name || "hamper-" + Date.now());
  const { data, error } = await admin().from("products").insert({
    slug,
    name: b.name, tagline: b.tagline || null, occasion: b.occasion || "Festive",
    price: Number(b.price) || 0, compare_at: b.compare_at ? Number(b.compare_at) : null,
    image: b.image || "/img/hero.jpg", gallery: b.gallery?.length ? b.gallery : [b.image || "/img/hero.jpg"],
    badge: b.badge || null, featured: !!b.featured, stock: Number(b.stock) || 0,
    rating: b.rating ?? 5, reviews: b.reviews ?? 0, lead_time: b.lead_time || null,
    description: b.description || null,
    contents: typeof b.contents === "string" ? b.contents.split("\n").map((s: string) => s.trim()).filter(Boolean) : b.contents ?? [],
    variants: b.variants ?? [], addons: b.addons ?? [], tags: b.tags ?? [],
    published: b.published !== false, sort_order: b.sort_order ?? null,
  }).select("id").single();
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, id: data.id });
}

export async function PATCH(req: NextRequest) {
  if (!(await isAdminRequest())) return NextResponse.json({ ok: false }, { status: 401 });
  const b = await req.json();
  const { id, ...rest } = b;
  if (!id) return NextResponse.json({ ok: false }, { status: 400 });
  const patch: Record<string, unknown> = { ...rest, updated_at: new Date().toISOString() };
  if (typeof patch.contents === "string") patch.contents = (patch.contents as string).split("\n").map((s) => s.trim()).filter(Boolean);
  for (const k of ["price", "compare_at", "stock", "sort_order"]) if (patch[k] !== undefined && patch[k] !== null) patch[k] = Number(patch[k]);
  const { error } = await admin().from("products").update(patch).eq("id", id);
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  if (!(await isAdminRequest())) return NextResponse.json({ ok: false }, { status: 401 });
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ ok: false }, { status: 400 });
  const { error } = await admin().from("products").delete().eq("id", id);
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
