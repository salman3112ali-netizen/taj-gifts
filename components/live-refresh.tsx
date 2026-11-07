"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Keeps the tracking page live (status changes, OTP, payment) without user action. */
export default function LiveRefresh({ every = 20000 }: { every?: number }) {
  const router = useRouter();
  useEffect(() => {
    const t = setInterval(() => router.refresh(), every);
    return () => clearInterval(t);
  }, [router, every]);
  return null;
}
