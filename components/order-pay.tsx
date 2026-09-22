"use client";
import { useEffect, useState } from "react";

/** Real payment box: UPI deep-link (any UPI app) + Razorpay when keys exist. Zero screenshots. */
export default function OrderPay({ orderId, total, upiId, payeeName, code }: { orderId: string; total: number; upiId: string; payeeName: string; code: string }) {
  const [rzpKey, setRzpKey] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  useEffect(() => {
    fetch("/api/pay/rzp").then((r) => r.json()).then((j) => j.enabled && setRzpKey(j.key)).catch(() => {});
  }, []);
  const upiLink = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(payeeName)}&am=${total.toFixed(2)}&cu=INR&tn=${encodeURIComponent("Taj" + code)}`;

  const payGateway = async () => {
    setBusy(true); setMsg("");
    try {
      const r = await fetch("/api/pay/rzp", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ orderId }) });
      const j = await r.json();
      if (!j.ok) throw new Error(j.error || "gateway error");
      await new Promise<void>((res, rej) => {
        const s = document.createElement("script");
        s.src = "https://checkout.razorpay.com/v1/checkout.js";
        s.onload = () => res();
        s.onerror = () => rej(new Error("could not load payment page"));
        document.body.appendChild(s);
      });
      const w = window as unknown as { Razorpay: new (o: Record<string, unknown>) => { open: () => void } };
      const rz = new w.Razorpay({
        key: j.key,
        amount: j.amount,
        currency: "INR",
        name: "Taj Gifts",
        description: `Order ${code}`,
        order_id: j.rzpOrderId,
        prefill: { name: j.prefill_name, email: j.email },
        theme: { color: "#C0697A" },
        handler: async (resp: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
          const v = await fetch("/api/pay/rzp/verify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ orderId, rzpOrderId: resp.razorpay_order_id, paymentId: resp.razorpay_payment_id, signature: resp.razorpay_signature }) });
          const vj = await v.json();
          if (vj.ok) { setMsg("Payment verified ✅ — this page updates in a few seconds."); setTimeout(() => location.reload(), 2500); }
          else setMsg("Payment verification failed — we'll check manually, no action needed from you.");
        },
        modal: { ondismiss: () => setBusy(false) },
      });
      rz.open();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "payment failed");
      setBusy(false);
    }
  };

  return (
    <div className="mt-7 rounded-2xl border border-line bg-white/80 p-5 text-sm">
      <p className="font-bold">Pay {`₹${total.toLocaleString("en-IN")}`} securely</p>
      <p className="mt-1 text-[12px] leading-relaxed text-ink-soft">
        Tap below — your UPI app (GPay / PhonePe / Paytm) opens with the exact amount and our verified UPI ID {upiId} ({payeeName}) pre-filled.
        Payment is verified automatically. <b>No screenshots, no forwarding — ever.</b>
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <a className="btn-rose" href={upiLink}>Pay with any UPI app</a>
        {rzpKey && (
          <button className="btn-ghost" onClick={payGateway} disabled={busy}>
            {busy ? "Opening…" : "Cards / netbanking / UPI (Razorpay)"}
          </button>
        )}
      </div>
      {msg && <p className="mt-2 text-[12px] font-bold text-mint-deep">{msg}</p>}
      <p className="mt-2 text-[11px] text-ink-soft">Paying later? Cash on delivery is settled at your door against the delivery OTP.</p>
    </div>
  );
}
