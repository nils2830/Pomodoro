import { NextResponse } from "next/server";
import { config } from "@/core/config";

export const revalidate = 60;

/**
 * Which sign-in methods are switched on in Supabase. Read from Supabase's
 * public settings endpoint, so the sign-in page can explain a provider that
 * hasn't been set up instead of sending people to an error page.
 */
export async function GET() {
  if (!config.supabase.enabled) return NextResponse.json({ configured: false, email: false, google: false, apple: false });
  try {
    const res = await fetch(`${config.supabase.url}/auth/v1/settings`, {
      headers: { apikey: config.supabase.anonKey },
      next: { revalidate: 60 },
    });
    if (!res.ok) throw new Error(String(res.status));
    const s = (await res.json()) as { external?: Record<string, boolean>; disable_signup?: boolean };
    return NextResponse.json({
      configured: true,
      email: Boolean(s.external?.email),
      google: Boolean(s.external?.google),
      apple: Boolean(s.external?.apple),
      signupsOpen: !s.disable_signup,
    });
  } catch {
    return NextResponse.json({ configured: true, unknown: true, email: true, google: true, apple: true });
  }
}
