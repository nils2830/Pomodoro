"use client";

import { useEffect, useState } from "react";
import { create } from "zustand";
import { useEntries, type Entry } from "@/core/data/entries";
import { unlockAudio } from "../audio/synth";
import { useFocusSettings } from "../store/settings";
import { useTimer } from "../store/timer";
import { needsWarmup, planWarmup, type WarmupPlan } from "./protocol";

type Stage = "closed" | "intent" | "running";

interface WarmupState {
  stage: Stage;
  plan: WarmupPlan | null;
  startedAt: number | null;
  /** The first small step the person named, shown again at the end. */
  firstStep: string;
  /** A try-out from settings: nothing starts afterwards. */
  preview: boolean;
  open(opts?: { preview?: boolean }): void;
  setFirstStep(text: string): void;
  begin(): void;
  /** Ran to the end: start focus. */
  complete(): void;
  /** Leave early but still start focus. */
  skip(): void;
  /** Leave without starting anything. */
  cancel(): void;
}

const elapsed = (s: WarmupState) => (s.startedAt == null ? 0 : Date.now() - s.startedAt);

export const useWarmup = create<WarmupState>()((set, get) => {
  const close = (startFocus: boolean, warmupMs: number) => {
    const preview = get().preview;
    set({ stage: "closed", plan: null, startedAt: null, preview: false });
    if (startFocus && !preview) useTimer.getState().startAfterWarmup(warmupMs);
  };

  return {
    stage: "closed",
    plan: null,
    startedAt: null,
    firstStep: "",
    preview: false,

    open: (opts) => {
      unlockAudio();
      const s = useFocusSettings.getState().doc;
      set({ preview: Boolean(opts?.preview), firstStep: "", plan: planWarmup(s.warmupSeconds, s.warmupEyesClosed), startedAt: null });
      if (s.warmupFirstStep) set({ stage: "intent" });
      else get().begin();
    },

    setFirstStep: (text) => set({ firstStep: text.slice(0, 140) }),

    begin: () => set({ stage: "running", startedAt: Date.now() }),

    complete: () => close(true, get().plan?.totalMs ?? 0),

    skip: () => {
      const s = get();
      close(true, s.stage === "running" ? Math.min(elapsed(s), s.plan?.totalMs ?? 0) : 0);
    },

    cancel: () => close(false, 0),
  };
});

/** When the most recent focus session ended, from the log. */
function lastFocusEndedAt(items: Record<string, Entry> = useEntries.getState().items): number | null {
  let last: number | null = null;
  for (const e of Object.values(items)) {
    if (e.deletedAt || e.kind !== "focus") continue;
    if (last == null || e.endedAt > last) last = e.endedAt;
  }
  return last;
}

export function shouldWarmUp(now = Date.now()): boolean {
  const t = useTimer.getState();
  if (t.status !== "idle" || t.mode !== "focus") return false;
  return needsWarmup(useFocusSettings.getState().doc.warmupWhen, lastFocusEndedAt(), now);
}

/**
 * What Start (and Space) does: a fresh focus session that opens a sit-down
 * begins with the warm-up; everything else (resume, pause, breaks) toggles.
 */
export function requestStartToggle(): void {
  if (useWarmup.getState().stage !== "closed") return;
  if (shouldWarmUp()) useWarmup.getState().open();
  else useTimer.getState().toggle();
}

/** The warm-up length (seconds) that pressing Start would begin with right now, or null. */
export function usePendingWarmup(): number | null {
  const when = useFocusSettings((s) => s.doc.warmupWhen);
  const seconds = useFocusSettings((s) => s.doc.warmupSeconds);
  const idleFocus = useTimer((s) => s.status === "idle" && s.mode === "focus");
  const last = useEntries((s) => lastFocusEndedAt(s.items));
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(id);
  }, []);
  return idleFocus && needsWarmup(when, last, now) ? seconds : null;
}
