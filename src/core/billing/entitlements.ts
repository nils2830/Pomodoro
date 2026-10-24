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

/**
 * Whether the next checkout starts with a free trial: only for people who have
 * never had a subscription. The server decides for real; this is for the copy.
 */
export function useTrialEligible(): boolean {
  const status = useAuth((s) => s.status);
  const planStatus = useAuth((s) => s.profile?.plan_status ?? null);
  return config.billingEnabled && (status !== "signedIn" || planStatus === null);
}
