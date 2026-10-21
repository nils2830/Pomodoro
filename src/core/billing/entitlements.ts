"use client";

import { config } from "../config";
import { useAuth } from "../auth/store";
import { usePrefs } from "../prefs";
import { LIMITS, type Feature, type Plan } from "./plans";
import { isGrantActive } from "./grants";

export type ProSource = "subscription" | "gift" | "demo" | null;

/** Where Pro comes from, if anywhere. */
export function useProSource(): ProSource {
  const profilePlan = useAuth((s) => s.profile?.plan);
  const grant = useAuth((s) => s.grant);
  const demoPro = usePrefs((s) => s.doc.demoPro);
  if (profilePlan === "pro") return "subscription";
  if (isGrantActive(grant)) return "gift";
  if (config.demoProAllowed && demoPro) return "demo";
  return null;
}

export function usePlan(): Plan {
  return useProSource() ? "pro" : "free";
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
