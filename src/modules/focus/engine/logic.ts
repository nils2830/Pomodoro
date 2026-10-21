import { MINUTE } from "@/core/lib/time";
import type { TimerMode } from "../types";

export type TimerStatus = "idle" | "running" | "paused";

/** The serialisable core of the timer. Time is derived, never ticked down. */
export interface TimerCore {
  mode: TimerMode;
  /** Open-ended stopwatch variant of focus. */
  flow: boolean;
  status: TimerStatus;
  plannedMs: number;
  elapsedBeforeMs: number;
  runStartedAt: number | null;
  segmentStartedAt: number | null;
  pauses: number;
  /** Focus segments finished since the counter was reset; drives long breaks. */
  cycle: number;
  /** The "#3" shown in the UI: which focus round we're on. */
  round: number;
  reminderFired: boolean;
}

export function elapsedOf(t: Pick<TimerCore, "status" | "elapsedBeforeMs" | "runStartedAt">, now: number): number {
  const live = t.status === "running" && t.runStartedAt != null ? now - t.runStartedAt : 0;
  return t.elapsedBeforeMs + Math.max(0, live);
}

export function remainingOf(t: TimerCore, now: number): number {
  return Math.max(0, t.plannedMs - elapsedOf(t, now));
}

export function progressOf(t: TimerCore, now: number): number {
  if (t.flow && t.mode === "focus") return 0;
  return t.plannedMs > 0 ? Math.min(1, elapsedOf(t, now) / t.plannedMs) : 0;
}

/** When a running countdown will hit zero. */
export function endsAtOf(t: TimerCore): number | null {
  if (t.status !== "running" || t.runStartedAt == null || (t.flow && t.mode === "focus")) return null;
  return t.runStartedAt + (t.plannedMs - t.elapsedBeforeMs);
}

/** Classic cycle: every Nth finished focus earns a long break. */
export function nextModeAfter(mode: TimerMode, cycleAfter: number, longBreakInterval: number): TimerMode {
  if (mode !== "focus") return "focus";
  return cycleAfter > 0 && cycleAfter % Math.max(1, longBreakInterval) === 0 ? "long" : "short";
}

/** Flowtime-style break: a fifth of the focus time, between 3 and 30 minutes. */
export function flowBreakMs(elapsedMs: number): number {
  const minutes = Math.round(elapsedMs / 5 / MINUTE);
  return Math.min(30, Math.max(3, minutes)) * MINUTE;
}

/** Shortest segments worth keeping in the log. */
export const MIN_RECORD_MS = { focus: 60_000, break: 30_000 } as const;
