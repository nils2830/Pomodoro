/**
 * Pure analytics over timeline entries. No React, no stores: everything
 * here is a function of (entries, range, options) so it is easy to test
 * and reuse when other modules start writing entries.
 */
import type { Entry } from "@/core/data/entries";
import { addDays, addMonths, dayKey, daysBetween, endOfDay, startOfDay, startOfMonth, startOfWeek, weekdayIndex, type WeekStart } from "@/core/lib/date";
import { DAY, HOUR, MINUTE } from "@/core/lib/time";
import { localeTag, t } from "@/core/i18n";

export type RangeKey = "7d" | "30d" | "90d" | "1y" | "all";

export interface Range {
  key: RangeKey;
  from: number;
  to: number;
}

export const RANGE_DAYS: Record<Exclude<RangeKey, "all">, number> = { "7d": 7, "30d": 30, "90d": 90, "1y": 365 };

/** Sessions closer together than this count as one sit-down. */
export const SIT_DOWN_GAP_MS = 20 * MINUTE;

export function rangeFor(key: RangeKey, now: number, earliest?: number): Range {
  const to = endOfDay(now);
  if (key === "all") return { key, from: startOfDay(Math.min(earliest ?? now, now)), to };
  return { key, from: startOfDay(addDays(now, -(RANGE_DAYS[key] - 1))), to };
}

export function previousRange(r: Range): Range {
  const days = daysBetween(r.from, r.to) + 1;
  return { key: r.key, from: startOfDay(addDays(r.from, -days)), to: r.from - 1 };
}

export function rangeDays(r: Range): number {
  return daysBetween(r.from, r.to) + 1;
}

/** Live focus entries, optionally for one activity, sorted by start. */
export function selectFocus(entries: Iterable<Entry>, opts: { activityId?: string | null; range?: Range } = {}): Entry[] {
  const out: Entry[] = [];
  for (const e of entries) {
    if (e.deletedAt || e.kind !== "focus") continue;
    if (opts.activityId && e.activityId !== opts.activityId) continue;
    if (opts.range && (e.startedAt < opts.range.from || e.startedAt > opts.range.to)) continue;
    out.push(e);
  }
  return out.sort((a, b) => a.startedAt - b.startedAt);
}

// ───────────────────────── Sit-downs ─────────────────────────

export interface SitDown {
  start: number;
  end: number;
  focusMs: number;
  sessions: number;
  primaryActivityId: string | null;
  byActivity: Record<string, number>;
}

/**
 * Groups back-to-back focus sessions (with breaks between them) into
 * sit-downs: the moments you actually sat down to work.
 */
export function groupSitDowns(sorted: Entry[], gapMs = SIT_DOWN_GAP_MS): SitDown[] {
  const out: SitDown[] = [];
  let cur: SitDown | null = null;
  for (const e of sorted) {
    if (cur && e.startedAt - cur.end <= gapMs) {
      cur.end = Math.max(cur.end, e.endedAt);
      cur.focusMs += e.durationMs;
      cur.sessions += 1;
    } else {
      cur = { start: e.startedAt, end: e.endedAt, focusMs: e.durationMs, sessions: 1, primaryActivityId: null, byActivity: {} };
      out.push(cur);
    }
    const key = e.activityId ?? "none";
    cur.byActivity[key] = (cur.byActivity[key] ?? 0) + e.durationMs;
  }
  for (const s of out) {
    let best: string | null = null;
    let bestMs = -1;
    for (const [id, ms] of Object.entries(s.byActivity)) if (ms > bestMs) [best, bestMs] = [id, ms];
    s.primaryActivityId = best === "none" ? null : best;
  }
  return out;
}

/**
 * Compares sit-downs that opened with a warm-up against those that didn't,
 * by how long you stayed. Expects focus entries sorted by start.
 */
