"use client";

import { createDocument } from "./data/document";
import type { HourFormat } from "./lib/time";
import type { WeekStart } from "./lib/date";

/** App-wide preferences that are not specific to one module. */
export interface Prefs {
  appearance: "system" | "light" | "dark";
  hourFormat: HourFormat;
  weekStart: WeekStart;
  /** Typeface id from core/theme/fonts. */
  font: string;
  /** Local-only Pro switch for development when billing is not configured. */
  demoPro: boolean;
  /** What Steen calls you. Empty until asked. */
  name: string;
  /** The name question was answered or skipped. */
  nameAsked: boolean;
  /** Interface language; "auto" follows the browser. */
  language: "auto" | "en" | "da";
  /** The "welcome to Pro" moment has been shown for this account. */
  proWelcomed: boolean;
  /** The intro tour was taken or declined. */
  tourDone: boolean;
  /** The background suggestion above Tasks was used or closed. */
  bgNudgeDone: boolean;
}

export const usePrefs = createDocument<Prefs>("prefs", {
  appearance: "system",
  hourFormat: "24h",
  weekStart: 1,
  font: "geologica",
  demoPro: false,
  name: "",
  nameAsked: false,
  language: "en",
  proWelcomed: false,
  tourDone: false,
  bgNudgeDone: false,
});
