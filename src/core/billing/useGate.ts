"use client";

import { useCallback } from "react";
import { useUI } from "../ui/store";
import { usePlan } from "./entitlements";
import type { Feature } from "./plans";

/** Returns guard(feature, action): runs the action on Pro, otherwise opens the upgrade dialog. */
export function useGate() {
  const plan = usePlan();
  const openUpgrade = useUI((s) => s.openUpgrade);
  return useCallback(
    (feature: Feature, action?: () => void) => {
      if (plan === "pro") {
        action?.();
        return true;
      }
      openUpgrade(feature);
      return false;
    },
    [plan, openUpgrade],
  );
}