export function warmupComparison(sorted: Entry[], gapMs = SIT_DOWN_GAP_MS): { warm: { count: number; avgMs: number }; cold: { count: number; avgMs: number } } {
  const groups: { warm: boolean; focusMs: number }[] = [];
  let cur: { warm: boolean; focusMs: number } | null = null;
  let end = Number.NEGATIVE_INFINITY;
  for (const e of sorted) {
    if (cur && e.startedAt - end <= gapMs) {
      cur.focusMs += e.durationMs;
      end = Math.max(end, e.endedAt);
    } else {
      cur = { warm: (e.warmupMs ?? 0) > 0, focusMs: e.durationMs };
      groups.push(cur);
      end = e.endedAt;
    }
  }
  const summary = (warm: boolean) => {
    const g = groups.filter((x) => x.warm === warm);
    return { count: g.length, avgMs: g.length ? g.reduce((sum, x) => sum + x.focusMs, 0) / g.length : 0 };
  };
  return { warm: summary(true), cold: summary(false) };
}

/** What the logged distractions add up to. Only sessions where they were noted count. */
export interface DistractionStats {
  logged: number;
  perSession: number;
  minutesPerSession: number;
  totalMinutes: number;
  /** Share of logged sessions with no distractions at all. */
  cleanShare: number;
  /** Last logged sessions, oldest first, for a small chart. */
  recent: { at: number; count: number; minutes: number }[];
}

export function distractionStats(focus: Entry[]): DistractionStats {
  const logged = focus.filter((e) => typeof e.distractions === "number").sort((a, b) => a.startedAt - b.startedAt);
  const n = logged.length;
  const count = logged.reduce((s, e) => s + (e.distractions ?? 0), 0);
  const minutes = logged.reduce((s, e) => s + (e.distractedMin ?? 0), 0);
  return {
    logged: n,
    perSession: n ? count / n : 0,
    minutesPerSession: n ? minutes / n : 0,
    totalMinutes: minutes,
    cleanShare: n ? logged.filter((e) => !e.distractions).length / n : 0,
    recent: logged.slice(-16).map((e) => ({ at: e.startedAt, count: e.distractions ?? 0, minutes: e.distractedMin ?? 0 })),
  };
}

// ───────────────────────── Headline numbers ─────────────────────────

export interface Kpis {
  focusMs: number;
  sessions: number;
  sitDowns: number;
  avgSitDownMs: number;
  longestSitDownMs: number;
  activeDays: number;
  totalDays: number;
  sitDownsPerActiveDay: number;
  avgPerActiveDayMs: number;
  /** Share of timer sessions that ran to the end. Null without timer data. */
  completionRate: number | null;
}

export function computeKpis(focus: Entry[], range: Range, gapMs = SIT_DOWN_GAP_MS): Kpis {
  const sitDowns = groupSitDowns(focus, gapMs);
  const days = new Set(focus.map((e) => dayKey(e.startedAt)));
  const focusMs = focus.reduce((s, e) => s + e.durationMs, 0);
  const timed = focus.filter((e) => e.source !== "manual" && e.mode !== "flow");
  const activeDays = days.size;
  return {
    focusMs,
    sessions: focus.length,
    sitDowns: sitDowns.length,
    avgSitDownMs: sitDowns.length ? sitDowns.reduce((s, x) => s + x.focusMs, 0) / sitDowns.length : 0,
    longestSitDownMs: sitDowns.reduce((m, x) => Math.max(m, x.focusMs), 0),
    activeDays,
    totalDays: rangeDays(range),
    sitDownsPerActiveDay: activeDays ? sitDowns.length / activeDays : 0,
    avgPerActiveDayMs: activeDays ? focusMs / activeDays : 0,
    completionRate: timed.length ? timed.filter((e) => e.completed).length / timed.length : null,
  };
}

/** Consecutive days with any focus. Today not yet counted doesn't break it. */
export function streaks(focus: Entry[], now: number): { current: number; longest: number } {
  const days = new Set(focus.map((e) => dayKey(e.startedAt)));
  if (days.size === 0) return { current: 0, longest: 0 };

  let current = 0;
  let cursor = startOfDay(now);
  if (!days.has(dayKey(cursor))) cursor = addDays(cursor, -1);
  while (days.has(dayKey(cursor))) {
    current++;
    cursor = addDays(cursor, -1);
  }

  const sorted = [...days].sort();
  let longest = 1;
  let run = 1;
  for (let i = 1; i < sorted.length; i++) {
    const [y1, m1, d1] = sorted[i - 1].split("-").map(Number);
    const [y2, m2, d2] = sorted[i].split("-").map(Number);
    const gap = daysBetween(new Date(y1, m1 - 1, d1).getTime(), new Date(y2, m2 - 1, d2).getTime());
    run = gap === 1 ? run + 1 : 1;
    longest = Math.max(longest, run);
  }
  return { current, longest: Math.max(longest, current) };
}

