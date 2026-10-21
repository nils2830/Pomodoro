"use client";

import { config } from "../config";
import { useAuth } from "../auth/store";
import { usePrefs } from "../prefs";
import { LIMITS, type Feature, type Plan } from "./plans";

export function usePlan(): Plan {
  const profilePlan = useAuth((s) => s.profile?.plan);
  const demoPro = usePrefs((s) => s.doc.demoPro);
  if (profilePlan === "pro") return "pro";
  if (config.demoProAllowed && demoPro) return "pro";
  return "free";
}

export function useIsPro(): boolean {
  return usePlan() === "pro";
}

/** Every feature in FEATURES is Pro-only; free features are simply ungated. */
export function useCan(_feature: Feature): boolean {
  return usePlan() === "pro";
}

export function useLimits() {
  return LIMITS[usePlan()];
}
