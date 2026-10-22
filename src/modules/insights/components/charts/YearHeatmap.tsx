"use client";

import { useState } from "react";
import { useLocale, useT } from "@/core/i18n";
import { formatDuration } from "@/core/lib/time";
import type { HeatDay } from "../../analytics";
import { formatDayLabel, monthShort } from "../../dates";
import { Tooltip, useWidth } from "./shared";

const STEPS = [0, 32, 56, 78, 100];

export function heatColor(level: number): string {
  if (level === 0) return "color-mix(in oklab, var(--c-ink) 7%, transparent)";
  return `color-mix(in oklab, var(--seq) ${STEPS[level]}%, var(--c-page))`;
}

/** Quantile thresholds over non-zero days so the scale adapts to the person. */
function thresholds(values: number[]): number[] {
  const nz = values.filter((v) => v > 0).sort((a, b) => a - b);
  if (nz.length === 0) return [1, 2, 3];
  const q = (p: number) => nz[Math.min(nz.length - 1, Math.floor(p * nz.length))];
  return [q(0.25), q(0.5), q(0.75)];
}

export function YearHeatmap({ columns, weekdays }: { columns: HeatDay[][]; weekdays: string[] }) {
  const t = useT();
  const locale = useLocale();
  const [ref, width] = useWidth<HTMLDivElement>();
  const [hover, setHover] = useState<HeatDay | null>(null);
  const left = 30;
  const top = 18;
  const gap = 3;
  const size = Math.max(6, Math.min(20, (width - left) / columns.length - gap));
  const step = size + gap;
  const height = top + step * 7;
  const th = thresholds(columns.flat().map((d) => d.ms));
  const level = (ms: number) => (ms <= 0 ? 0 : ms <= th[0] ? 1 : ms <= th[1] ? 2 : ms <= th[2] ? 3 : 4);
  const pos = (d: HeatDay) => {
    for (let w = 0; w < columns.length; w++) {
      const i = columns[w].indexOf(d);
      if (i >= 0) return { x: left + w * step + size / 2, y: top + i * step };
    }
    return { x: 0, y: 0 };
  };

  return (
    <div ref={ref} className="relative w-full overflow-hidden" onPointerLeave={() => setHover(null)}>
      {width > 0 && (
        <svg width={Math.min(width, left + columns.length * step)} height={height} role="img" aria-label={t("Focus time per day over the last year")}>
          {columns.map((col, w) => {
            const first = new Date(col[0].ts);
            const prev = w > 0 ? new Date(columns[w - 1][0].ts) : null;
            const showMonth = !prev || prev.getMonth() !== first.getMonth();
            return (
              <g key={w}>
                {showMonth && w < columns.length - 2 && (
                  <text x={left + w * step} y={10} fontSize="11" fill="var(--c-ink-3)">
                    {monthShort(locale, first.getMonth())}
                  </text>
                )}
                {col.map((d, i) =>
                  d.future ? null : (
                    <rect
                      key={d.key}
                      x={left + w * step}
                      y={top + i * step}
                      width={size}
                      height={size}
                      rx={Math.min(3, size / 3)}
                      fill={heatColor(level(d.ms))}
                      stroke={hover === d ? "var(--c-ink)" : "none"}
                      strokeWidth={1.5}
                      onPointerEnter={() => setHover(d)}
                    />
                  ),
                )}
              </g>
            );
          })}
          {[0, 2, 4].map((i) => (
            <text key={i} x={0} y={top + i * step + size / 2} dominantBaseline="central" fontSize="10.5" fill="var(--c-ink-3)">
              {weekdays[i]}
            </text>
          ))}
        </svg>
      )}
      <div className="mt-3 flex items-center justify-end gap-1.5 text-[12px] text-ink-3">
        {t("Less")}
        {[0, 1, 2, 3, 4].map((l) => (
          <span key={l} className="size-3 rounded-[3px]" style={{ background: heatColor(l) }} />
        ))}
        {t("More")}
      </div>
      {hover && (
        <Tooltip x={pos(hover).x} y={pos(hover).y} width={width}>
          <div className="text-[15px] font-semibold tabular-nums">{hover.ms > 0 ? formatDuration(hover.ms) : t("No focus")}</div>
          <div className="text-[12px] text-ink-3">{formatDayLabel(locale, hover.ts)}</div>
        </Tooltip>
      )}
    </div>
  );
}
