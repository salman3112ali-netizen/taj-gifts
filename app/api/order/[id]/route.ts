import { NextRequest, NextResponse } from "next/server";
import { admin } from "@/lib/supabase";
import { getCurrentUser } from "@/lib/supabase/server";
import { customerVisibleOtp, validTrackingToken } from "@/lib/fulfilment";
import { customerAppIdentity } from "@/lib/customer-app-auth";
import { ownsOrClaimsLegacyOrder } from "@/lib/order-access";

export const dynamic = "force-dynamic";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Customer tracking is private. New orders require either the private tracking
 * token carried by the confirmation link/app or the signed-in account that owns
 * the order. Legacy pre-security orders retain UUID-capability access only.
 */
export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  if (!UUID.test(id)) return NextResponse.json({ ok: false, error: "Invalid order reference." }, { status: 400 });
  const sb = admin();
  const { data: order, error } = await sb.from("orders").select("*").eq("id", id).maybeSingle();
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  if (!order) return NextResponse.json({ ok: false, error: "Order not found." }, { status: 404 });

  const rawToken = req.nextUrl.searchParams.get("t");
  // Browser accounts use cookies; native Taj accounts use an app-scoped bearer.
  const account = customerAppIdentity(req) ?? await getCurrentUser().catch(() => null);
  const tokenOk = validTrackingToken(order.tracking_token_hash as string | null, rawToken);
  const accountOk = await ownsOrClaimsLegacyOrder(order, account);
  if (!tokenOk && !accountOk) {
    return NextResponse.json({ ok: false, error: "Open the private tracking link from your Taj Gifts confirmation or sign in to the account used for this order." }, { status: 401 });
  }

  const [{ data: items }, otp, { data: fulfilment }] = await Promise.all([
    sb.from("order_items").select("*").eq("order_id", id).order("created_at", { ascending: true }),
    customerVisibleOtp(id),
    sb.from("order_fulfilments").select("delivery_mode,courier_name,tracking_number,tracking_url,out_for_delivery_at,delivered_at,latest_attempt_note").eq("order_id", id).maybeSingle(),
  ]);
  const { tracking_token_hash, tracking_token_ciphertext, client_request_id, ...safeOrder } = order as Record<string, unknown>;
  void tracking_token_hash; void tracking_token_ciphertext; void client_request_id;
  const timeline = Array.isArray(safeOrder.timeline)
    ? safeOrder.timeline.map((entry) => {
        const { otp: legacyOtp, ...safe } = (entry ?? {}) as Record<string, unknown>;
        void legacyOtp;
        return safe;
      })
    : [];
  safeOrder.timeline = timeline;
  return NextResponse.json(
    {
      ok: true,
      order: safeOrder,
      items: items ?? [],
      deliveryOtp: otp?.code ?? null,
      deliveryOtpExpiresAt: otp?.expiresAt ?? null,
      fulfilment: fulfilment ?? null,
    },
    { headers: { "Cache-Control": "no-store, max-age=0" } }
  );
}
