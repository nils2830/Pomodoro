"use client";

import { useEffect } from "react";
import { config } from "../config";
import { getSupabase } from "./supabase-browser";
import { useAuth, type Profile } from "./store";

async function loadProfile(userId: string): Promise<Profile | null> {
  const sb = getSupabase();
  if (!sb) return null;
  const { data } = await sb.from("profiles").select("*").eq("id", userId).maybeSingle();
  return (data as Profile | null) ?? null;
}

/** Keeps the auth store in sync with Supabase. Renders nothing. */
export function AuthProvider() {
  useEffect(() => {
    const { set } = useAuth.getState();
    const sb = getSupabase();
    if (!config.supabase.enabled || !sb) {
      set({ status: "disabled", user: null, profile: null });
      return;
    }

    let cancelled = false;
    const apply = async (user: import("@supabase/supabase-js").User | null) => {
      if (!user) {
        set({ status: "signedOut", user: null, profile: null });
        return;
      }
      set({ status: "signedIn", user });
      const profile = await loadProfile(user.id);
      if (!cancelled) set({ profile });
    };

    sb.auth.getUser().then(({ data }) => apply(data.user ?? null));
    const { data: sub } = sb.auth.onAuthStateChange((_event, session) => {
      apply(session?.user ?? null);
    });

    // Plans change through the Stripe webhook; refresh when the tab returns.
    const onFocus = () => {
      const user = useAuth.getState().user;
      if (user) loadProfile(user.id).then((profile) => !cancelled && set({ profile }));
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
