"use client";
import { useEffect } from "react";

/** Registers the PWA service worker in production only (keeps dev cache-free). */
export default function SwRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(() => {});
  }, []);
  return null;
}
