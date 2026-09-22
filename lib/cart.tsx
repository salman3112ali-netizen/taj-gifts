"use client";
import { createContext, useContext, useEffect, useMemo, useState, ReactNode, useCallback } from "react";
import type { CartItem, Settings } from "./types";
import { itemKey, unitPrice } from "./types";
import { couponDiscount, deliveryFor, inr } from "./store";

type CouponState = { code: string; type: "flat" | "percent"; value: number; label: string | null } | null;

type CartCtx = {
  items: CartItem[];
  add: (item: CartItem) => void;
  remove: (key: string) => void;
  setQty: (key: string, qty: number) => void;
  clear: () => void;
  count: number;
  subtotal: number;
  coupon: CouponState;
  discount: number;
  applyCoupon: (code: string) => Promise<string | null>;
  clearCoupon: () => void;
  drawer: boolean;
  setDrawer: (v: boolean) => void;
  toast: string | null;
  notify: (msg: string) => void;
  settings: Settings;
};

const Ctx = createContext<CartCtx | null>(null);
export const useCart = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error("useCart outside provider");
  return c;
};

export function CartProvider({ children, settings }: { children: ReactNode; settings: Settings }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [coupon, setCoupon] = useState<CouponState>(null);
  const [drawer, setDrawer] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("taj-cart");
      if (raw) setItems(JSON.parse(raw));
      const c = localStorage.getItem("taj-coupon");
      if (c) setCoupon(JSON.parse(c));
    } catch {}
  }, []);
  useEffect(() => {
    localStorage.setItem("taj-cart", JSON.stringify(items));
  }, [items]);
  useEffect(() => {
    if (coupon) localStorage.setItem("taj-coupon", JSON.stringify(coupon));
    else localStorage.removeItem("taj-coupon");
  }, [coupon]);

  const notify = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2600);
  }, []);

  const add = useCallback((item: CartItem) => {
    setItems((prev) => {
      const key = itemKey(item);
      const found = prev.find((p) => itemKey(p) === key);
      if (found) return prev.map((p) => (itemKey(p) === key ? { ...p, qty: p.qty + item.qty } : p));
      return [...prev, item];
    });
    notify(`${item.name} added to your hamper basket`);
  }, [notify]);

  const remove = useCallback((key: string) => setItems((prev) => prev.filter((p) => itemKey(p) !== key)), []);
  const setQty = useCallback(
    (key: string, qty: number) =>
      setItems((prev) => (qty <= 0 ? prev.filter((p) => itemKey(p) !== key) : prev.map((p) => (itemKey(p) === key ? { ...p, qty } : p)))),
    []
  );
  const clear = useCallback(() => { setItems([]); setCoupon(null); }, []);

  const subtotal = useMemo(() => items.reduce((s, i) => s + unitPrice(i) * i.qty, 0), [items]);
  const count = useMemo(() => items.reduce((s, i) => s + i.qty, 0), [items]);
  const discount = useMemo(
    () => (coupon && subtotal >= 0 ? couponDiscount(coupon.type, coupon.value, subtotal) : 0),
    [coupon, subtotal]
  );

  const applyCoupon = useCallback(
    async (code: string) => {
      const res = await fetch("/api/coupon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, subtotal }),
      });
      const j = await res.json();
      if (!j.ok) return j.error || "This code isn't valid right now";
      setCoupon({ code: j.code, type: j.type, value: j.value, label: j.label });
      notify(`Code ${j.code} applied — you saved ${inr(j.discount)}`);
      return null;
    },
    [subtotal, notify]
  );
  const clearCoupon = useCallback(() => setCoupon(null), []);

  return (
    <Ctx.Provider value={{ items, add, remove, setQty, clear, count, subtotal, coupon, discount, applyCoupon, clearCoupon, drawer, setDrawer, toast, notify, settings }}>
      {children}
    </Ctx.Provider>
  );
}

export { deliveryFor, inr };
