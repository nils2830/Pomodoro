import { formatTimeOfDay } from "@/core/lib/time";
import type { FaceProps } from "./types";

/** A sun crossing the sky over the session; breaks get a moon instead. */
export function Sun(p: FaceProps) {
  const t = Math.min(1, Math.max(0, p.progress));
  const cx = 200;
  const cy = 200;
  const r = 160;
  const angle = Math.PI * (1 - t);
  const x = cx + r * Math.cos(angle);
  const y = cy - r * Math.sin(angle);
  const night = p.mode !== "focus";
  const arc = `M${cx - r} ${cy} A${r} ${r} 0 0 1 ${cx + r} ${cy}`;
  const len = Math.PI * r;
  const endsAt = p.endsAt ?? p.now + p.remainingMs;

  return (
    <div className="relative h-full w-full">
      <svg viewBox="0 0 400 268" className="absolute inset-0 size-full overflow-visible">
        <defs>
          <radialGradient id="sun-glow">
            <stop offset="0%" stopColor="var(--c-ink)" stopOpacity="0.35" />
            <stop offset="100%" stopColor="var(--c-ink)" stopOpacity="0" />
          </radialGradient>
          <mask id="moon-cut">
            <rect x="0" y="0" width="400" height="250" fill="white" />
            <circle cx={x + 9} cy={y - 7} r="17" fill="black" />
          </mask>
        </defs>
        <path d={arc} fill="none" stroke="var(--c-ink)" strokeOpacity="0.16" strokeWidth="2" />
        <path
          d={arc}
          fill="none"
          stroke="var(--c-ink)"
          strokeOpacity="0.7"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray={len}
          strokeDashoffset={len * (1 - t)}
          style={{ transition: "stroke-dashoffset 1s linear" }}
        />
        <line x1="10" y1={cy} x2="390" y2={cy} stroke="var(--c-ink)" strokeOpacity="0.5" strokeWidth="2" strokeLinecap="round" />
        {[120, 80, 40].map((dx, i) => (
          <line
            key={i}
            x1={cx - dx}
            y1={cy + 12 + i * 10}
            x2={cx + dx}
            y2={cy + 12 + i * 10}
            stroke="var(--c-ink)"
            strokeOpacity={0.16 - i * 0.04}
            strokeWidth="2"
            strokeLinecap="round"
          />
        ))}
        <g style={{ transform: `translate(${x}px, ${y}px)`, transition: "transform 1s linear" }}>
          <circle r="54" fill="url(#sun-glow)" />
        </g>
        {night ? (
          <circle cx={x} cy={y} r="20" fill="var(--c-ink)" mask="url(#moon-cut)" style={{ transition: "cx 1s linear, cy 1s linear" }} />
        ) : (
          <circle cx={x} cy={y} r="20" fill="var(--c-ink)" style={{ transition: "cx 1s linear, cy 1s linear" }} />
        )}
        <text x={cx - r} y={262} textAnchor="middle" fontSize="12" fill="var(--c-ink)" fillOpacity="0.55">
          {p.startedAt ? formatTimeOfDay(p.startedAt, p.hourFormat) : "now"}
        </text>
        <text x={cx + r} y={262} textAnchor="middle" fontSize="12" fill="var(--c-ink)" fillOpacity="0.55">
          {formatTimeOfDay(endsAt, p.hourFormat)}
        </text>
      </svg>
    </div>
  );
}
