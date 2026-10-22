"use client";

import { Infinity as InfinityIcon } from "@phosphor-icons/react";
import { Segmented } from "@/core/ui/Segmented";
import { useCan } from "@/core/billing/entitlements";
import { useUI, confirmAction } from "@/core/ui/store";
import { useT } from "@/core/i18n";
import { useTimer } from "../store/timer";
import { elapsedOf } from "../engine/logic";

type Tab = "focus" | "short" | "long" | "flow";

export function ModeTabs({ className }: { className?: string }) {
  const mode = useTimer((s) => s.mode);
  const flow = useTimer((s) => s.flow);
  const canFlow = useCan("flow");
  const openUpgrade = useUI((s) => s.openUpgrade);
  const tr = useT();
  const value: Tab = mode === "focus" && flow ? "flow" : mode;

  const go = async (tab: Tab) => {
    if (tab === value) return;
    const t = useTimer.getState();
    if (t.status !== "idle" && elapsedOf(t, Date.now()) > 5000) {
      const ok = await confirmAction({
        title: tr("Switch now?"),
        body: tr("The current session will end. Time spent so far is kept if it's over a minute."),
        confirmLabel: tr("Switch"),
      });
      if (!ok) return;
      t.finish(false);
    }
    if (tab === "flow") useTimer.getState().setFlow();
    else useTimer.getState().setMode(tab);
  };

  return (
    <Segmented<Tab>
      ariaLabel={tr("Timer mode")}
      className={className}
      value={value}
      onChange={go}
      onLocked={() => openUpgrade("flow")}
      options={[
        { value: "focus", label: tr("Focus") },
        {
          value: "short",
          label: (
            <>
              <span className="sm:hidden">{tr("Short")}</span>
              <span className="hidden sm:inline">{tr("Short break")}</span>
            </>
          ),
        },
        {
          value: "long",
          label: (
            <>
              <span className="sm:hidden">{tr("Long")}</span>
              <span className="hidden sm:inline">{tr("Long break")}</span>
            </>
          ),
        },
        { value: "flow", label: tr("Flow"), icon: <InfinityIcon size={15} weight="bold" />, locked: !canFlow, title: tr("Open-ended stopwatch") },
      ]}
    />
  );
}
