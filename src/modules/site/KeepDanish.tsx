"use client";

import { useEffect } from "react";
import { usePrefs } from "@/core/prefs";

/** Someone who signs up from the Danish page gets the app in Danish too. */
export function KeepDanish() {
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if ((e.target as Element | null)?.closest?.('a[href^="/login"]')) usePrefs.getState().set({ language: "da" });
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);
  return null;
}
