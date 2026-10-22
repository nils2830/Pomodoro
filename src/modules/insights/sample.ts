"use client";

import { useEntries, type Entry } from "@/core/data/entries";
import { useAuth } from "@/core/auth/store";
import { createRandom } from "@/core/lib/random";
import { addDays, startOfDay } from "@/core/lib/date";
import { MINUTE } from "@/core/lib/time";
import { toast } from "@/core/ui/store";
import { t } from "@/core/i18n";
import { useActivities } from "@/modules/focus/store/data";

type NewEntry = Omit<Entry, "id" | "createdAt" | "updatedAt" | "deletedAt">;

const IDS = { study: "act-study", work: "act-work", reading: "act-reading" };

/**
 * Builds about six months of believable sessions: morning study blocks,
 * afternoon work, evening reading, weekends lighter, a holiday gap,
 * and a gentle upward trend.
 */
export function generateSampleEntries(now = Date.now(), days = 182, seed = 7): NewEntry[] {
  const rnd = createRandom(seed);
  const out: NewEntry[] = [];
  const today = startOfDay(now);
  const holidayStart = rnd.int(40, 120);

  const pomodoros = (start: number, count: number, activityId: string, taskTitle: string | null) => {
    let t = start;
    for (let i = 0; i < count; i++) {
      const planned = 25 * MINUTE;
      const interrupted = rnd.chance(0.07);
      const duration = interrupted ? Math.round(planned * rnd.range(0.35, 0.85)) : planned;
      const pauses = rnd.chance(0.2) ? rnd.int(1, 2) : 0;
      const pausedMs = pauses * rnd.int(1, 4) * MINUTE;
      if (t + duration + pausedMs > now) return;
      out.push({
        module: "focus",
        kind: "focus",
        mode: "focus",
        startedAt: t,
        endedAt: t + duration + pausedMs,
        durationMs: duration,
        plannedMs: planned,
        completed: !interrupted,
        pauses,
        activityId,
        taskId: null,
        taskTitle,
        projectId: null,
        source: "sample",
      });
      t += duration + pausedMs;
      if (interrupted) return;
      if (i < count - 1) {
        const brk = (i + 1) % 4 === 0 ? 15 * MINUTE : 5 * MINUTE;
        out.push({
          module: "focus",
          kind: "break",
          mode: brk > 10 * MINUTE ? "long" : "short",
          startedAt: t,
          endedAt: t + brk,
          durationMs: brk,
          plannedMs: brk,
          completed: true,
          pauses: 0,
          activityId: null,
          taskId: null,
          taskTitle: null,
          projectId: null,
          source: "sample",
        });
        t += brk + rnd.int(0, 2) * MINUTE;
      }
    }
  };

  const studyTasks = ["Lecture notes", "Problem set", "Flashcards", "Past exam", "Chapter reading"];
  const workTasks = ["Inbox zero", "Report draft", "Planning", "Code review", "Slides"];

  for (let d = days; d >= 0; d--) {
    const day = addDays(today, -d);
    const dow = new Date(day).getDay();
    const weekend = dow === 0 || dow === 6;
    const growth = 0.75 + 0.35 * (1 - d / days);
    if (d < holidayStart && d > holidayStart - 6) continue;
    if (rnd.chance(weekend ? 0.3 : 0.08)) continue;

    // Morning study: steadier on Tuesdays and Thursdays.
    const studyBias = dow === 2 || dow === 4 ? 0.12 : 0;
    if (rnd.chance((weekend ? 0.35 : 0.78 + studyBias) * growth)) {
      const start = day + Math.round(rnd.normal(weekend ? 10.2 : 8.7, 0.55) * 60) * MINUTE;
      pomodoros(start, rnd.int(2, weekend ? 3 : 5), IDS.study, rnd.pick(studyTasks));
    }
    // Afternoon work.
    if (!weekend && rnd.chance(0.62 * growth)) {
      const start = day + Math.round(rnd.normal(13.6, 0.8) * 60) * MINUTE;
      pomodoros(start, rnd.int(2, 4), IDS.work, rnd.pick(workTasks));
    }
    // A second, shorter study block some evenings.
    if (rnd.chance(0.25 * growth)) {
      const start = day + Math.round(rnd.normal(17.5, 0.6) * 60) * MINUTE;
      pomodoros(start, rnd.int(1, 2), IDS.study, rnd.pick(studyTasks));
    }
    // Evening reading as an open flow session.
    if (rnd.chance(0.42)) {
      const start = day + Math.round(rnd.normal(21.3, 0.5) * 60) * MINUTE;
      const len = Math.round(rnd.range(15, 50)) * MINUTE;
      if (start + len < now)
        out.push({
          module: "focus",
          kind: "focus",
          mode: "flow",
          startedAt: start,
          endedAt: start + len,
          durationMs: len,
          plannedMs: null,
          completed: true,
          pauses: 0,
          activityId: IDS.reading,
          taskId: null,
          taskTitle: null,
          projectId: null,
          source: "sample",
        });
    }
  }
  return out;
}

export function hasSampleData(items: Record<string, Entry>): boolean {
  for (const e of Object.values(items)) if (e.source === "sample" && !e.deletedAt) return true;
  return false;
}

export function loadSampleData(): void {
  const acts = useActivities.getState();
  const restore = [
    { id: IDS.study, name: "Study", color: 0, order: 0 },
    { id: IDS.work, name: "Work", color: 1, order: 1 },
    { id: IDS.reading, name: "Reading", color: 2, order: 2 },
  ];
  for (const a of restore) {
    const cur = acts.items[a.id];
    if (!cur) acts.merge([{ ...a, archived: false, createdAt: 1, updatedAt: 1, deletedAt: null }]);
    else if (cur.deletedAt || cur.archived) acts.update(a.id, { deletedAt: null, archived: false });
  }
  const entries = generateSampleEntries();
  useEntries.getState().createMany(entries);
  toast({ message: t("Loaded {count} sample sessions.", { count: entries.filter((e) => e.kind === "focus").length }), tone: "success" });
}

export function removeSampleData(): void {
  // Signed-in users need tombstones so the removal syncs; otherwise drop them outright.
  const synced = useAuth.getState().status === "signedIn";
  if (synced) useEntries.getState().removeWhere((e) => e.source === "sample");
  else useEntries.setState((s) => ({ items: Object.fromEntries(Object.entries(s.items).filter(([, e]) => e.source !== "sample")) }));
  toast(t("Sample data removed."));
}
