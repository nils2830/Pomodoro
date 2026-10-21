/** Paths anyone can open. Everything else needs a signed-in account. */
const PUBLIC_PREFIXES = ["/welcome", "/login", "/auth", "/pricing", "/terms", "/privacy", "/api", "/manifest.webmanifest", "/images"];

export function isPublicPath(pathname: string): boolean {
  return PUBLIC_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

/** Pages a signed-in person has no reason to see; send them into the app. */
export function isAuthPage(pathname: string): boolean {
  return pathname === "/welcome" || pathname === "/login";
}

/** Only allow same-site relative paths as post-login destinations. */
export function safeNext(next: string | null | undefined, fallback = "/"): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return fallback;
  return next;
}
