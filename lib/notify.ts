/**
 * Owner notification pipeline for new orders. Fully optional & graceful:
 *  1) ORDER_NOTIFY_WEBHOOK  → POSTs {order, brief} as JSON (Make.com / Zapier / n8n / AiSensy / WATI webhook…)
 *  2) META_WA_TOKEN + META_WA_PHONE_ID + META_WA_TO → official WhatsApp Cloud API template message
 *     (free Meta test number works; see WHATSAPP-AUTO-SETUP.md)
 * If neither is configured, nothing happens — the customer's one-tap work-order
 * button and /admin always work regardless.
 */
export async function notifyOwners(payload: {
  order: Record<string, unknown>;
  brief: string;
}): Promise<void> {
  const hook = process.env.ORDER_NOTIFY_WEBHOOK;
  if (hook) {
    fetch(hook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).catch(() => {});
  }

  const token = process.env.META_WA_TOKEN;
  const phoneId = process.env.META_WA_PHONE_ID;
  const to = (process.env.META_WA_TO || "").replace(/\D/g, "");
  const template = process.env.META_WA_TEMPLATE || "taj_order_alert";
  if (!token || !phoneId || !to) return;

  const o = payload.order as Record<string, any>;
  const parameters = [
    String(o.id ?? "").slice(0, 8),          // {{1}} order code fragment
    String(o.customer_name ?? ""),          // {{2}}
    String(o.customer_phone ?? ""),         // {{3}}
    String(o.total ?? ""),                  // {{4}}
    String(o.payment_method ?? ""),         // {{5}}
    String(o.customer_city ?? ""),          // {{6}}
    String(o.customer_pincode ?? ""),       // {{7}}
    String(o.gift_delivery_date || "asap"), // {{8}}
    String(o.gift_note ?? "").slice(0, 120) || "-", // {{9}}
    String(o.status ?? "pending"),          // {{10}}
  ].map((text) => ({ type: "text", text }));

  fetch(`https://graph.facebook.com/v20.0/${phoneId}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to,
      type: "template",
      template: {
        name: template,
        language: { code: "en" },
        components: [{ type: "body", parameters }],
      },
    }),
  }).catch(() => {});
}
