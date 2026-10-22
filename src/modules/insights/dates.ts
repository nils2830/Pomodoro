/**
 * Weekday and month names for insights. English keeps the app's own short
 * forms; other languages take theirs from Intl.
 */
import { localeTag, t, type Locale } from "@/core/i18n";
import * as en from "@/core/lib/date";
import { daysBetween, type WeekStart } from "@/core/lib/date";

const fmt = (locale: Locale, opts: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat(localeTag(locale), opts);
/** "man." → "man", so axis labels stay short. */
const bare = (s: string) => s.replace(/\.$/, "");

export function weekdayNames(locale: Locale, weekStart: WeekStart = 1, long = false): string[] {
  if (locale === "en") return en.weekdayNames(weekStart, long);
  const f = fmt(locale, { weekday: long ? "long" : "short" });
  // 7 January 2024 was a Sunday.
  return Array.from({ length: 7 }, (_, i) => bare(f.format(new Date(2024, 0, 7 + ((i + weekStart) % 7)))));
}

export function monthShort(locale: Locale, monthIndex: number): string {
  return locale === "en" ? en.monthShort(monthIndex) : bare(fmt(locale, { month: "short" }).format(new Date(2024, monthIndex, 1)));
}

export function monthYear(locale: Locale, ts: number): string {
  const d = new Date(ts);
  return locale === "en" ? `${en.monthShort(d.getMonth())} ${d.getFullYear()}` : fmt(locale, { month: "short", year: "numeric" }).format(d);
}

export function formatShortDate(locale: Locale, ts: number): string {
  return locale === "en" ? en.formatShortDate(ts) : fmt(locale, { day: "numeric", month: "short" }).format(ts);
}

export function formatDayLabel(locale: Locale, ts: number, now = Date.now()): string {
  if (locale === "en") return en.formatDayLabel(ts, now);
  const diff = daysBetween(ts, now);
  if (diff === 0) return t("Today");
  if (diff === 1) return t("Yesterday");
  const sameYear = new Date(ts).getFullYear() === new Date(now).getFullYear();
  return fmt(locale, { weekday: "short", day: "numeric", month: "short", year: sameYear ? undefined : "numeric" }).format(ts);
}
