/** Paths anyone can open. Everything else needs a signed-in account. */
const PUBLIC_PREFIXES = ["/welcome", "/login", "/auth", "/pricing", "/terms", "/privacy", "/api", "/manifest.webmanifest", "/images"];

export function isPublicPath(pathname: string): boolean {
  return PUBLIC_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

/** Pages a signed-in person has no reason to see; send them into the app. */
export function isAuthPage(pathname: string): boolean {
  return pathname === "/welcome" || pathname === "/login";
}

const CONTROL_CHARS = /[\u0000-\u001f\u007f]/;
const CHECK_ORIGIN = "https://steen.invalid";

/**
 * Only allow same-site relative paths as post-login destinations.
 * Browsers drop tabs/newlines and read "\" as "/", so "/\evil.com" or "/\t/evil.com" would leave the site.
 * Returns the normalized path: "/..//evil.com" normalizes to "//evil.com", which Next would send as a
 * protocol-relative Location.
 */
export function safeNext(next: string | null | undefined, fallback = "/"): string {
  if (typeof next !== "string" || !next.startsWith("/") || next.startsWith("//")) return fallback;
  if (next.includes("\\") || CONTROL_CHARS.test(next)) return fallback;
  let url: URL;
  try {
    url = new URL(next, CHECK_ORIGIN);
  } catch {
    return fallback;
  }
  if (url.origin !== CHECK_ORIGIN || url.pathname.startsWith("//")) return fallback;
  return url.pathname + url.search + url.hash;
}
