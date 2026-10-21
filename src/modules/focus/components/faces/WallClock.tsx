import { formatTimeOfDay, MINUTE } from "@/core/lib/time";
import type { FaceProps } from "./types";

const polar = (deg: number, r: number) => {
  const a = ((deg - 90) * Math.PI) / 180;
  return [150 + r * Math.cos(a), 150 + r * Math.sin(a)] as const;
};

function wedge(fromDeg: number, toDeg: number, r: number) {
  const sweep = Math.max(0, Math.min(359.99, toDeg - fromDeg));
  const [x1, y1] = polar(fromDeg, r);
  const [x2, y2] = polar(fromDeg + sweep, r);
  return `M150 150 L${x1} ${y1} A${r} ${r} 0 ${sweep > 180 ? 1 : 0} 1 ${x2} ${y2} Z`;
}

/**
 * An ordinary wall clock showing the actual time of day (no second hand),
 * with the session painted onto the dial: solid for time spent, faint for
 * time still to go.
 */
export function WallClock(p: FaceProps) {
  const d = new Date(p.now);
  const minutes = d.getMinutes() + d.getSeconds() / 60;
  const hours = (d.getHours() % 12) + minutes / 60;
  const minuteDeg = minutes * 6;
  const hourDeg = hours * 30;

  const isFlow = p.flow && p.mode === "focus";
  const start = p.startedAt ?? p.now;
  const startMin = new Date(start).getMinutes() + new Date(start).getSeconds() / 60;
  const startDeg = p.status === "idle" ? minuteDeg : startMin * 6;
  const spentDeg = Math.min(360, (p.elapsedMs / MINUTE) * 6);
  const totalDeg = isFlow ? spentDeg : Math.min(360, (p.plannedMs / MINUTE) * 6);

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-3">
      <div className="relative min-h-0 w-full flex-1">
        <svg viewBox="0 0 300 300" className="absolute inset-0 size-full">
          <circle cx="150" cy="150" r="138" fill="var(--c-ink)" fillOpacity="0.06" />
          {!isFlow && <path d={wedge(startDeg, startDeg + totalDeg, 118)} fill="var(--c-ink)" fillOpacity="0.14" />}
          <path d={wedge(startDeg, startDeg + spentDeg, 118)} fill="var(--c-ink)" fillOpacity="0.38" style={{ transition: "d 1s linear" }} />
          {Array.from({ length: 60 }, (_, i) => {
            const major = i % 5 === 0;
            const [x1, y1] = polar(i * 6, major ? 122 : 128);
            const [x2, y2] = polar(i * 6, 134);
            return (
              <line
                key={i}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="var(--c-ink)"
                strokeOpacity={major ? 0.9 : 0.35}
                strokeWidth={major ? 3 : 1.5}
                strokeLinecap="round"
              />
            );
          })}
          <g style={{ transform: `rotate(${hourDeg}deg)`, transformOrigin: "150px 150px", transition: "transform 1s linear" }}>
            <line x1="150" y1="160" x2="150" y2="84" stroke="var(--c-ink)" strokeWidth="7" strokeLinecap="round" />
          </g>
          <g style={{ transform: `rotate(${minuteDeg}deg)`, transformOrigin: "150px 150px", transition: "transform 1s linear" }}>
            <line x1="150" y1="166" x2="150" y2="34" stroke="var(--c-ink)" strokeWidth="4.5" strokeLinecap="round" />
          </g>
          <circle cx="150" cy="150" r="7" fill="var(--c-ink)" />
          <circle cx="150" cy="150" r="2.5" fill="var(--c-page)" />
        </svg>
      </div>
      <div className="shrink-0 text-center text-[13px] whitespace-nowrap text-ink-2 tabular-nums">
        {p.status === "idle"
          ? `${formatTimeOfDay(p.now, p.hourFormat)} now`
          : isFlow
            ? `Since ${formatTimeOfDay(start, p.hourFormat)}`
            : `${formatTimeOfDay(start, p.hourFormat)} → ${formatTimeOfDay(p.endsAt ?? p.now + p.remainingMs, p.hourFormat)}`}
      </div>
    </div>
  );
}
