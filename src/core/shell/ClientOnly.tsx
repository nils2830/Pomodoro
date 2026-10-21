"use client";

import type { ReactNode } from "react";
import { useHydrated } from "../lib/useHydrated";

/** Renders children only after hydration (they read local data). */
export function ClientOnly({ children, fallback = null }: { children: ReactNode; fallback?: ReactNode }) {
  return useHydrated() ? <>{children}</> : <>{fallback}</>;
}
