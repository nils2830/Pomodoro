import type { FaceProps } from "./types";

const WAVE = "M0 12 Q 25 0 50 12 T 100 12 T 150 12 T 200 12 V 60 H 0 Z";

/** A vessel that drains as the session runs. No numbers at all. */
export function Tide(p: FaceProps) {
  const level = 1 - Math.min(1, Math.max(0, p.progress));
  const running = p.status === "running";
  return (
    <div className="relative grid aspect-square h-full max-h-full place-items-center">
      <div className="relative size-[92%] overflow-hidden rounded-full bg-ink/8 ring-2 ring-ink/25">
        <div className="absolute inset-x-0 bottom-0 transition-[height] duration-1000 ease-linear" style={{ height: `${level * 100}%` }}>
          <div className="absolute inset-x-0 top-0 h-6 -translate-y-[calc(100%-6px)] overflow-hidden">
            <svg
              viewBox="0 0 200 60"
              preserveAspectRatio="none"
              className="absolute top-0 left-0 h-[60px] w-[200%] opacity-45"
              style={{ animation: running ? "drift 7s linear infinite" : undefined }}
            >
              <path d={WAVE} fill="var(--c-ink)" />
            </svg>
            <svg
              viewBox="0 0 200 60"
              preserveAspectRatio="none"
              className="absolute top-1 left-0 h-[60px] w-[200%] opacity-80"
              style={{ animation: running ? "drift 11s linear infinite reverse" : undefined }}
            >
              <path d={WAVE} fill="var(--c-ink)" />
            </svg>
          </div>
          <div className="absolute inset-0 bg-ink/80" />
        </div>
        <div className="pointer-events-none absolute inset-0 rounded-full bg-[radial-gradient(circle_at_30%_25%,rgb(255_255_255/0.22),transparent_45%)]" />
      </div>
    </div>
  );
}
