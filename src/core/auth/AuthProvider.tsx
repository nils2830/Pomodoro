"use client";

import { useEffect } from "react";
import { config } from "../config";
import { getSupabase } from "./supabase-browser";
import { useAuth, type Profile } from "./store";
import type { ProGrant } from "../billing/grants";

async function loadAccount(userId: string): Promise<{ profile: Profile | null; grant: ProGrant | null }> {
  const sb = getSupabase();
  if (!sb) return { profile: null, grant: null };
  // RLS limits both reads to the signed-in user's own rows.
  const [{ data: profile }, { data: grant }] = await Promise.all([
    sb.from("profiles").select("*").eq("id", userId).maybeSingle(),
    sb.from("pro_grants").select("email, expires_at, note").maybeSingle(),
  ]);
  return { profile: (profile as Profile | null) ?? null, grant: (grant as ProGrant | null) ?? null };
}

async function loadIsAdmin(): Promise<boolean> {
  const res = await fetch("/api/admin/me").catch(() => null);
  if (!res?.ok) return false;
  const body = (await res.json().catch(() => ({}))) as { admin?: boolean };
  return Boolean(body.admin);
}

/** Keeps the auth store in sync with Supabase. Renders nothing. */
export function AuthProvider() {
  useEffect(() => {
    const { set } = useAuth.getState();
    const sb = getSupabase();
    if (!config.supabase.enabled || !sb) {
      set({ status: "disabled", user: null, profile: null, grant: null, isAdmin: false });
      return;
    }

    let cancelled = false;
    const apply = async (user: import("@supabase/supabase-js").User | null) => {
      if (!user) {
        set({ status: "signedOut", user: null, profile: null, grant: null, isAdmin: false });
        return;
      }
      set({ status: "signedIn", user });
      const [account, isAdmin] = await Promise.all([loadAccount(user.id), loadIsAdmin()]);
      if (!cancelled) set({ ...account, isAdmin });
    };

    sb.auth.getUser().then(({ data }) => apply(data.user ?? null));
    const { data: sub } = sb.auth.onAuthStateChange((_event, session) => {
      apply(session?.user ?? null);
    });

    // Plans change through the Stripe webhook or an admin grant; refresh when the tab returns.
    const onFocus = () => {
      const user = useAuth.getState().user;
      if (user) loadAccount(user.id).then((account) => !cancelled && set(account));
    };
    window.addEventListener("focus", onFocus);

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  return null;
}

export async function signOut(): Promise<void> {
  await getSupabase()?.auth.signOut();
}
