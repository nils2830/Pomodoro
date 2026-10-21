import "server-only";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { config } from "../config";

/** Supabase client bound to the request's auth cookies. */
export async function getServerSupabase(): Promise<SupabaseClient | null> {
  if (!config.supabase.enabled) return null;
  const cookieStore = await cookies();
  return createServerClient(config.supabase.url, config.supabase.anonKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (list) => {
        try {
          for (const { name, value, options } of list) cookieStore.set(name, value, options);
        } catch {
          // Called from a Server Component; the proxy refreshes cookies instead.
        }
      },
    },
  });
}

/** Service-role client for trusted server work (webhooks). Bypasses RLS. */
export function getAdminSupabase(): SupabaseClient | null {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!config.supabase.enabled || !key) return null;
  return createClient(config.supabase.url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
