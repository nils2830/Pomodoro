import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { isAuthPage, isPublicPath } from "@/core/auth/routes";

/**
 * Runs before every page request:
 * - keeps Supabase auth cookies fresh,
 * - sends signed-out visitors to the welcome page (the app needs an account),
 * - sends signed-in people past the welcome and sign-in pages.
 * With accounts not configured (local development) everything stays open.
 */
export async function proxy(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return NextResponse.next();

  let response = NextResponse.next({ request });
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (list) => {
        list.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        list.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  const { pathname, search } = request.nextUrl;
  // If Supabase itself is unreachable, don't lock people out; the client re-checks.
  const authDown = !user && error && (error.status === undefined || error.status >= 500) && error.name !== "AuthSessionMissingError";

  const redirect = (to: URL) => {
    const res = NextResponse.redirect(to);
    response.cookies.getAll().forEach((c) => res.cookies.set(c));
    return res;
  };

  if (!user && !authDown && !isPublicPath(pathname)) {
    const to = new URL("/welcome", request.url);
    if (pathname !== "/") to.searchParams.set("next", pathname + search);
    return redirect(to);
  }
  if (user && isAuthPage(pathname)) {
    const next = request.nextUrl.searchParams.get("next");
    return redirect(new URL(next && next.startsWith("/") && !next.startsWith("//") ? next : "/", request.url));
  }
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|icon.svg|favicon.ico|api/billing/webhook|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|woff2?|webmanifest|txt|xml)$).*)"],
};
