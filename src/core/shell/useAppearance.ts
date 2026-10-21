"use client";

import { useEffect } from "react";
import { usePrefs } from "../prefs";

/** Resolves the appearance preference onto <html data-theme>. */
export function useAppearance() {
  const appearance = usePrefs((s) => s.doc.appearance);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => {
      const dark = appearance === "dark" || (appearance === "system" && mq.matches);
      document.documentElement.dataset.theme = dark ? "dark" : "light";
    };
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, [appearance]);
}

/** Inline script for <head>: sets data-theme before first paint. */
export const APPEARANCE_SCRIPT = `(function(){try{var p=JSON.parse(localStorage.getItem('cadence:prefs')||'{}');var a=(p.state&&p.state.doc&&p.state.doc.appearance)||'system';var d=a==='dark'||(a==='system'&&matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.dataset.theme=d?'dark':'light';}catch(e){}})();`;
