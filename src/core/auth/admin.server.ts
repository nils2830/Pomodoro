import "server-only";
import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getAdminSupabase, getServerSupabase } from "./supabase-server";

/** Admins come from the ADMIN_EMAILS env var (comma-separated), never from the client. */
export function adminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

type AdminCheck = { ok: true; email: string; db: SupabaseClient } | { ok: false; response: NextResponse };

/** Verifies the signed-in user is an admin and returns a service-role client. */
export async function requireAdmin(): Promise<AdminCheck> {
  const supabase = await getServerSupabase();
  const db = getAdminSupabase();
  if (!supabase || !db) return { ok: false, response: NextResponse.json({ error: "Accounts are not configured." }, { status: 501 }) };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, response: NextResponse.json({ error: "Please sign in." }, { status: 401 }) };

  const email = user.email?.toLowerCase();
  if (!email || !user.email_confirmed_at || !adminEmails().includes(email)) {
    return { ok: false, response: NextResponse.json({ error: "Not allowed." }, { status: 403 }) };
  }
  return { ok: true, email, db };
}
