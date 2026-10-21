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
  const r = 112;
  // Wedge drawn counter-clockwise from twelve, like the physical timers.
  const [x, y] = polar(-sweep, r);
  const path = sweep <= 0.01 ? "" : `M150 150 L150 ${150 - r} A${r} ${r} 0 ${sweep > 180 ? 1 : 0} 0 ${x} ${y} Z`;
  const labels = Array.from({ length: 12 }, (_, i) => i);
  return (
    <div className="relative grid aspect-square h-full max-h-full place-items-center">
      <svg viewBox="0 0 300 300" className="size-full">
        <circle cx="150" cy="150" r="140" fill="var(--c-ink)" fillOpacity="0.07" />
        {path && <path d={path} fill="var(--c-ink)" fillOpacity="0.88" />}
        {Array.from({ length: 60 }, (_, i) => {
          const major = i % 5 === 0;
          const [x1, y1] = polar(-i * 6, major ? 118 : 123);
          const [x2, y2] = polar(-i * 6, 128);
          return (
            <line
              key={i}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="var(--c-ink)"
              strokeOpacity={major ? 0.8 : 0.3}
              strokeWidth={major ? 2.5 : 1.25}
              strokeLinecap="round"
            />
          );
        })}
        {labels.map((i) => {
          const [lx, ly] = polar(-i * 30, 138 - 4);
          return (
            <text
              key={i}
              x={lx}
              y={ly}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize="10"
              fontFamily="var(--font-mono)"
              fill="var(--c-ink)"
              fillOpacity="0.55"
            >
              {(i * scale) / 12}
            </text>
          );
        })}
        <circle cx="150" cy="150" r="16" fill="var(--c-page)" />
        <circle cx="150" cy="150" r="9" fill="var(--c-ink)" />
      </svg>
    </div>
  );
}