// ───────────────────────── Time series ─────────────────────────

export type BucketUnit = "day" | "week" | "month";

export interface Bucket {
  start: number;
  end: number;
  totalMs: number;
  byActivity: Record<string, number>;
}

export function unitFor(range: Range): BucketUnit {
  const days = rangeDays(range);
  if (days <= 31) return "day";
  if (days <= 120) return "week";
  return "month";
}

export function bucketize(focus: Entry[], range: Range, unit: BucketUnit, weekStart: WeekStart = 1): Bucket[] {
  const startOf = (ts: number) => (unit === "day" ? startOfDay(ts) : unit === "week" ? startOfWeek(ts, weekStart) : startOfMonth(ts));
  const step = (ts: number) => (unit === "day" ? addDays(ts, 1) : unit === "week" ? addDays(ts, 7) : addMonths(ts, 1));
  const buckets: Bucket[] = [];
  const index = new Map<number, Bucket>();
  for (let t = startOf(range.from); t <= range.to; t = step(t)) {
    const b: Bucket = { start: t, end: step(t) - 1, totalMs: 0, byActivity: {} };
    buckets.push(b);
    index.set(t, b);
  }
  for (const e of focus) {
    const b = index.get(startOf(e.startedAt));
    if (!b) continue;
    b.totalMs += e.durationMs;
    const key = e.activityId ?? "none";
    b.byActivity[key] = (b.byActivity[key] ?? 0) + e.durationMs;
  }
  return buckets;
}

export interface HeatDay {
  key: string;
  ts: number;
  ms: number;
  future: boolean;
}

/** A GitHub-style year: columns are weeks, rows are weekdays. */
export function yearGrid(focus: Entry[], now: number, weekStart: WeekStart = 1, weeks = 53): { columns: HeatDay[][]; max: number } {
  const totals = new Map<string, number>();
  for (const e of focus) totals.set(dayKey(e.startedAt), (totals.get(dayKey(e.startedAt)) ?? 0) + e.durationMs);
  const lastWeek = startOfWeek(now, weekStart);
  const first = addDays(lastWeek, -7 * (weeks - 1));
  const today = startOfDay(now);
  const columns: HeatDay[][] = [];
  let max = 0;
  for (let w = 0; w < weeks; w++) {
    const col: HeatDay[] = [];
    for (let d = 0; d < 7; d++) {
      const ts = addDays(first, w * 7 + d);
      const key = dayKey(ts);
      const ms = totals.get(key) ?? 0;
      max = Math.max(max, ms);
      col.push({ key, ts, ms, future: ts > today });
    }
    columns.push(col);
  }
  return { columns, max };
}

/** Sit-down starts by weekday (rows) and hour (columns). */
export function punchcard(sitDowns: SitDown[], weekStart: WeekStart = 1): { grid: number[][]; max: number } {
  const grid = Array.from({ length: 7 }, () => Array<number>(24).fill(0));
  let max = 0;
  for (const s of sitDowns) {
    const row = weekdayIndex(s.start, weekStart);
    const hour = new Date(s.start).getHours();
    grid[row][hour] += 1;
    max = Math.max(max, grid[row][hour]);
  }
  return { grid, max };
}

/** Focus minutes by hour of day, split across hour boundaries. */
export function hourProfile(focus: Entry[]): number[] {
  const hours = Array<number>(24).fill(0);
  for (const e of focus) {
    let t = e.endedAt - e.durationMs;
    const end = e.endedAt;
    while (t < end) {
      const d = new Date(t);
      const nextHour = new Date(d.getFullYear(), d.getMonth(), d.getDate(), d.getHours() + 1).getTime();
      const slice = Math.min(end, nextHour) - t;
      hours[d.getHours()] += slice;
      t += slice;
    }
  }
  return hours;
}

export const LENGTH_BINS: { label: string; min: number; max: number }[] = [
  { label: "< 15m", min: 0, max: 15 },
  { label: "15–30m", min: 15, max: 30 },
  { label: "30–60m", min: 30, max: 60 },
  { label: "1–1.5h", min: 60, max: 90 },
  { label: "1.5–2h", min: 90, max: 120 },
  { label: "2h +", min: 120, max: Number.POSITIVE_INFINITY },
];

