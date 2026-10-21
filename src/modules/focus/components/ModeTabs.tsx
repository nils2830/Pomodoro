"use client";

import { Infinity as InfinityIcon } from "@phosphor-icons/react";
import { Segmented } from "@/core/ui/Segmented";
import { useCan } from "@/core/billing/entitlements";
import { useUI, confirmAction } from "@/core/ui/store";
import { useTimer } from "../store/timer";
import { elapsedOf } from "../engine/logic";

type Tab = "focus" | "short" | "long" | "flow";

export function ModeTabs({ className }: { className?: string }) {
  const mode = useTimer((s) => s.mode);
  const flow = useTimer((s) => s.flow);
  const canFlow = useCan("flow");
  const openUpgrade = useUI((s) => s.openUpgrade);
  const value: Tab = mode === "focus" && flow ? "flow" : mode;

  const go = async (tab: Tab) => {
    if (tab === value) return;
    const t = useTimer.getState();
    if (t.status !== "idle" && elapsedOf(t, Date.now()) > 5000) {
      const ok = await confirmAction({
        title: "Switch now?",
        body: "The current session will end. Time spent so far is kept if it's over a minute.",
        confirmLabel: "Switch",
      });
      if (!ok) return;
      t.finish(false);
    }
    if (tab === "flow") useTimer.getState().setFlow();
    else useTimer.getState().setMode(tab);
  };

  return (
    <Segmented<Tab>
      ariaLabel="Timer mode"
      className={className}
      value={value}
      onChange={go}
      onLocked={() => openUpgrade("flow")}
      options={[
        { value: "focus", label: "Focus" },
        {
          value: "short",
          label: (
            <>
              <span className="sm:hidden">Short</span>
              <span className="hidden sm:inline">Short break</span>
            </>
          ),
        },
        {
          value: "long",
          label: (
            <>
              <span className="sm:hidden">Long</span>
              <span className="hidden sm:inline">Long break</span>
            </>
          ),
        },
        { value: "flow", label: "Flow", icon: <InfinityIcon size={15} weight="bold" />, locked: !canFlow, title: "Open-ended stopwatch" },
      ]}
    />
  );
}
