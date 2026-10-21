import { NextResponse } from "next/server";
import { getServerSupabase } from "@/core/auth/supabase-server";
import { safeNext } from "@/core/auth/routes";

/** Finishes magic-link and OAuth (Google, Apple) sign-ins. */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const next = safeNext(url.searchParams.get("next"));
  const fail = (reason: string) => {
    const to = new URL("/login", url.origin);
    to.searchParams.set("error", reason.slice(0, 300));
    if (next !== "/") to.searchParams.set("next", next);
    return NextResponse.redirect(to);
  };

  // Providers report problems as ?error=...&error_description=...
  const providerError = url.searchParams.get("error_description") || url.searchParams.get("error");
  if (providerError) return fail(providerError);

  const code = url.searchParams.get("code");
  const supabase = await getServerSupabase();
  if (!supabase) return fail("Accounts are not configured on this site.");
  if (!code) return fail("The sign-in link is missing its code. Try again.");

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) return fail(error.message);
  return NextResponse.redirect(new URL(next, url.origin));
}