export function lengthHistogram(sitDowns: SitDown[]): { label: string; count: number }[] {
  return LENGTH_BINS.map((b) => ({
    label: b.label,
    count: sitDowns.filter((s) => s.focusMs >= b.min * MINUTE && s.focusMs < b.max * MINUTE).length,
  }));
}

/** Average focus per weekday, counting every occurrence of that weekday in range. */
export function weekdayProfile(focus: Entry[], range: Range, weekStart: WeekStart = 1): { avgMs: number; days: number; totalMs: number }[] {
  const out = Array.from({ length: 7 }, () => ({ avgMs: 0, days: 0, totalMs: 0 }));
  for (let t = range.from; t <= range.to; t = addDays(t, 1)) out[weekdayIndex(t, weekStart)].days += 1;
  for (const e of focus) out[weekdayIndex(e.startedAt, weekStart)].totalMs += e.durationMs;
  for (const o of out) o.avgMs = o.days ? o.totalMs / o.days : 0;
  return out;
}

export function weeklyTrend(focus: Entry[], now: number, weeks: number, weekStart: WeekStart = 1): { start: number; totalMs: number }[] {
  const last = startOfWeek(now, weekStart);
  const out = Array.from({ length: weeks }, (_, i) => ({ start: addDays(last, -7 * (weeks - 1 - i)), totalMs: 0 }));
  const first = out[0].start;
  for (const e of focus) {
    if (e.startedAt < first) continue;
    const idx = Math.floor(daysBetween(first, e.startedAt) / 7);
    if (idx >= 0 && idx < weeks) out[idx].totalMs += e.durationMs;
  }
  return out;
}

export function activityBreakdown(focus: Entry[]): { activityId: string | null; ms: number; sessions: number }[] {
  const map = new Map<string | null, { ms: number; sessions: number }>();
  for (const e of focus) {
    const cur = map.get(e.activityId) ?? { ms: 0, sessions: 0 };
    cur.ms += e.durationMs;
    cur.sessions += 1;
    map.set(e.activityId, cur);
  }
  return [...map.entries()].map(([activityId, v]) => ({ activityId, ...v })).sort((a, b) => b.ms - a.ms);
}

/** Median first sit-down of the day and how much it varies (half the IQR). */
export function firstStartPattern(sitDowns: SitDown[]): { medianMin: number; spreadMin: number; days: number } | null {
  const firstByDay = new Map<string, number>();
  for (const s of sitDowns) {
    const k = dayKey(s.start);
    if (!firstByDay.has(k)) firstByDay.set(k, s.start);
  }
  const mins = [...firstByDay.values()].map((ts) => {
    const d = new Date(ts);
    return d.getHours() * 60 + d.getMinutes();
  });
  if (mins.length < 3) return null;
  mins.sort((a, b) => a - b);
  const q = (p: number) => mins[Math.min(mins.length - 1, Math.max(0, Math.round(p * (mins.length - 1))))];
  return { medianMin: q(0.5), spreadMin: Math.round((q(0.75) - q(0.25)) / 2), days: mins.length };
}

// ───────────────────────── Observations ─────────────────────────

export interface Observation {
  id: string;
  title: string;
  detail: string;
}

