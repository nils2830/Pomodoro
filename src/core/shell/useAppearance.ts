"use client";

import { useEffect } from "react";
import { usePrefs } from "../prefs";
import { FONTS, getFont } from "../theme/fonts";

/** Resolves appearance and font preferences onto <html>. */
export function useAppearance() {
  const appearance = usePrefs((s) => s.doc.appearance);
  const font = usePrefs((s) => s.doc.font);

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

  useEffect(() => {
    document.documentElement.style.setProperty("--font-user", getFont(font).family);
  }, [font]);
}

const fontMap = Object.fromEntries(FONTS.map((f) => [f.id, f.family]));

/**
 * Inline script for <head>, runs before first paint:
 * 1. moves data saved under the old "cadence:" names to "steen:",
 * 2. applies light/dark and the chosen font so nothing flashes.
 */
export const BOOT_SCRIPT = `(function(){try{
var ls=localStorage;for(var i=ls.length-1;i>=0;i--){var k=ls.key(i);if(k&&k.indexOf('cadence:')===0){var n='steen:'+k.slice(8);if(ls.getItem(n)===null)ls.setItem(n,ls.getItem(k));ls.removeItem(k);}}
var p=JSON.parse(ls.getItem('steen:prefs')||'{}');var doc=(p.state&&p.state.doc)||{};var a=doc.appearance||'system';
var d=a==='dark'||(a==='system'&&matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.dataset.theme=d?'dark':'light';
var f=${JSON.stringify(fontMap)}[doc.font];if(f)document.documentElement.style.setProperty('--font-user',f);
}catch(e){}})();`;
