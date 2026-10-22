import { MINUTE } from "@/core/lib/time";
import type { FaceProps } from "./types";

const polar = (deg: number, r: number) => {
  const a = ((deg - 90) * Math.PI) / 180;
  return [150 + r * Math.cos(a), 150 + r * Math.sin(a)] as const;
};

/** Visual-timer style: a wedge of remaining time that shrinks towards twelve. */
export function Dial(p: FaceProps) {
  const plannedMin = p.plannedMs / MINUTE;
  const scale = plannedMin <= 60 ? 60 : Math.ceil(plannedMin / 30) * 30;
  const remainingMin = p.remainingMs / MINUTE;
  const sweep = Math.max(0, Math.min(359.99, (remainingMin / scale) * 360));
  const r = 114;
  // Wedge drawn counter-clockwise from twelve, like the physical timers.
  const [x, y] = polar(-sweep, r);
  const path = sweep <= 0.01 ? "" : `M150 150 L150 ${150 - r} A${r} ${r} 0 ${sweep > 180 ? 1 : 0} 0 ${x} ${y} Z`;
  const [ex, ey] = polar(-sweep, r);
  return (
    <div className="relative grid aspect-square h-full max-h-full place-items-center">
      {/* Extra room around the dial so the numbers sit outside the ticks without clipping. */}
      <svg viewBox="-14 -14 328 328" className="size-full">
        <circle cx="150" cy="150" r="132" fill="var(--c-ink)" fillOpacity="0.06" />
        <circle cx="150" cy="150" r="132" fill="none" stroke="var(--c-ink)" strokeOpacity="0.12" />
        {path && <path d={path} fill="var(--c-ink)" fillOpacity="0.86" style={{ transition: "d 1s linear" }} />}
        {path && (
          <line x1="150" y1="150" x2={ex} y2={ey} stroke="var(--c-ink)" strokeWidth="1.5" strokeLinecap="round" style={{ transition: "all 1s linear" }} />
        )}
        {Array.from({ length: 60 }, (_, i) => {
          const major = i % 5 === 0;
          const [x1, y1] = polar(-i * 6, major ? 119 : 123);
          const [x2, y2] = polar(-i * 6, 128);
          return (
            <line
              key={i}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="var(--c-ink)"
              strokeOpacity={major ? 0.7 : 0.25}
              strokeWidth={major ? 2 : 1}
              strokeLinecap="round"
            />
          );
        })}
        {Array.from({ length: 12 }, (_, i) => {
          const [lx, ly] = polar(-i * 30, 146);
          return (
            <text
              key={i}
              x={lx}
              y={ly}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize="11.5"
              fontWeight="500"
              fill="var(--c-ink)"
              fillOpacity="0.5"
              style={{ fontVariantNumeric: "tabular-nums" }}
            >
              {(i * scale) / 12}
            </text>
          );
        })}
        <circle cx="150" cy="150" r="8" fill="var(--c-ink)" />
        <circle cx="150" cy="150" r="3" fill="var(--c-page)" />
      </svg>
    </div>
  );
}
