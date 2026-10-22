import { formatTimeOfDay } from "@/core/lib/time";
import { useT } from "@/core/i18n";
import type { FaceProps } from "./types";

/** A ring that empties smoothly. The centre names when it ends, not how many seconds remain. */
export function Ring(p: FaceProps) {
  const t = useT();
  const r = 120;
  const c = 2 * Math.PI * r;
  const remaining = 1 - p.progress;
  const endsAt = p.endsAt ?? p.now + p.remainingMs;
  return (
    <div className="relative grid aspect-square h-full max-h-full place-items-center">
      <svg viewBox="0 0 280 280" className="absolute inset-0 size-full -rotate-90">
        <circle cx="140" cy="140" r={r} fill="none" stroke="var(--c-ink)" strokeOpacity="0.14" strokeWidth="14" />
        <circle
          cx="140"
          cy="140"
          r={r}
          fill="none"
          stroke="var(--c-ink)"
          strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - remaining)}
          style={{ transition: "stroke-dashoffset 1s linear" }}
        />
      </svg>
      <div className="relative text-center">
        <div className="eyebrow text-ink-3">{p.status === "idle" ? t("would end") : p.status === "paused" ? t("paused") : t("ends")}</div>
        <div className="display mt-2 text-[min(16cqw,24cqh)] leading-none">{formatTimeOfDay(endsAt, p.hourFormat)}</div>
      </div>
    </div>
  );
}
