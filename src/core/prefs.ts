"use client";

import { createDocument } from "./data/document";
import type { HourFormat } from "./lib/time";
import type { WeekStart } from "./lib/date";

/** App-wide preferences that are not specific to one module. */
export interface Prefs {
  appearance: "system" | "light" | "dark";
  hourFormat: HourFormat;
  weekStart: WeekStart;
  /** Local-only Pro switch for development when billing is not configured. */
  demoPro: boolean;
}

export const usePrefs = createDocument<Prefs>("prefs", {
  appearance: "system",
  hourFormat: "24h",
  weekStart: 1,
  demoPro: false,
});
