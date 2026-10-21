"use client";

import { useMemo } from "react";
import { useEntries } from "@/core/data/entries";
import { usePrefs } from "@/core/prefs";
import { weekdayNames } from "@/core/lib/date";
import { useActivityList } from "@/modules/focus/hooks";
import {
  activityBreakdown,
  bucketize,
  computeKpis,
  groupSitDowns,
  lengthHistogram,
  observations,
  previousRange,
  punchcard,
  rangeFor,
  selectFocus,
  streaks,
  unitFor,
  weekdayProfile,
  weeklyTrend,
  yearGrid,
  hourProfile,
  type RangeKey,
} from "../analytics";

export function useInsights(rangeKey: RangeKey, activityId: string | null, now: number) {
  const items = useEntries((s) => s.items);
  const weekStart = usePrefs((s) => s.doc.weekStart);
  const activities = useActivityList(true);

  return useMemo(() => {
    const all = Object.values(items);
    const allFocus = selectFocus(all, { activityId });
    const earliest = allFocus[0]?.startedAt;
    const range = rangeFor(rangeKey, now, earliest);
    const prev = previousRange(range);
    const focus = allFocus.filter((e) => e.startedAt >= range.from && e.startedAt <= range.to);
    const prevFocus = allFocus.filter((e) => e.startedAt >= prev.from && e.startedAt <= prev.to);
    const sitDowns = groupSitDowns(focus);
    const kpis = computeKpis(focus, range);
    const prevKpis = computeKpis(prevFocus, prev);
    const unit = unitFor(range);
    const names = weekdayNames(weekStart);
    const longNames = weekdayNames(weekStart, true);
    const activityName = (id: string | null) => activities.find((a) => a.id === id)?.name ?? "Unassigned";

    return {
      range,
      unit,
      focus,
      allFocus,
      hasAnyData: selectFocus(all).length > 0,
      sitDowns,
      kpis,
      prevKpis,
      streak: streaks(allFocus, now),
      buckets: bucketize(focus, range, unit, weekStart),
      mix: activityBreakdown(focus),
      year: yearGrid(allFocus, now, weekStart),
      punch: punchcard(sitDowns, weekStart),
      hours: hourProfile(focus),
      lengths: lengthHistogram(sitDowns),
      weekdays: weekdayProfile(focus, range, weekStart),
      trend: weeklyTrend(allFocus, now, 16, weekStart),
      observations: observations(focus, range, now, { weekStart, weekdayNames: longNames, activityName, allFocus }),
      weekdayNames: names,
      activityName,
    };
  }, [items, rangeKey, activityId, now, weekStart, activities]);
}

export type InsightsData = ReturnType<typeof useInsights>;
