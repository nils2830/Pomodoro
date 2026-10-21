"use client";

import { useTimer } from "../store/timer";
import { useFocusSettings } from "../store/settings";
import { useNow } from "@/core/lib/useNow";
import { progressOf } from "../engine/logic";

/** Thin progress hairline under the top bar. Hidden with the timer. */
export function ProgressLine() {
  const timer = useTimer();
  const hidden = useFocusSettings((s) => s.doc.hideTimer);
  const now = useNow(timer.status === "running" ? 1000 : null);
  const isFlow = timer.flow && timer.mode === "focus";
  if (hidden || isFlow || timer.status === "idle") return <div className="h-[3px]" />;
  const p = progressOf(timer, now);
  return (
    <div className="mx-auto h-[3px] w-full max-w-[1320px] px-4 sm:px-6" aria-hidden>
      <div className="h-full overflow-hidden rounded-full bg-ink/12">
        <div className="h-full rounded-full bg-accent transition-[width] duration-1000 ease-linear" style={{ width: `${p * 100}%` }} />
      </div>
    </div>
  );
}
