import { NextRequest, NextResponse } from "next/server";
import { admin } from "@/lib/supabase";
import { isAdminRequest } from "@/lib/admin";

/**
 * Admin-only image upload → Supabase Storage bucket "products" (public).
 * Server-side only: uses the service_role client; the bucket is created
 * automatically on first upload (public read, 5 MB cap, images only).
 */
export async function POST(req: NextRequest) {
  if (!(await isAdminRequest())) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

  let fd: FormData;
  try {
    fd = await req.formData();
  } catch {
    return NextResponse.json({ ok: false, error: "expected multipart form data" }, { status: 400 });
  }
  const file = fd.get("file") as File | null;
  if (!file || typeof file === "string") return NextResponse.json({ ok: false, error: "no file sent" }, { status: 400 });
  if (!file.type.startsWith("image/")) return NextResponse.json({ ok: false, error: "only image files are allowed" }, { status: 400 });
  if (file.size > 4.5 * 1024 * 1024) return NextResponse.json({ ok: false, error: "image too large (max 4.5 MB)" }, { status: 400 });

  const sb = admin();
  // Idempotent: ignore "already exists" so the first upload provisions the bucket.
  const { error: bucketErr } = await sb.storage.createBucket("products", {
    public: true,
    fileSizeLimit: 5242880,
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif"],
  });
  if (bucketErr && !/already exists/i.test(bucketErr.message)) {
    return NextResponse.json({ ok: false, error: "storage: " + bucketErr.message }, { status: 500 });
  }

  const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
  const path = `p-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext || "jpg"}`;
  const buf = Buffer.from(await file.arrayBuffer());
  const { error } = await sb.storage.from("products").upload(path, buf, {
    contentType: file.type,
    cacheControl: "31536000",
    upsert: false,
  });
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });

  const { data } = sb.storage.from("products").getPublicUrl(path);
  return NextResponse.json({ ok: true, url: data.publicUrl, path });
}
