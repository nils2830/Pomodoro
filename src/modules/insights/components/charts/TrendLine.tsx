"use client";

import { useState } from "react";
import { formatDuration, HOUR } from "@/core/lib/time";
import { useLocale, useT } from "@/core/i18n";
import { formatShortDate } from "../../dates";
import { niceMax, Tooltip, useWidth } from "./shared";

const H = 200;
const PAD = { top: 16, right: 92, bottom: 28, left: 40 };

/** Weekly focus as one line with a light wash, crosshair on hover. */
export function TrendLine({ data }: { data: { start: number; totalMs: number }[] }) {
  const t = useT();
  const locale = useLocale();
  const [ref, width] = useWidth<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);
  const innerW = Math.max(0, width - PAD.left - PAD.right);
  const innerH = H - PAD.top - PAD.bottom;
  const maxH = niceMax(Math.max(...data.map((d) => d.totalMs), 0) / HOUR || 1);
  const x = (i: number) => PAD.left + (data.length > 1 ? (i / (data.length - 1)) * innerW : innerW / 2);
  const y = (ms: number) => PAD.top + innerH - (ms / HOUR / maxH) * innerH;
  const line = data.map((d, i) => `${i ? "L" : "M"}${x(i)} ${y(d.totalMs)}`).join(" ");
  const area = `${line} L${x(data.length - 1)} ${PAD.top + innerH} L${x(0)} ${PAD.top + innerH} Z`;
  const last = data[data.length - 1];
  const every = Math.max(1, Math.ceil(data.length / Math.max(1, innerW / 64)));

  return (
    <div
      ref={ref}
      className="relative w-full"
      onPointerMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const px = e.clientX - rect.left - PAD.left;
        const i = Math.round((px / Math.max(1, innerW)) * (data.length - 1));
        setHover(Math.max(0, Math.min(data.length - 1, i)));
      }}
      onPointerLeave={() => setHover(null)}
    >
      {width > 0 && data.length > 0 && (
        <svg width={width} height={H} role="img" aria-label={t("Focus time per week")}>
          {[0, maxH / 2, maxH].map((t) => (
            <g key={t}>
              <line x1={PAD.left} x2={width - PAD.right} y1={y(t * HOUR)} y2={y(t * HOUR)} stroke="var(--c-line)" />
              <text x={PAD.left - 10} y={y(t * HOUR)} textAnchor="end" dominantBaseline="central" fontSize="11" fill="var(--c-ink-3)">
                {t === 0 ? "0" : `${Number.isInteger(t) ? t : t.toFixed(1)}h`}
              </text>
            </g>
          ))}
          <path d={area} fill="var(--seq)" fillOpacity={0.1} />
          <path d={line} fill="none" stroke="var(--seq)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
          {data.map((d, i) =>
            i % every === 0 ? (
              <text key={d.start} x={x(i)} y={H - 8} textAnchor="middle" fontSize="11" fill="var(--c-ink-3)">
                {formatShortDate(locale, d.start)}
              </text>
            ) : null,
          )}
          {hover != null && (
            <>
              <line x1={x(hover)} x2={x(hover)} y1={PAD.top} y2={PAD.top + innerH} stroke="var(--c-ink-3)" strokeOpacity={0.6} />
              <circle cx={x(hover)} cy={y(data[hover].totalMs)} r={5} fill="var(--seq)" stroke="var(--c-page)" strokeWidth={2} />
            </>
          )}
          {last && (
            <>
              <circle cx={x(data.length - 1)} cy={y(last.totalMs)} r={4.5} fill="var(--seq)" stroke="var(--c-page)" strokeWidth={2} />
              <text x={x(data.length - 1) + 10} y={y(last.totalMs)} dominantBaseline="central" fontSize="12" fontWeight={600} fill="var(--c-ink)">
                {formatDuration(last.totalMs)}
                {Date.now() - last.start < 7 * 86_400_000 && (
                  <tspan fill="var(--c-ink-3)" fontWeight={400}>
                    {" "}
                    {t("so far")}
                  </tspan>
                )}
              </text>
            </>
          )}
        </svg>
      )}
      {hover != null && data[hover] && (
        <Tooltip x={x(hover)} y={y(data[hover].totalMs)} width={width}>
          <div className="text-[15px] font-semibold tabular-nums">{formatDuration(data[hover].totalMs)}</div>
          <div className="text-[12px] text-ink-3">{t("Week of {date}", { date: formatShortDate(locale, data[hover].start) })}</div>
        </Tooltip>
      )}
    </div>
  );
}
