"use client";

import { useEntries } from "@/core/data/entries";
import { dayKey } from "@/core/lib/date";
import { downloadFile, toCsv } from "@/core/lib/download";
import { formatTimeOfDay } from "@/core/lib/time";
import { useActivities, useProjects } from "@/modules/focus/store/data";
import { selectFocus } from "./analytics";

export function exportSessionsCsv(): void {
  const entries = selectFocus(Object.values(useEntries.getState().items));
  const acts = useActivities.getState().items;
  const projects = useProjects.getState().items;
  const rows = entries.map((e) => ({
    date: dayKey(e.startedAt),
    start: formatTimeOfDay(e.startedAt),
    end: formatTimeOfDay(e.endedAt),
    minutes: Math.round(e.durationMs / 60000),
    activity: e.activityId ? (acts[e.activityId]?.name ?? "") : "",
    task: e.taskTitle ?? "",
    project: e.projectId ? (projects[e.projectId]?.name ?? "") : "",
    type: e.mode,
    completed: e.completed,
    pauses: e.pauses,
    source: e.source,
    note: e.note ?? "",
  }));
  downloadFile(`cadence-sessions-${dayKey(Date.now())}.csv`, toCsv(rows), "text/csv");
}
