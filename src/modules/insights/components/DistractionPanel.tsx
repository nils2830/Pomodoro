"use client";

import { useT } from "@/core/i18n";
import type { DistractionStats } from "../analytics";

/** How often focus slips, from what was noted after each session. */
export function DistractionPanel({ stats }: { stats: DistractionStats }) {
  const t = useT();
  if (stats.logged === 0) {
    return (
      <div className="rounded-[24px] border border-dashed border-line px-6 py-5 text-[14px] text-ink-3">
        {t("After each focus session, Steen asks how often you got distracted. Answer a few times and your pattern shows up here.")}
      </div>
    );
  }
  const max = Math.max(1, ...stats.recent.map((r) => r.count));
  const cells: [string, string][] = [
    [stats.perSession.toFixed(1), t("distractions per session")],
    [`${Math.round(stats.minutesPerSession)} min`, t("lost per session, roughly")],
    [`${Math.round(stats.cleanShare * 100)}%`, t("sessions with none")],
  ];
  return (
    <div className="grid gap-6 rounded-[28px] bg-surface p-6 md:grid-cols-[1fr_1.1fr] md:items-end">
      <div>
        <div className="eyebrow text-ink-3">{t("Distractions")}</div>
        <div className="mt-4 grid grid-cols-3 gap-3">
          {cells.map(([value, label]) => (
            <div key={label}>
              <div className="text-[clamp(1.5rem,3vw,2.1rem)] leading-none font-semibold tracking-[-0.03em] tabular-nums">{value}</div>
              <div className="mt-1.5 text-[12.5px] leading-snug text-ink-3">{label}</div>
            </div>
          ))}
        </div>
        <p className="mt-4 text-[12.5px] text-ink-3">{t("From {n} sessions where you noted it.", { n: stats.logged })}</p>
      </div>
      <div>
        <div className="flex h-24 items-end gap-1.5" role="img" aria-label={t("Distractions in your last sessions")}>
          {stats.recent.map((r, i) => (
            <div
              key={i}
              title={t("{count} distractions, about {min} min", { count: r.count, min: r.minutes })}
              className="flex-1 rounded-t-md rounded-b-sm bg-ink/70"
              style={{ height: `${Math.max(6, (r.count / max) * 100)}%`, opacity: r.count === 0 ? 0.18 : 0.45 + (r.count / max) * 0.55 }}
            />
          ))}
        </div>
        <div className="mt-2 flex justify-between text-[11.5px] text-ink-3">
          <span>{t("Earlier")}</span>
          <span>{t("Latest session")}</span>
        </div>
      </div>
    </div>
  );
}
