import { formatClock, formatElapsed, MINUTE } from "@/core/lib/time";
import { cn } from "@/core/lib/cn";
import type { FaceProps } from "./types";

/** The classic countdown. Tabular figures keep the numerals from jittering. */
export function Digits(p: FaceProps) {
  const isFlow = p.flow && p.mode === "focus";
  const ms = isFlow ? p.elapsedMs : p.remainingMs;
  const full = isFlow ? formatElapsed(ms) : formatClock(ms);
  const long = full.length > 5;

  if (!p.showSeconds && !isFlow) {
    const minutes = Math.max(0, Math.ceil(ms / MINUTE));
    return (
      <div className="flex items-baseline gap-3">
        <span className="timer-digits text-[min(34cqw,74cqh)]">{minutes}</span>
        <span className="display text-[min(6cqw,12cqh)] text-ink-2">min</span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "timer-digits whitespace-nowrap transition-opacity duration-500 select-none",
        long ? "text-[min(20cqw,50cqh)]" : "text-[min(30cqw,74cqh)]",
        p.status === "paused" && "opacity-55",
      )}
    >
      {full}
    </div>
  );
}
