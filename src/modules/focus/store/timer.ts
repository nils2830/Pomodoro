"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { MINUTE } from "@/core/lib/time";
import { useEntries } from "@/core/data/entries";
import type { TimerMode } from "../types";
import { useFocusSettings } from "./settings";
import { DEFAULT_ACTIVITY_ID, useTasks } from "./data";
import { elapsedOf, flowBreakMs, nextModeAfter, MIN_RECORD_MS, type TimerCore } from "../engine/logic";
import { timerEvents } from "../engine/events";
import { unlockAudio } from "../audio/synth";

interface TimerState extends TimerCore {
  /** Warm-up before this segment, logged with the session. */
  warmupMs: number;
  activityId: string;
  activeTaskId: string | null;
  setMode(mode: TimerMode): void;
  setFlow(): void;
  start(): void;
  /** Starts focus straight after a warm-up and remembers how long it was. */
  startAfterWarmup(warmupMs: number): void;
  pause(): void;
  toggle(): void;
  reset(): void;
  skip(): void;
  /** Ends the segment. completed=false records it as interrupted. */
  finish(completed: boolean, at?: number): void;
  extend(ms: number): void;
  syncDurations(): void;
  resetRound(): void;
  setActivity(id: string): void;
  setActiveTask(id: string | null): void;
}

const plannedFor = (mode: TimerMode) => useFocusSettings.getState().doc.durations[mode] * MINUTE;

const fresh = (mode: TimerMode, plannedMs: number) => ({
  mode,
  status: "idle" as const,
  plannedMs,
  elapsedBeforeMs: 0,
  runStartedAt: null,
  segmentStartedAt: null,
  pauses: 0,
  reminderFired: false,
  warmupMs: 0,
});

export const useTimer = create<TimerState>()(
  persist(
    (set, get) => ({
      ...fresh("focus", 25 * MINUTE),
      flow: false,
      cycle: 0,
      round: 1,
      activityId: DEFAULT_ACTIVITY_ID,
      activeTaskId: null,

      setMode: (mode) => set({ ...fresh(mode, plannedFor(mode)), flow: false }),

      setFlow: () => set({ ...fresh("focus", 0), flow: true }),

      start: () => {
        unlockAudio();
        const now = Date.now();
        set((s) => (s.status === "running" ? s : { status: "running", runStartedAt: now, segmentStartedAt: s.segmentStartedAt ?? now }));
      },

      startAfterWarmup: (warmupMs) => {
        if (get().status !== "idle") return;
        set({ warmupMs: Math.max(0, Math.round(warmupMs)) });
        get().start();
      },

      pause: () => {
        const s = get();
        if (s.status !== "running") return;
        const now = Date.now();
        set({ status: "paused", elapsedBeforeMs: elapsedOf(s, now), runStartedAt: null, pauses: s.pauses + 1 });
      },

      toggle: () => (get().status === "running" ? get().pause() : get().start()),

      reset: () => {
        const s = get();
        set(fresh(s.mode, s.flow && s.mode === "focus" ? 0 : plannedFor(s.mode)));
      },

      skip: () => get().finish(false),

      finish: (completed, at) => {
        const s = get();
        const now = at ?? Date.now();
        const settings = useFocusSettings.getState().doc;
        const isFlow = s.flow && s.mode === "focus";
        const elapsed = Math.min(elapsedOf(s, now), isFlow ? Number.POSITIVE_INFINITY : s.plannedMs);
        const kind = s.mode === "focus" ? "focus" : "break";

        // 1. Log the segment.
        const task = s.activeTaskId ? useTasks.getState().items[s.activeTaskId] : undefined;
        const liveTask = task && !task.deletedAt ? task : undefined;
        let entry = null;
        if (s.segmentStartedAt != null && elapsed >= MIN_RECORD_MS[kind]) {
          entry = useEntries.getState().create({
            module: "focus",
            kind,
            mode: isFlow ? "flow" : s.mode,
            startedAt: s.segmentStartedAt,
            endedAt: now,
            durationMs: elapsed,
            plannedMs: isFlow ? null : s.plannedMs,
            completed: isFlow ? true : completed,
            pauses: s.pauses,
            activityId: kind === "focus" ? s.activityId : null,
            taskId: kind === "focus" ? (liveTask?.id ?? null) : null,
            taskTitle: kind === "focus" ? (liveTask?.title ?? null) : null,
            projectId: kind === "focus" ? (liveTask?.projectId ?? null) : null,
            source: "timer",
            ...(kind === "focus" && s.warmupMs > 0 ? { warmupMs: s.warmupMs } : {}),
          });
        }

        // 2. Credit the active task.
        let activeTaskId = s.activeTaskId;
        if (kind === "focus" && liveTask && (completed || isFlow) && elapsed >= MIN_RECORD_MS.focus) {
          const act = liveTask.act + 1;
          const done = liveTask.done || (settings.autoCheckTasks && act >= liveTask.est);
          useTasks.getState().update(liveTask.id, { act, done });
          if (done && settings.autoSwitchTasks) {
            const next = Object.values(useTasks.getState().items)
              .filter((t) => !t.deletedAt && !t.done && t.id !== liveTask.id)
              .sort((a, b) => a.order - b.order)[0];
            activeTaskId = next?.id ?? null;
          }
        }

        // 3. Move to the next segment.
        const cycle = s.mode === "focus" ? s.cycle + 1 : s.cycle;
        const next = nextModeAfter(s.mode, cycle, settings.longBreakInterval);
        const plannedMs = isFlow ? flowBreakMs(elapsed) : next === "focus" && s.flow ? 0 : settings.durations[next] * MINUTE;
        const round = s.mode === "focus" ? s.round : s.round + 1;
        set({ ...fresh(next, plannedMs), cycle, round, activeTaskId });

        timerEvents.emit({ mode: s.mode, flow: isFlow, completed: isFlow || completed, entry, next });

        const autoStart = next === "focus" ? settings.autoStartFocus : settings.autoStartBreaks;
        if (autoStart) get().start();
      },

      extend: (ms) => set((s) => ({ plannedMs: s.plannedMs + ms, reminderFired: false })),

      syncDurations: () => {
        const s = get();
        if (s.status !== "idle" || (s.flow && s.mode === "focus")) return;
        set({ plannedMs: plannedFor(s.mode) });
      },

      resetRound: () => set({ round: 1, cycle: 0 }),

      setActivity: (id) => set({ activityId: id }),

      setActiveTask: (id) => {
        const task = id ? useTasks.getState().items[id] : null;
        set(task?.activityId ? { activeTaskId: id, activityId: task.activityId } : { activeTaskId: id });
      },
    }),
    {
      name: "steen:focus.timer",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => {
        const {
          mode,
          flow,
          status,
          plannedMs,
          elapsedBeforeMs,
          runStartedAt,
          segmentStartedAt,
          pauses,
          cycle,
          round,
          reminderFired,
          warmupMs,
          activityId,
          activeTaskId,
        } = s;
        return {
          mode,
          flow,
          status,
          plannedMs,
          elapsedBeforeMs,
          runStartedAt,
          segmentStartedAt,
          pauses,
          cycle,
          round,
          reminderFired,
          warmupMs,
          activityId,
          activeTaskId,
        } as TimerState;
      },
    },
  ),
);
