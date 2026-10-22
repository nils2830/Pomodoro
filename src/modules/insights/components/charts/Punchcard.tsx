"use client";

import { useState } from "react";
import { formatHourLabel, type HourFormat } from "@/core/lib/time";
import { useT } from "@/core/i18n";
import { Tooltip, useWidth } from "./shared";

const PAD = { top: 8, right: 4, bottom: 26, left: 40 };

/** When sit-downs begin: weekday rows × hour columns, dot area = count. */
export function Punchcard({ grid, max, weekdays, hourFormat }: { grid: number[][]; max: number; weekdays: string[]; hourFormat: HourFormat }) {
  const t = useT();
  const [ref, width] = useWidth<HTMLDivElement>();
  const [hover, setHover] = useState<[number, number] | null>(null);
  const innerW = Math.max(0, width - PAD.left - PAD.right);
  const cell = innerW / 24;
  const rowH = Math.max(22, Math.min(34, cell * 1.1));
  const height = PAD.top + rowH * 7 + PAD.bottom;
  const maxR = Math.min(cell, rowH) / 2 - 1.5;
  const r = (n: number) => (n <= 0 || max <= 0 ? 0 : Math.max(2.5, Math.sqrt(n / max) * maxR));
  const cx = (h: number) => PAD.left + h * cell + cell / 2;
  const cy = (d: number) => PAD.top + d * rowH + rowH / 2;

  return (
    <div ref={ref} className="relative w-full" onPointerLeave={() => setHover(null)}>
      {width > 0 && (
        <svg width={width} height={height} role="img" aria-label={t("Sit-down start times by weekday and hour")}>
          {weekdays.map((name, d) => (
            <g key={name}>
              <text x={PAD.left - 10} y={cy(d)} textAnchor="end" dominantBaseline="central" fontSize="11" fill="var(--c-ink-3)">
                {name}
              </text>
              <line x1={PAD.left} x2={width - PAD.right} y1={cy(d)} y2={cy(d)} stroke="var(--c-line)" strokeWidth={1} />
            </g>
          ))}
          {Array.from({ length: 24 }, (_, h) =>
            h % 3 === 0 ? (
              <text key={h} x={cx(h)} y={height - 8} textAnchor="middle" fontSize="11" fill="var(--c-ink-3)">
                {formatHourLabel(h, hourFormat)}
              </text>
            ) : null,
          )}
          {grid.map((row, d) =>
            row.map((n, h) => {
              const active = hover?.[0] === d && hover?.[1] === h;
              return (
                <g key={`${d}-${h}`}>
                  {n > 0 && <circle cx={cx(h)} cy={cy(d)} r={r(n) + (active ? 1.5 : 0)} fill="var(--seq)" stroke="var(--c-page)" strokeWidth={2} />}
                  <rect x={cx(h) - cell / 2} y={cy(d) - rowH / 2} width={cell} height={rowH} fill="transparent" onPointerEnter={() => setHover([d, h])} />
                </g>
              );
            }),
          )}
        </svg>
      )}
      {hover && (
        <Tooltip x={cx(hover[1])} y={cy(hover[0]) - r(grid[hover[0]][hover[1]])} width={width}>
          <div className="text-[15px] font-semibold tabular-nums">
            {t(grid[hover[0]][hover[1]] === 1 ? "{count} sit-down" : "{count} sit-downs", { count: grid[hover[0]][hover[1]] })}
          </div>
          <div className="text-[12px] text-ink-3">
            {t("{day}, starting {from}:00–{to}:00", {
              day: weekdays[hover[0]],
              from: formatHourLabel(hover[1], hourFormat),
              to: formatHourLabel((hover[1] + 1) % 24, hourFormat),
            })}
          </div>
        </Tooltip>
      )}
    </div>
  );
}
