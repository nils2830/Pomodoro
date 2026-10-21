"use client";

import { useMemo } from "react";
import { liveList } from "@/core/data/collection";
import { useNow } from "@/core/lib/useNow";
import { usePrefs } from "@/core/prefs";
import { useActivities, useProjects, useTasks, useTemplates } from "./store/data";
import { useTimer } from "./store/timer";
import { useFocusSettings } from "./store/settings";
import { elapsedOf, endsAtOf, progressOf, remainingOf } from "./engine/logic";
import type { FaceProps } from "./components/faces/types";

export function useActivityList(includeArchived = false) {
  const items = useActivities((s) => s.items);
  return useMemo(
    () => liveList(items, (a, b) => a.order - b.order || a.createdAt - b.createdAt).filter((a) => includeArchived || !a.archived),
    [items, includeArchived],
  );
}

export function useProjectList() {
  const items = useProjects((s) => s.items);
  return useMemo(() => liveList(items, (a, b) => a.createdAt - b.createdAt).filter((p) => !p.archived), [items]);
}

export function useTaskList() {
  const items = useTasks((s) => s.items);
  return useMemo(() => liveList(items, (a, b) => a.order - b.order || a.createdAt - b.createdAt), [items]);
}

export function useTemplateList() {
  const items = useTemplates((s) => s.items);
  return useMemo(() => liveList(items, (a, b) => b.createdAt - a.createdAt), [items]);
}

/** Everything a face needs, refreshed on an interval. */
export function useFaceProps(size: FaceProps["size"], intervalMs = 250): FaceProps {
  const timer = useTimer();
  const showSeconds = useFocusSettings((s) => s.doc.showSeconds);
  const hourFormat = usePrefs((s) => s.doc.hourFormat);
  const now = useNow(timer.status === "running" ? intervalMs : 30_000);
  return {
    mode: timer.mode,
    flow: timer.flow,
    status: timer.status,
    now,
    plannedMs: timer.plannedMs,
    elapsedMs: elapsedOf(timer, now),
    remainingMs: remainingOf(timer, now),
    progress: progressOf(timer, now),
    startedAt: timer.segmentStartedAt,
    endsAt: endsAtOf(timer),
    hourFormat,
    showSeconds,
    size,
  };
}
