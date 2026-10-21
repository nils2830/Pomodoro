import { DAY } from "./time";

export type WeekStart = 1 | 0; // 1 = Monday, 0 = Sunday

/** Local calendar day key, e.g. 2026-10-21. */
export function dayKey(ts: number | Date): string {
  const d = typeof ts === "number" ? new Date(ts) : ts;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function parseDayKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function startOfDay(ts: number | Date): number {
  const d = new Date(typeof ts === "number" ? ts : ts.getTime());
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export function endOfDay(ts: number | Date): number {
  return addDays(startOfDay(ts), 1) - 1;
}

/** Adds calendar days (DST safe, unlike adding 24h). */
export function addDays(ts: number, days: number): number {
  const d = new Date(ts);
  d.setDate(d.getDate() + days);
  return d.getTime();
}

export function startOfWeek(ts: number, weekStart: WeekStart = 1): number {
  const d = new Date(startOfDay(ts));
  const diff = (d.getDay() - weekStart + 7) % 7;
  d.setDate(d.getDate() - diff);
  return d.getTime();
}

export function startOfMonth(ts: number): number {
  const d = new Date(ts);
  return new Date(d.getFullYear(), d.getMonth(), 1).getTime();
}

export function addMonths(ts: number, months: number): number {
  const d = new Date(ts);
  return new Date(d.getFullYear(), d.getMonth() + months, 1).getTime();
}

/** Whole calendar days between two timestamps (b - a). */
export function daysBetween(a: number, b: number): number {
  return Math.round((startOfDay(b) - startOfDay(a)) / DAY);
}

/** Weekday index where 0 is the configured first day of the week. */
export function weekdayIndex(ts: number, weekStart: WeekStart = 1): number {
  return (new Date(ts).getDay() - weekStart + 7) % 7;
}

const WEEKDAYS_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const WEEKDAYS_LONG = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function weekdayNames(weekStart: WeekStart = 1, long = false): string[] {
  const src = long ? WEEKDAYS_LONG : WEEKDAYS_SHORT;
  return Array.from({ length: 7 }, (_, i) => src[(i + weekStart) % 7]);
}

export function monthShort(monthIndex: number): string {
  return MONTHS_SHORT[monthIndex];
}

export function formatDayLabel(ts: number, now = Date.now()): string {
  const diff = daysBetween(ts, now);
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  const d = new Date(ts);
  const sameYear = d.getFullYear() === new Date(now).getFullYear();
  return `${WEEKDAYS_SHORT[d.getDay()]} ${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}${sameYear ? "" : ` ${d.getFullYear()}`}`;
}

export function formatShortDate(ts: number): string {
  const d = new Date(ts);
  return `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`;
}
