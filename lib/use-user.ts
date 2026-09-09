"use client";
import { useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { browserSupabase } from "./supabase/browser";

export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const sb = browserSupabase();
    sb.auth.getSession().then((res: { data: { session: Session | null } }) => {
      setUser(res.data.session?.user ?? null);
      setLoading(false);
    });
    const { data: sub } = sb.auth.onAuthStateChange((_e: unknown, session: Session | null) => setUser(session?.user ?? null));
    return () => sub.subscription.unsubscribe();
  }, []);
  return { user, loading };
}
