import { formatClock, formatElapsed, MINUTE } from "@/core/lib/time";
import { cn } from "@/core/lib/cn";
import type { FaceProps } from "./types";

/** Fixed-width cells keep the numerals from jittering as they change. */
function Cells({ text }: { text: string }) {
  return (
    <span className="inline-flex">
      {text.split("").map((ch, i) => (
        <span key={i} className={cn("inline-block text-center", ch === ":" ? "w-[0.24em] -translate-y-[0.05em]" : "w-[0.47em]")}>
          {ch}
        </span>
      ))}
    </span>
  );
}

export function Digits(p: FaceProps) {
  const isFlow = p.flow && p.mode === "focus";
  const ms = isFlow ? p.elapsedMs : p.remainingMs;
  const full = isFlow ? formatElapsed(ms) : formatClock(ms);
  const long = full.length > 5;

  if (!p.showSeconds && !isFlow) {
    const minutes = Math.max(0, Math.ceil(ms / MINUTE));
    return (
      <div className="flex items-baseline gap-3">
        <span className="timer-digits text-[min(36cqw,72cqh)]">
          <Cells text={String(minutes)} />
        </span>
        <span className="display text-[min(6cqw,12cqh)] text-ink-2">min</span>
      </div>
    );
  }

  return (
    <div className={cn("timer-digits select-none", long ? "text-[min(25cqw,58cqh)]" : "text-[min(36cqw,78cqh)]", p.status === "paused" && "opacity-60")}>
      <Cells text={full} />
    </div>
  );
}
