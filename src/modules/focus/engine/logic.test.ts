import { describe, expect, it } from "vitest";
import { MINUTE } from "@/core/lib/time";
import { elapsedOf, endsAtOf, flowBreakMs, nextModeAfter, progressOf, remainingOf, type TimerCore } from "./logic";
import { estimateRemaining } from "./estimate";

const base: TimerCore = {
  mode: "focus",
  flow: false,
  status: "idle",
  plannedMs: 25 * MINUTE,
  elapsedBeforeMs: 0,
  runStartedAt: null,
  segmentStartedAt: null,
  pauses: 0,
  cycle: 0,
  round: 1,
  reminderFired: false,
};

describe("timer maths", () => {
  it("derives elapsed time from timestamps, including paused stretches", () => {
    const t: TimerCore = { ...base, status: "running", runStartedAt: 1_000_000, elapsedBeforeMs: 5 * MINUTE };
    const now = 1_000_000 + 10 * MINUTE;
    expect(elapsedOf(t, now)).toBe(15 * MINUTE);
    expect(remainingOf(t, now)).toBe(10 * MINUTE);
    expect(progressOf(t, now)).toBeCloseTo(0.6);
    expect(endsAtOf(t)).toBe(1_000_000 + 20 * MINUTE);
  });

  it("does not advance while paused", () => {
    const t: TimerCore = { ...base, status: "paused", elapsedBeforeMs: 7 * MINUTE };
    expect(elapsedOf(t, Date.now())).toBe(7 * MINUTE);
    expect(endsAtOf(t)).toBeNull();
  });

  it("gives a long break every Nth focus", () => {
    expect(nextModeAfter("focus", 1, 4)).toBe("short");
    expect(nextModeAfter("focus", 4, 4)).toBe("long");
    expect(nextModeAfter("long", 4, 4)).toBe("focus");
  });

  it("sizes flow breaks to a fifth of the focus, clamped", () => {
    expect(flowBreakMs(50 * MINUTE)).toBe(10 * MINUTE);
    expect(flowBreakMs(5 * MINUTE)).toBe(3 * MINUTE);
    expect(flowBreakMs(300 * MINUTE)).toBe(30 * MINUTE);
  });
});

describe("estimateRemaining", () => {
  const durations = { focus: 25, short: 5, long: 15 };
  it("adds focus sessions and the breaks between them", () => {
    const ms = estimateRemaining({ sessions: 3, durations, longBreakInterval: 4, cycle: 0, mode: "focus", currentRemainingMs: 25 * MINUTE });
    expect(ms).toBe((25 * 3 + 5 * 2) * MINUTE);
  });
  it("uses a long break when the cycle reaches the interval", () => {
    const ms = estimateRemaining({ sessions: 2, durations, longBreakInterval: 4, cycle: 3, mode: "focus", currentRemainingMs: 10 * MINUTE });
    expect(ms).toBe((10 + 15 + 25) * MINUTE);
  });
});
