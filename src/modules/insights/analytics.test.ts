import { describe, expect, it } from "vitest";
import type { Entry } from "@/core/data/entries";
import { MINUTE, HOUR } from "@/core/lib/time";
import {
  bucketize,
  computeKpis,
  groupSitDowns,
  lengthHistogram,
  punchcard,
  rangeFor,
  selectFocus,
  streaks,
  weekdayProfile,
  hourProfile,
  firstStartPattern,
} from "./analytics";

let n = 0;
function entry(start: Date, minutes: number, extra: Partial<Entry> = {}): Entry {
  const startedAt = start.getTime();
  return {
    id: `e${n++}`,
    createdAt: startedAt,
    updatedAt: startedAt,
    deletedAt: null,
    module: "focus",
    kind: "focus",
    mode: "focus",
    startedAt,
    endedAt: startedAt + minutes * MINUTE,
    durationMs: minutes * MINUTE,
    plannedMs: 25 * MINUTE,
    completed: true,
    pauses: 0,
    activityId: "act-study",
    taskId: null,
    taskTitle: null,
    projectId: null,
    source: "timer",
    ...extra,
  };
}

const at = (d: number, h: number, m = 0) => new Date(2026, 9, d, h, m); // October 2026

describe("groupSitDowns", () => {
  it("merges sessions separated by short breaks into one sit-down", () => {
    const list = [entry(at(5, 9), 25), entry(at(5, 9, 30), 25), entry(at(5, 10), 25), entry(at(5, 14), 25)];
    const groups = groupSitDowns(list);
    expect(groups).toHaveLength(2);
    expect(groups[0].sessions).toBe(3);
    expect(groups[0].focusMs).toBe(75 * MINUTE);
    expect(groups[1].sessions).toBe(1);
  });

  it("picks the activity with the most time as primary", () => {
    const list = [entry(at(5, 9), 10, { activityId: "a" }), entry(at(5, 9, 15), 40, { activityId: "b" })];
    expect(groupSitDowns(list)[0].primaryActivityId).toBe("b");
  });
});

describe("streaks", () => {
  it("counts consecutive days and tolerates an empty today", () => {
    const list = [entry(at(18, 9), 25), entry(at(19, 9), 25), entry(at(20, 9), 25), entry(at(10, 9), 25), entry(at(11, 9), 25)];
    const now = at(21, 8).getTime();
    expect(streaks(list, now)).toEqual({ current: 3, longest: 3 });
  });

  it("breaks the current streak after a missed day", () => {
    const list = [entry(at(18, 9), 25), entry(at(19, 9), 25)];
    expect(streaks(list, at(21, 12).getTime()).current).toBe(0);
  });
});

describe("computeKpis", () => {
  it("summarises focus, sit-downs and completion", () => {
    const list = [entry(at(20, 9), 25), entry(at(20, 9, 30), 25, { completed: false }), entry(at(21, 15), 50, { mode: "flow" })];
    const range = rangeFor("7d", at(21, 18).getTime());
    const k = computeKpis(selectFocus(list, { range }), range);
    expect(k.focusMs).toBe(100 * MINUTE);
    expect(k.sitDowns).toBe(2);
    expect(k.activeDays).toBe(2);
    expect(k.totalDays).toBe(7);
    expect(k.completionRate).toBe(0.5); // flow sessions are excluded
  });
});

describe("bucketize", () => {
  it("creates one bucket per day and splits by activity", () => {
    const range = rangeFor("7d", at(21, 18).getTime());
    const list = [entry(at(21, 9), 25, { activityId: "a" }), entry(at(21, 10), 30, { activityId: "b" }), entry(at(16, 9), 20)];
    const b = bucketize(list, range, "day");
    expect(b).toHaveLength(7);
    expect(b[6].totalMs).toBe(55 * MINUTE);
    expect(b[6].byActivity).toEqual({ a: 25 * MINUTE, b: 30 * MINUTE });
    expect(b[1].totalMs).toBe(20 * MINUTE);
  });
});

describe("distributions", () => {
  it("places sit-downs on the right weekday and hour", () => {
    // 21 Oct 2026 is a Wednesday: index 2 when weeks start on Monday.
    const card = punchcard(groupSitDowns([entry(at(21, 9, 10), 25)]), 1);
    expect(card.grid[2][9]).toBe(1);
    expect(card.max).toBe(1);
  });

  it("splits focus across hour boundaries", () => {
    const hours = hourProfile([entry(at(21, 9, 45), 30)]);
    expect(hours[9]).toBe(15 * MINUTE);
    expect(hours[10]).toBe(15 * MINUTE);
  });

  it("bins sit-down lengths", () => {
    const sd = groupSitDowns([entry(at(1, 9), 10), entry(at(2, 9), 45), entry(at(3, 9), 130)]);
    const h = lengthHistogram(sd).map((b) => b.count);
    expect(h).toEqual([1, 0, 1, 0, 0, 1]);
  });

  it("averages weekdays over every occurrence in range", () => {
    const range = rangeFor("30d", at(21, 18).getTime());
    const wd = weekdayProfile([entry(at(21, 9), 60)], range, 1);
    expect(wd[2].days).toBeGreaterThanOrEqual(4);
    expect(wd[2].totalMs).toBe(HOUR);
  });

  it("finds the typical first start", () => {
    const list = [entry(at(1, 8, 30), 25), entry(at(2, 8, 50), 25), entry(at(3, 9, 10), 25), entry(at(3, 14), 25)];
    const p = firstStartPattern(groupSitDowns(list));
    expect(p?.medianMin).toBe(8 * 60 + 50);
    expect(p?.days).toBe(3);
  });
});
