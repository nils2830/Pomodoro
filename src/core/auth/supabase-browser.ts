"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { config } from "../config";

let client: SupabaseClient | null = null;

/** Browser Supabase client, or null when accounts are not configured. */
export function getSupabase(): SupabaseClient | null {
  if (!config.supabase.enabled) return null;
  client ??= createBrowserClient(config.supabase.url, config.supabase.anonKey);
  return client;
}
