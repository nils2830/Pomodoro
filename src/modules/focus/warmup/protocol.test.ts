import { describe, expect, it } from "vitest";
import { SITDOWN_GAP_MS, clampWarmupSeconds, needsWarmup, phaseAt, phaseLength, planWarmup } from "./protocol";

describe("planWarmup", () => {
  it("fills the chosen length exactly, phases back to back", () => {
    for (const seconds of [30, 60, 90, 120, 180]) {
      for (const eyesClosed of [true, false]) {
        const plan = planWarmup(seconds, eyesClosed);
        expect(plan.totalMs).toBe(seconds * 1000);
        expect(plan.phases[0].startMs).toBe(0);
        expect(plan.phases.at(-1)!.endMs).toBe(plan.totalMs);
        plan.phases.slice(1).forEach((p, i) => expect(p.startMs).toBe(plan.phases[i].endMs));
      }
    }
  });

  it("matches the standard split: 10 s settle, about a minute on the dot, 20 s closed, 5 s open", () => {
    const plan = planWarmup(90, true);
    expect(plan.phases.map((p) => p.id)).toEqual(["settle", "fixate", "close", "open"]);
    expect(phaseLength(plan, "settle")).toBe(10_000);
    expect(phaseLength(plan, "fixate")).toBe(56_000);
    expect(phaseLength(plan, "close")).toBe(19_000);
    expect(phaseLength(plan, "open")).toBe(5_000);
  });

  it("uses a shorter settle on the quick preset and still leaves a gaze", () => {
    const plan = planWarmup(30, true);
    expect(phaseLength(plan, "settle")).toBe(5_000);
    expect(phaseLength(plan, "fixate")).toBe(15_000);
    expect(phaseLength(plan, "close")).toBe(5_000);
  });

  it("keeps every gaze at or under three minutes", () => {
    expect(phaseLength(planWarmup(180, false), "fixate")).toBeLessThanOrEqual(180_000);
    expect(phaseLength(planWarmup(10_000, true), "fixate")).toBeLessThanOrEqual(180_000);
  });

  it("drops the eyes-closed phase when it's turned off", () => {
    const plan = planWarmup(60, false);
    expect(plan.phases.map((p) => p.id)).toEqual(["settle", "fixate", "open"]);
  });
});

describe("phaseAt", () => {
  const plan = planWarmup(90, true);
  it("finds the phase for a moment in the warm-up", () => {
    expect(phaseAt(plan, 0).id).toBe("settle");
    expect(phaseAt(plan, 9_999).id).toBe("settle");
    expect(phaseAt(plan, 10_000).id).toBe("fixate");
    expect(phaseAt(plan, 66_000).id).toBe("close");
    expect(phaseAt(plan, 85_000).id).toBe("open");
  });
  it("stays on the last phase past the end", () => {
    expect(phaseAt(plan, 1e9).id).toBe("open");
  });
});

describe("clampWarmupSeconds", () => {
  it("keeps the length between 30 s and 3 min", () => {
    expect(clampWarmupSeconds(5)).toBe(30);
    expect(clampWarmupSeconds(600)).toBe(180);
    expect(clampWarmupSeconds(Number.NaN)).toBe(90);
  });
});

describe("needsWarmup", () => {
  const now = 1_000_000_000;
  it("warms up before the first session of a sit-down", () => {
    expect(needsWarmup("sitdown", null, now)).toBe(true);
    expect(needsWarmup("sitdown", now - SITDOWN_GAP_MS - 1, now)).toBe(true);
  });
  it("skips it for back-to-back rounds", () => {
    expect(needsWarmup("sitdown", now - 5 * 60_000, now)).toBe(false);
  });
  it("respects always and off", () => {
    expect(needsWarmup("always", now - 1000, now)).toBe(true);
    expect(needsWarmup("off", null, now)).toBe(false);
  });
});
