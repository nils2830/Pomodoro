"use client";

import { useState } from "react";
import { columnPath, niceMax, Tooltip, useWidth } from "./shared";

export interface SimpleColumn {
  key: string;
  label: string;
  value: number;
  title: string;
  display: string;
}

const PAD = { top: 22, right: 4, bottom: 28, left: 8 };

/** Single-series columns, one hue. Values sit on the caps when there's room. */
export function Columns({
  data,
  height = 200,
  color = "var(--seq)",
  labelEvery = 1,
}: {
  data: SimpleColumn[];
  height?: number;
  color?: string;
  labelEvery?: number;
}) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);
  const innerW = Math.max(0, width - PAD.left - PAD.right);
  const innerH = height - PAD.top - PAD.bottom;
  const max = niceMax(Math.max(...data.map((d) => d.value), 0) || 1);
  const band = data.length ? innerW / data.length : 0;
  const barW = Math.max(3, Math.min(24, band * 0.6));
  const capLabels = band >= 36;
  const h = (v: number) => (v / max) * innerH;
  const hovered = hover != null ? data[hover] : null;

  return (
    <div ref={ref} className="relative w-full" onPointerLeave={() => setHover(null)}>
      {width > 0 && (
        <svg width={width} height={height} role="img">
          <line x1={PAD.left} x2={width - PAD.right} y1={PAD.top + innerH} y2={PAD.top + innerH} stroke="var(--c-ink-3)" strokeOpacity={0.5} />
          {data.map((d, i) => {
            const x = PAD.left + i * band + (band - barW) / 2;
            const bh = h(d.value);
            const top = PAD.top + innerH - bh;
            return (
              <g key={d.key} opacity={hover == null || hover === i ? 1 : 0.45} className="transition-opacity">
                <path d={columnPath(x, top, barW, bh)} fill={color} />
                {capLabels && d.value > 0 && (
                  <text x={x + barW / 2} y={top - 6} textAnchor="middle" fontSize="11" fontWeight={600} fill="var(--c-ink-2)" className="tabular-nums">
                    {d.display}
                  </text>
                )}
                {i % labelEvery === 0 && (
                  <text x={PAD.left + i * band + band / 2} y={height - 8} textAnchor="middle" fontSize="11" fill="var(--c-ink-3)">
                    {d.label}
                  </text>
                )}
                <rect
                  x={PAD.left + i * band}
                  y={0}
                  width={band}
                  height={height}
                  fill="transparent"
                  tabIndex={0}
                  aria-label={`${d.title}: ${d.display}`}
                  onPointerEnter={() => setHover(i)}
                  onFocus={() => setHover(i)}
                  onBlur={() => setHover(null)}
                  className="outline-none"
                />
              </g>
            );
          })}
        </svg>
      )}
      {hovered && hover != null && (
        <Tooltip x={PAD.left + hover * band + band / 2} y={PAD.top + innerH - h(hovered.value)} width={width}>
          <div className="text-[15px] font-semibold tabular-nums">{hovered.display}</div>
          <div className="text-[12px] text-ink-3">{hovered.title}</div>
        </Tooltip>
      )}
    </div>
  );
}
