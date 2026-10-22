"use client";

import { useEffect } from "react";
import { usePrefs } from "../prefs";
import { useHydrated } from "../lib/useHydrated";
import { DA } from "./da";

export type Locale = "en" | "da";
type Vars = Record<string, string | number>;

/**
 * Translation: write the English text, wrap it in t(). Danish lives in
 * ./da, keyed by that same English text, so anything not yet translated
 * simply shows in English. Placeholders look like {name}.
 */
export function resolveLocale(pref: "auto" | Locale | undefined): Locale {
  if (pref === "da" || pref === "en") return pref;
  if (typeof navigator !== "undefined" && /^(da|nb|nn|no)\b/i.test(navigator.language)) return "da";
  return "en";
}

function fill(text: string, vars?: Vars): string {
  return vars ? text.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k]) : m)) : text;
}

function translate(locale: Locale, text: string, vars?: Vars): string {
  return fill(locale === "da" ? (DA[text] ?? text) : text, vars);
}

/** The current language, outside React (stores, toasts, pure helpers). */
export function currentLocale(): Locale {
  return typeof window === "undefined" ? "en" : resolveLocale(usePrefs.getState().doc.language);
}

/** Translate outside React. Inside components, prefer useT() so text updates when the language changes. */
export function t(text: string, vars?: Vars): string {
  return translate(currentLocale(), text, vars);
}

/** BCP 47 tag for dates and numbers in the current language. */
export function localeTag(locale: Locale = currentLocale()): string {
  return locale === "da" ? "da-DK" : "en-GB";
}

/** The language for rendering. English until hydrated, so server and client HTML match. */
export function useLocale(): Locale {
  const pref = usePrefs((s) => s.doc.language);
  const hydrated = useHydrated();
  return hydrated ? resolveLocale(pref) : "en";
}

/** t() bound to the current language; components re-render when it changes. */
export function useT(): (text: string, vars?: Vars) => string {
  const locale = useLocale();
  return (text, vars) => translate(locale, text, vars);
}

/** Keeps <html lang> in step with the chosen language. Mount once. */
export function useDocumentLang(): void {
  const locale = useLocale();
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);
}
