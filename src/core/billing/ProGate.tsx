"use client";

import type { ReactNode } from "react";
import { LockSimple } from "@phosphor-icons/react";
import { useCan } from "./entitlements";
import { useUI } from "../ui/store";
import { FEATURES, type Feature } from "./plans";
import { cn } from "../lib/cn";

/**
 * Renders children for Pro users. For free users the children are shown
 * blurred and inert behind an unlock card, so the value is visible.
 */
export function ProGate({ feature, children, className, compact }: { feature: Feature; children: ReactNode; className?: string; compact?: boolean }) {
  const can = useCan(feature);
  const openUpgrade = useUI((s) => s.openUpgrade);
  if (can) return <>{children}</>;
  const f = FEATURES[feature];
  return (
    <div className={cn("relative isolate", className)}>
      <div aria-hidden inert className="pointer-events-none blur-[6px] saturate-50 select-none">
        {children}
      </div>
      <div className="absolute inset-0 z-10 grid place-items-center p-4">
        <button
          type="button"
          onClick={() => openUpgrade(feature)}
          className={cn(
            "group flex max-w-[320px] items-center gap-3 rounded-[22px] bg-raised text-left shadow-[0_18px_50px_-18px_rgb(0_0_0/0.4)] ring-1 ring-line transition-transform hover:-translate-y-0.5",
            compact ? "px-4 py-3" : "px-5 py-4",
          )}
        >
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-ink text-page">
            <LockSimple size={18} weight="bold" />
          </span>
          <span>
            <span className="block text-[15px] font-semibold">{f.label}</span>
            {!compact && <span className="mt-0.5 block text-[13px] leading-snug text-ink-3">{f.detail}</span>}
            <span className="mt-1 block text-[13px] font-medium text-ink underline decoration-ink/30 underline-offset-4 group-hover:decoration-ink">
              Unlock with Pro
            </span>
          </span>
        </button>
      </div>
    </div>
  );
}
