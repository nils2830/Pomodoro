"use client";

import { useEffect } from "react";
import { config } from "../config";
import { getSupabase } from "./supabase-browser";
import { useAuth, type Profile } from "./store";
import type { ProGrant } from "../billing/grants";
import { claimLocalData, wipeLocalData } from "./ownership";
import { syncNow } from "../data/sync";

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
      // Never let one person's local data sync into another person's account.
      if (claimLocalData(user.id) === "switched") {
        window.location.reload();
        return;
      }
      set({ status: "signedIn", user });
      const [account, isAdmin] = await Promise.all([loadAccount(user.id), loadIsAdmin()]);
      if (!cancelled) set({ ...account, isAdmin });
    };

    // Fires INITIAL_SESSION straight away from the stored session, so the app
    // keeps working while Supabase is unreachable. The proxy verifies the
    // session on the server for every page load.
    const { data: sub } = sb.auth.onAuthStateChange((event, session) => {
      if (event === "TOKEN_REFRESHED") return;
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

/**
 * Signs out on this device: saves pending changes to the account first
 * (best effort, a few seconds at most), then clears the local copy and
 * returns to the welcome page.
 */
export async function signOut(): Promise<void> {
  const sb = getSupabase();
  const userId = useAuth.getState().user?.id;
  if (sb && userId) {
    await Promise.race([syncNow(userId).catch(() => {}), new Promise((r) => setTimeout(r, 4000))]);
  }
  await sb?.auth.signOut().catch(() => {});
  wipeLocalData();
  window.location.assign("/welcome");
}
