import { beforeEach, describe, expect, it, vi } from "vitest";

// The warm-up store reads settings and starts the timer; stand both in.
const startAfterWarmup = vi.fn();
const settings = { warmupSeconds: 90, warmupEyesClosed: true, warmupFirstStep: true };
vi.mock("../store/settings", () => ({ useFocusSettings: { getState: () => ({ doc: settings }) } }));
vi.mock("../store/timer", () => ({ useTimer: { getState: () => ({ startAfterWarmup, status: "idle", mode: "focus", toggle: vi.fn() }) } }));
vi.mock("../audio/synth", () => ({ unlockAudio: () => {} }));
vi.mock("@/core/data/entries", () => ({ useEntries: { getState: () => ({ items: {} }) } }));

const { useWarmup } = await import("./store");

describe("warm-up store", () => {
  beforeEach(() => {
    startAfterWarmup.mockClear();
    settings.warmupFirstStep = true;
    useWarmup.setState({ stage: "closed", plan: null, startedAt: null, preview: false, firstStep: "" });
  });

  it("asks for the first step, then runs, then starts focus with the warm-up length", () => {
    useWarmup.getState().open();
    expect(useWarmup.getState().stage).toBe("intent");
    useWarmup.getState().begin();
    expect(useWarmup.getState().stage).toBe("running");
    useWarmup.getState().complete();
    expect(useWarmup.getState().stage).toBe("closed");
    expect(startAfterWarmup).toHaveBeenCalledWith(90_000);
  });

  it("goes straight to the gaze when the first-step prompt is off", () => {
    settings.warmupFirstStep = false;
    useWarmup.getState().open();
    expect(useWarmup.getState().stage).toBe("running");
    expect(useWarmup.getState().startedAt).not.toBeNull();
  });

  it("ignores late calls once closed, so Cancel never turns into a session", () => {
    useWarmup.getState().open();
    useWarmup.getState().cancel();
    useWarmup.getState().skip();
    useWarmup.getState().complete();
    useWarmup.getState().begin();
    expect(useWarmup.getState().stage).toBe("closed");
    expect(startAfterWarmup).not.toHaveBeenCalled();
  });

  it("never starts focus after a preview", () => {
    useWarmup.getState().open({ preview: true });
    useWarmup.getState().begin();
    useWarmup.getState().complete();
    expect(startAfterWarmup).not.toHaveBeenCalled();
  });
});
