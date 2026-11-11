import { NextRequest, NextResponse } from "next/server";
import { admin } from "@/lib/supabase";
import { isAdminRequest } from "@/lib/admin";

const slugify = (value: string) => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
const cleanText = (value: unknown, max: number) => String(value ?? "").trim().slice(0, max);

function money(value: unknown, field: string, optional = false) {
  if ((value === null || value === undefined || value === "") && optional) return null;
  const number = Number(value);
  if (!Number.isInteger(number) || number < 0 || number > 1_000_000) throw new Error(`Enter a valid ${field}.`);
  return number;
}

function stock(value: unknown) {
  const number = Number(value);
  if (!Number.isInteger(number) || number < 0 || number > 100_000) throw new Error("Enter a valid non-negative stock quantity.");
  return number;
}

function optionList(value: unknown, kind: "variant" | "addon") {
  if (!Array.isArray(value)) return [];
  if (value.length > 30) throw new Error("Too many product options.");
  const seen = new Set<string>();
  return value.map((entry) => {
    const raw = entry && typeof entry === "object" ? entry as Record<string, unknown> : {};
    const label = cleanText(raw.label, 80);
    if (!label || seen.has(label.toLowerCase())) throw new Error("Each option needs a unique label.");
    seen.add(label.toLowerCase());
    const price = money(raw.price, `${kind} price`);
    return kind === "variant"
      ? { label, price, ...(cleanText(raw.note, 160) ? { note: cleanText(raw.note, 160) } : {}) }
      : { label, price };
  });
}

function productPayload(input: Record<string, unknown>, isNew: boolean) {
  const name = cleanText(input.name, 140);
  if (!name) throw new Error("A product name is required.");
  const price = money(input.price, "price");
  if (price === null || price <= 0) throw new Error("Product price must be greater than zero.");
  const compareAt = money(input.compare_at, "compare-at price", true);
  if (compareAt !== null && compareAt <= price) throw new Error("Compare-at price must be greater than the selling price.");
  const image = cleanText(input.image, 500) || "/img/hero.jpg";
  const gallery = Array.isArray(input.gallery) ? input.gallery.map((value) => cleanText(value, 500)).filter(Boolean).slice(0, 12) : [];
  const contents = typeof input.contents === "string"
    ? input.contents.split("\n").map((value) => cleanText(value, 160)).filter(Boolean).slice(0, 60)
    : Array.isArray(input.contents) ? input.contents.map((value) => cleanText(value, 160)).filter(Boolean).slice(0, 60) : [];
  const tags = Array.isArray(input.tags) ? input.tags.map((value) => cleanText(value, 60)).filter(Boolean).slice(0, 20) : [];
  const sortOrder = input.sort_order === null || input.sort_order === undefined || input.sort_order === "" ? null : money(input.sort_order, "sort order");
  return {
    ...(isNew ? { slug: cleanText(input.slug, 140) ? slugify(cleanText(input.slug, 140)) : slugify(name) } : {}),
    name,
    tagline: cleanText(input.tagline, 220) || null,
    occasion: cleanText(input.occasion, 80) || "Festive",
    price,
    compare_at: compareAt,
    image,
    gallery: gallery.length ? gallery : [image],
    badge: cleanText(input.badge, 60) || null,
    featured: input.featured === true,
    stock: stock(input.stock),
    // Review totals are maintained only by the verified-review database trigger;
    // catalogue editing must never manufacture social-proof metrics.
    lead_time: cleanText(input.lead_time, 120) || null,
    description: cleanText(input.description, 2500) || null,
    contents,
    variants: optionList(input.variants, "variant"),
    addons: optionList(input.addons, "addon"),
    tags,
    published: input.published !== false,
    sort_order: sortOrder,
  };
}

export async function POST(req: NextRequest) {
  if ((req.headers.get("x-http-method-override") || "").toUpperCase() === "PATCH") return PATCH(req);
  if (!(await isAdminRequest())) return NextResponse.json({ ok: false }, { status: 401 });
  try {
    const payload = productPayload((await req.json()) as Record<string, unknown>, true);
    if (!payload.slug) return NextResponse.json({ ok: false, error: "A valid product slug is required." }, { status: 400 });
    const { data, error } = await admin().from("products").insert(payload).select("id").single();
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, id: data.id });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Invalid product data." }, { status: 400 });
  }
}

export async function PATCH(req: NextRequest) {
  if (!(await isAdminRequest())) return NextResponse.json({ ok: false }, { status: 401 });
  try {
    const body = await req.json() as Record<string, unknown>;
    const id = cleanText(body.id, 80);
    if (!id) return NextResponse.json({ ok: false, error: "Missing product id." }, { status: 400 });
    // Some admin controls intentionally patch one field (for example publish /
    // unpublish). Merge with the current row, then validate the complete shape.
    const { id: _id, ...rest } = body;
    void _id;
    const sb = admin();
    const { data: current } = await sb.from("products").select("*").eq("id", id).maybeSingle();
    if (!current) return NextResponse.json({ ok: false, error: "Product not found." }, { status: 404 });
    const patch = { ...productPayload({ ...(current as Record<string, unknown>), ...rest }, false), updated_at: new Date().toISOString() };
    const { error } = await sb.from("products").update(patch).eq("id", id);
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Invalid product data." }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest) {
  if (!(await isAdminRequest())) return NextResponse.json({ ok: false }, { status: 401 });
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ ok: false, error: "Missing product id." }, { status: 400 });
  // Preserve historic order-line references and item snapshots. Archive instead
  // of deleting a product that may already have been purchased.
  const { error } = await admin().from("products").update({ published: false, stock: 0, updated_at: new Date().toISOString() }).eq("id", id);
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, archived: true });
}