const pct = (x: number) => `${Math.round(x * 100)}%`;
const fmtDur = (ms: number) => {
  const m = Math.round(ms / MINUTE);
  const h = Math.floor(m / 60);
  return h ? `${h}h ${String(m % 60).padStart(2, "0")}m` : `${m}m`;
};
const fmtClock = (min: number) => `${String(Math.floor(min / 60) % 24).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;

/**
 * Plain-language findings. Each one only appears when there is enough
 * data behind it to be more than noise.
 */
export function observations(
  focus: Entry[],
  range: Range,
  now: number,
  opts: { weekStart?: WeekStart; weekdayNames: string[]; activityName: (id: string | null) => string; allFocus: Entry[] },
): Observation[] {
  const out: Observation[] = [];
  const weekStart = opts.weekStart ?? 1;
  const sitDowns = groupSitDowns(focus);
  const kpis = computeKpis(focus, range);
  if (kpis.sessions < 5) return out;

  // How often you sit down.
  if (kpis.activeDays >= 3) {
    out.push({
      id: "frequency",
      title: t("{count} sit-downs on a working day", {
        count: kpis.sitDownsPerActiveDay.toLocaleString(localeTag(), { minimumFractionDigits: 1, maximumFractionDigits: 1 }),
      }),
      detail: t("On the {days} days you worked, you sat down {count} times and stayed {avg} on average.", {
        days: kpis.activeDays,
        count: kpis.sitDowns,
        avg: fmtDur(kpis.avgSitDownMs),
      }),
    });
  }

  // Best weekday.
  const wd = weekdayProfile(focus, range, weekStart);
  if (rangeDays(range) >= 14) {
    const best = wd.reduce((bi, w, i, arr) => (w.avgMs > arr[bi].avgMs ? i : bi), 0);
    const others = wd.filter((_, i) => i !== best);
    const otherAvg =
      others.reduce((s, w) => s + w.totalMs, 0) /
      Math.max(
        1,
        others.reduce((s, w) => s + w.days, 0),
      );
    if (wd[best].avgMs > otherAvg * 1.15) {
      out.push({
        id: "best-day",
        title: t("{day}s are your strongest day", { day: opts.weekdayNames[best] }),
        detail: t("You average {avg} on {day}s, against {other} on other days.", {
          avg: fmtDur(wd[best].avgMs),
          day: opts.weekdayNames[best],
          other: fmtDur(otherAvg),
        }),
      });
    }
  }

  // Peak two-hour window.
  const hours = hourProfile(focus);
  const total = hours.reduce((s, x) => s + x, 0);
  if (total > 0) {
    let bestH = 0;
    let bestSum = 0;
    for (let h = 0; h < 23; h++) {
      const sum = hours[h] + hours[h + 1];
      if (sum > bestSum) [bestH, bestSum] = [h, sum];
    }
    out.push({
      id: "peak",
      title: t("Your peak hours are {from}–{to}", { from: fmtClock(bestH * 60), to: fmtClock((bestH + 2) * 60) }),
      detail: t("{share} of all your focus time falls in that two-hour window.", { share: pct(bestSum / total) }),
    });
  }

  // When the day starts.
  const first = firstStartPattern(sitDowns);
  if (first && first.days >= 5) {
    out.push({
      id: "first-start",
      title: t("You usually start around {time}", { time: fmtClock(Math.round(first.medianMin / 5) * 5) }),
      detail:
        first.spreadMin <= 30
          ? t("Give or take {min} minutes. That's a steady routine.", { min: Math.max(5, first.spreadMin) })
          : t("But it varies by about {min} minutes either way. A fixed start time can make sitting down easier.", { min: first.spreadMin }),
    });
  }

  // Late sit-downs.
  const late = sitDowns.filter((s) => new Date(s.start).getHours() >= 21);
  const early = sitDowns.filter((s) => new Date(s.start).getHours() < 21);
  if (late.length >= 4 && early.length >= 4) {
    const lateAvg = late.reduce((s, x) => s + x.focusMs, 0) / late.length;
    const earlyAvg = early.reduce((s, x) => s + x.focusMs, 0) / early.length;
    const diff = (lateAvg - earlyAvg) / earlyAvg;
    if (Math.abs(diff) >= 0.15) {
      out.push({
        id: "late",
        title: t(diff < 0 ? "Late sit-downs run {pct} shorter" : "Late sit-downs run {pct} longer", { pct: pct(Math.abs(diff)) }),
        detail: t("After 21:00 you stay {late} on average, against {early} earlier in the day.", { late: fmtDur(lateAvg), early: fmtDur(earlyAvg) }),
      });
    }
  }

  // Four-week trend (uses all data, not just the range).
  const trend = weeklyTrend(opts.allFocus, now, 8, weekStart);
  const recent = trend.slice(4).reduce((s, w) => s + w.totalMs, 0);
  const before = trend.slice(0, 4).reduce((s, w) => s + w.totalMs, 0);
  if (before > 2 * HOUR) {
    const change = (recent - before) / before;
    if (Math.abs(change) >= 0.08) {
      out.push({
        id: "trend",
        title: t(change > 0 ? "Up {pct} on the four weeks before" : "Down {pct} on the four weeks before", { pct: pct(Math.abs(change)) }),
        detail: t("{recent} in the last four weeks, {before} in the four before that.", { recent: fmtDur(recent), before: fmtDur(before) }),
      });
    }
  }

  // Completion.
  if (kpis.completionRate != null && kpis.sessions >= 10) {
    out.push({
      id: "completion",
      title: t("You finish {pct} of the sessions you start", { pct: pct(kpis.completionRate) }),
      detail: kpis.completionRate >= 0.85 ? t("When you sit down, you tend to stay.") : t("If you often stop early, try a shorter focus length for a while."),
    });
  }

  // Distractions, from what the person noted after sessions.
  const ds = distractionStats(focus);
  if (ds.logged >= 5) {
    const half = Math.floor(ds.recent.length / 2);
    const early = ds.recent.slice(0, half);
    const late = ds.recent.slice(half);
    const avg = (xs: { count: number }[]) => xs.reduce((s, x) => s + x.count, 0) / Math.max(1, xs.length);
    const change = half >= 3 ? avg(late) - avg(early) : 0;
    out.push({
      id: "distractions",
      title:
        ds.perSession < 0.5
          ? t("Most of your sessions are distraction-free")
          : t("About {n} distractions per session", { n: ds.perSession.toFixed(1) }),
      detail:
        Math.abs(change) >= 0.4
          ? change < 0
            ? t("Fewer than before: {from} on average in your earlier sessions, {to} lately.", { from: avg(early).toFixed(1), to: avg(late).toFixed(1) })
            : t("More than before: {from} on average in your earlier sessions, {to} lately.", { from: avg(early).toFixed(1), to: avg(late).toFixed(1) })
          : t("They cost you about {min} minutes per session. {clean} of your sessions had none.", {
              min: Math.round(ds.minutesPerSession),
              clean: pct(ds.cleanShare),
            }),
    });
  }

  // Warm-up. Correlation only: people may warm up on days they already meant to stay.
  const wu = warmupComparison(focus);
  if (wu.warm.count >= 4 && wu.cold.count >= 4) {
    const diff = (wu.warm.avgMs - wu.cold.avgMs) / Math.max(1, wu.cold.avgMs);
    out.push(
      Math.abs(diff) >= 0.1
        ? {
            id: "warmup",
            title: t(diff > 0 ? "Sit-downs after a warm-up run {pct} longer" : "Sit-downs after a warm-up run {pct} shorter", { pct: pct(Math.abs(diff)) }),
            detail: t(
              "{warm} on average after a warm-up ({warmCount} times), against {cold} without ({coldCount}). A pattern in your data, not proof of cause.",
              {
                warm: fmtDur(wu.warm.avgMs),
                warmCount: wu.warm.count,
                cold: fmtDur(wu.cold.avgMs),
                coldCount: wu.cold.count,
              },
            ),
          }
        : {
            id: "warmup",
            title: t("Warm-up or not, you stay about as long"),
            detail: t("{warm} after a warm-up, {cold} without. Keep it if it makes starting easier.", {
              warm: fmtDur(wu.warm.avgMs),
              cold: fmtDur(wu.cold.avgMs),
            }),
          },
    );
  }

  // Dominant activity.
  const mix = activityBreakdown(focus);
  if (mix.length > 1 && kpis.focusMs > 0) {
    out.push({
      id: "mix",
      title: t("{activity} takes {pct} of your time", { activity: opts.activityName(mix[0].activityId), pct: pct(mix[0].ms / kpis.focusMs) }),
      detail: t("Followed by {activity} at {pct}.", { activity: opts.activityName(mix[1].activityId), pct: pct(mix[1].ms / kpis.focusMs) }),
    });
  }

  // Longest gap.
  const days = [...new Set(focus.map((e) => startOfDay(e.startedAt)))].sort((a, b) => a - b);
  let gap = 0;
  let gapEnd = 0;
  for (let i = 1; i < days.length; i++) {
    const g = Math.round((days[i] - days[i - 1]) / DAY) - 1;
    if (g > gap) [gap, gapEnd] = [g, days[i]];
  }
  if (gap >= 3) {
    const d = new Date(gapEnd);
    out.push({
      id: "gap",
      title: t("Your longest break was {days} days", { days: gap }),
      detail: t("It ended on {date}. Streaks matter less than coming back.", { date: d.toLocaleDateString(localeTag(), { day: "numeric", month: "long" }) }),
    });
  }

  return out;
}
