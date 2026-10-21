import { MINUTE } from "@/core/lib/time";
import type { TimerMode } from "../types";

/**
 * How long until the remaining estimated sessions are done,
 * including the breaks between them.
 */
export function estimateRemaining(opts: {
  sessions: number;
  durations: Record<TimerMode, number>;
  longBreakInterval: number;
  cycle: number;
  mode: TimerMode;
  /** Time left on the current segment. */
  currentRemainingMs: number;
}): number {
  const { sessions, durations, longBreakInterval, mode, currentRemainingMs } = opts;
  if (sessions <= 0) return 0;
  const focus = durations.focus * MINUTE;
  let total = mode === "focus" ? 0 : currentRemainingMs;
  let cycle = opts.cycle;
  for (let i = 0; i < sessions; i++) {
    total += i === 0 && mode === "focus" ? currentRemainingMs : focus;
    cycle += 1;
    if (i < sessions - 1) total += (cycle % Math.max(1, longBreakInterval) === 0 ? durations.long : durations.short) * MINUTE;
  }
  return total;
}
