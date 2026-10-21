"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "./store";

/**
 * The app needs an account. The proxy already redirects signed-out page
 * loads; this catches the rest (a session that expires or a sign-out in
 * another tab) by sending the visitor to the welcome page.
 */
export function AuthGate() {
  const status = useAuth((s) => s.status);
  const pathname = usePathname();
  useEffect(() => {
    if (status !== "signedOut") return;
    const next = pathname && pathname !== "/" ? `?next=${encodeURIComponent(pathname)}` : "";
    window.location.replace(`/welcome${next}`);
  }, [status, pathname]);
  return null;
}
