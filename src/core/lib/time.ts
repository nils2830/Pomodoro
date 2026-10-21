export const SECOND = 1000;
export const MINUTE = 60 * SECOND;
export const HOUR = 60 * MINUTE;
export const DAY = 24 * HOUR;

/** 25:00 style clock for a duration. Rounds up so 0.4s left still shows 00:01. */
export function formatClock(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / SECOND));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const mm = String(m).padStart(2, "0");
  const ss = String(s).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

/** Elapsed clock for count-up timers (floors instead of ceiling). */
export function formatElapsed(ms: number): string {
  return formatClock(Math.floor(Math.max(0, ms) / SECOND) * SECOND);
}

/** Human duration: 1h 05m, 45m, 30s. */
export function formatDuration(ms: number, opts: { seconds?: boolean } = {}): string {
  const totalMin = Math.round(ms / MINUTE);
  if (opts.seconds && ms < MINUTE) return `${Math.round(ms / SECOND)}s`;
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${String(m).padStart(2, "0")}m`;
}

/** Decimal hours with one decimal: 2.4h */
export function formatHours(ms: number): string {
  const h = ms / HOUR;
  if (h >= 100) return `${Math.round(h)}h`;
  return `${h.toFixed(1).replace(/\.0$/, "")}h`;
}

export type HourFormat = "24h" | "12h";

export function formatTimeOfDay(ts: number | Date, format: HourFormat = "24h"): string {
  const d = typeof ts === "number" ? new Date(ts) : ts;
  const h = d.getHours();
  const m = String(d.getMinutes()).padStart(2, "0");
  if (format === "24h") return `${String(h).padStart(2, "0")}:${m}`;
  const suffix = h >= 12 ? "pm" : "am";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${m}${suffix}`;
}

export function formatHourLabel(hour: number, format: HourFormat = "24h"): string {
  if (format === "24h") return String(hour).padStart(2, "0");
  const suffix = hour >= 12 ? "p" : "a";
  const h12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${h12}${suffix}`;
}
