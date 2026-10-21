"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useEntries } from "../data/entries";
import { startOfDay } from "../lib/date";
import { formatDuration, MINUTE } from "../lib/time";
import { useNow } from "../lib/useNow";
import { useFocusSettings } from "@/modules/focus/store/settings";
import { useTimer } from "@/modules/focus/store/timer";
import { elapsedOf } from "@/modules/focus/engine/logic";

/** Today's focused time against the daily goal, as a small ring. */
export function DailyGoal() {
  const items = useEntries((s) => s.items);
  const goal = useFocusSettings((s) => s.doc.dailyGoalMinutes) * MINUTE;
  const timer = useTimer();
  const now = useNow(15_000);

  const logged = useMemo(() => {
    const from = startOfDay(now);
    let total = 0;
    for (const e of Object.values(items)) if (!e.deletedAt && e.kind === "focus" && e.endedAt >= from) total += e.durationMs;
    return total;
  }, [items, now]);

  const live = timer.mode === "focus" && timer.status !== "idle" ? elapsedOf(timer, now) : 0;
  const total = logged + live;
  const pct = goal > 0 ? Math.min(1, total / goal) : 0;
  const r = 8;
  const c = 2 * Math.PI * r;

  if (goal <= 0) return null;

  return (
    <Link
      href="/insights"
      title={`${formatDuration(total)} of ${formatDuration(goal)} today`}
      className="hidden h-10 items-center gap-2.5 rounded-full bg-fill pr-4 pl-2 text-[13px] font-medium text-ink-2 transition-colors hover:text-ink sm:inline-flex"
    >
      <svg width="24" height="24" viewBox="0 0 24 24" className="-rotate-90">
        <circle cx="12" cy="12" r={r} fill="none" stroke="currentColor" strokeOpacity="0.2" strokeWidth="3" />
        <circle
          cx="12"
          cy="12"
          r={r}
          fill="none"
          stroke="var(--c-ink)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct)}
          className="transition-[stroke-dashoffset] duration-700"
        />
      </svg>
      <span className="tnum">
        <span className="text-ink">{formatDuration(total)}</span>
        <span className="text-ink-3"> / {formatDuration(goal)}</span>
      </span>
    </Link>
  );
}
