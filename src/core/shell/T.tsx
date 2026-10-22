"use client";

import { useT } from "../i18n";

/** Translated text for server components, which can't call useT() themselves. */
export function T({ children, vars }: { children: string; vars?: Record<string, string | number> }) {
  const t = useT();
  return <>{t(children, vars)}</>;
}
