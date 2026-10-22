"use client";

import { useState } from "react";
import { formatDuration, HOUR } from "@/core/lib/time";
import { useT } from "@/core/i18n";
import { columnPath, niceMax, Tooltip, TooltipRow, useWidth } from "./shared";

export interface Series {
  id: string;
  label: string;
  color: string;
}

export interface Column {
  key: string;
  label: string;
  title: string;
  values: Record<string, number>;
  total: number;
}

const H = 240;
const PAD = { top: 14, right: 4, bottom: 28, left: 40 };

/** Stacked columns of focus time per bucket, one segment per activity. */
export function StackedColumns({ columns, series }: { columns: Column[]; series: Series[] }) {
  const t = useT();
  const [ref, width] = useWidth<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);
  const innerW = Math.max(0, width - PAD.left - PAD.right);
  const innerH = H - PAD.top - PAD.bottom;
  const maxH = niceMax(Math.max(...columns.map((c) => c.total), 0) / HOUR || 1);
  const y = (ms: number) => (ms / HOUR / maxH) * innerH;
  const band = columns.length ? innerW / columns.length : 0;
  const barW = Math.max(3, Math.min(24, band * 0.62));
  const every = Math.max(1, Math.ceil(columns.length / Math.max(1, innerW / 52)));
  const ticks = [0, maxH / 2, maxH];
  const hovered = hover != null ? columns[hover] : null;

  return (
    <div ref={ref} className="relative w-full" onPointerLeave={() => setHover(null)}>
      {width > 0 && (
        <svg width={width} height={H} role="img" aria-label={t("Focus time per period, stacked by activity")}>
          {ticks.map((t) => {
            const ty = PAD.top + innerH - (t / maxH) * innerH;
            return (
              <g key={t}>
                <line x1={PAD.left} x2={width - PAD.right} y1={ty} y2={ty} stroke="var(--c-line)" strokeWidth={1} />
                <text x={PAD.left - 10} y={ty} textAnchor="end" dominantBaseline="central" fontSize="11" fill="var(--c-ink-3)" className="tabular-nums">
                  {t === 0 ? "0" : `${Number.isInteger(t) ? t : t.toFixed(1)}h`}
                </text>
              </g>
            );
          })}
          {columns.map((c, i) => {
            const x = PAD.left + i * band + (band - barW) / 2;
            let base = PAD.top + innerH;
            const visible = series.filter((s) => (c.values[s.id] ?? 0) > 0);
            return (
              <g key={c.key} opacity={hover == null || hover === i ? 1 : 0.45} className="transition-opacity">
                {visible.map((s, si) => {
                  const h = y(c.values[s.id]);
                  const top = si === visible.length - 1;
                  const gap = si > 0 ? 2 : 0;
                  const segH = Math.max(0, h - gap);
                  base -= h;
                  return top ? (
                    <path key={s.id} d={columnPath(x, base, barW, segH)} fill={s.color} />
                  ) : (
                    <rect key={s.id} x={x} y={base + 0} width={barW} height={segH} fill={s.color} />
                  );
                })}
                <rect
                  x={PAD.left + i * band}
                  y={PAD.top}
                  width={band}
                  height={innerH}
                  fill="transparent"
                  tabIndex={0}
                  aria-label={`${c.title}: ${formatDuration(c.total)}`}
                  onPointerEnter={() => setHover(i)}
                  onFocus={() => setHover(i)}
                  onBlur={() => setHover(null)}
                  className="outline-none"
                />
                {i % every === 0 && (
                  <text x={PAD.left + i * band + band / 2} y={H - 8} textAnchor="middle" fontSize="11" fill="var(--c-ink-3)">
                    {c.label}
                  </text>
                )}
              </g>
            );
          })}
          <line x1={PAD.left} x2={width - PAD.right} y1={PAD.top + innerH} y2={PAD.top + innerH} stroke="var(--c-ink-3)" strokeOpacity={0.5} />
        </svg>
      )}
      {hovered && hover != null && (
        <Tooltip x={PAD.left + hover * band + band / 2} y={PAD.top + innerH - y(hovered.total)} width={width}>
          <div className="mb-1 text-[12px] text-ink-3">{hovered.title}</div>
          <div className="mb-1 text-[15px] font-semibold tabular-nums">{formatDuration(hovered.total)}</div>
          {series
            .filter((s) => (hovered.values[s.id] ?? 0) > 0)
            .map((s) => (
              <TooltipRow key={s.id} color={s.color} label={s.label} value={formatDuration(hovered.values[s.id])} />
            ))}
        </Tooltip>
      )}
    </div>
  );
}
