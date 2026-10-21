"use client";

import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/core/lib/cn";

export function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(0);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    setWidth(el.getBoundingClientRect().width);
    const ro = new ResizeObserver(([e]) => setWidth(e.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, width] as const;
}

/** Rounds up to a tidy axis maximum. */
export function niceMax(v: number): number {
  if (v <= 0) return 1;
  const exp = Math.pow(10, Math.floor(Math.log10(v)));
  const f = v / exp;
  const nice = f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10;
  return nice * exp;
}

/** Bar with 4px rounded data end and a square baseline. */
export function columnPath(x: number, y: number, w: number, h: number, r = 4): string {
  if (h <= 0) return "";
  const rr = Math.min(r, w / 2, h);
  return `M${x} ${y + h} V${y + rr} Q${x} ${y} ${x + rr} ${y} H${x + w - rr} Q${x + w} ${y} ${x + w} ${y + rr} V${y + h} Z`;
}

export function rowBarPath(x: number, y: number, w: number, h: number, r = 4): string {
  if (w <= 0) return "";
  const rr = Math.min(r, h / 2, w);
  return `M${x} ${y} H${x + w - rr} Q${x + w} ${y} ${x + w} ${y + rr} V${y + h - rr} Q${x + w} ${y + h} ${x + w - rr} ${y + h} H${x} Z`;
}

export function Tooltip({ x, y, width, children }: { x: number; y: number; width: number; children: ReactNode }) {
  const edge = x < 90 ? "left" : x > width - 90 ? "right" : "center";
  return (
    <div
      role="tooltip"
      className="pointer-events-none absolute z-20 min-w-[120px] rounded-2xl bg-raised px-3.5 py-2.5 text-[13px] whitespace-nowrap shadow-[0_14px_36px_-12px_rgb(0_0_0/0.35)] ring-1 ring-line"
      style={{
        left: x,
        top: y,
        transform: `${edge === "center" ? "translateX(-50%) " : edge === "right" ? "translateX(-100%) " : ""}translateY(calc(-100% - 10px))`,
      }}
    >
      {children}
    </div>
  );
}

export function TooltipRow({ color, label, value }: { color?: string; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2 py-0.5">
      {color && <span className="h-[2px] w-3 shrink-0 rounded-full" style={{ background: color }} />}
      <span className="font-semibold text-ink tabular-nums">{value}</span>
      <span className="text-ink-3">{label}</span>
    </div>
  );
}

export function Legend({ items }: { items: { label: string; color: string }[] }) {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1.5 text-[12.5px] text-ink-2">
      {items.map((i) => (
        <li key={i.label} className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-[3px]" style={{ background: i.color }} />
          {i.label}
        </li>
      ))}
    </ul>
  );
}

export function DataTable({ columns, rows }: { columns: string[]; rows: (string | number)[][] }) {
  return (
    <div className="max-h-[340px] overflow-auto rounded-2xl ring-1 ring-line">
      <table className="w-full text-left text-[13px]">
        <thead className="sticky top-0 bg-surface">
          <tr>
            {columns.map((c, i) => (
              <th key={c} className={cn("border-b border-line px-3 py-2 font-medium text-ink-3", i > 0 && "text-right")}>
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, ri) => (
            <tr key={ri} className="border-b border-line/60 last:border-0">
              {r.map((cell, ci) => (
                <td key={ci} className={cn("px-3 py-1.5", ci > 0 && "text-right tabular-nums")}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** A numbered editorial block with an optional chart/table switch. */
export function Block({
  index,
  title,
  subtitle,
  children,
  table,
  legend,
  className,
  aside,
}: {
  index: string;
  title: string;
  subtitle?: ReactNode;
  children: ReactNode;
  table?: { columns: string[]; rows: (string | number)[][] };
  legend?: ReactNode;
  className?: string;
  aside?: ReactNode;
}) {
  const [showTable, setShowTable] = useState(false);
  return (
    <section className={cn("min-w-0 border-t border-ink/80 pt-4", className)}>
      <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-2">
        <div className="min-w-0">
          <div className="eyebrow text-ink-3">{index}</div>
          <h2 className="display mt-2 text-[24px] leading-tight">{title}</h2>
          {subtitle && <p className="mt-1 text-[13.5px] text-ink-3">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-2">
          {aside}
          {table && (
            <div className="inline-flex rounded-full bg-fill p-0.5 text-[12px] font-medium">
              {(["Chart", "Table"] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  aria-pressed={(v === "Table") === showTable}
                  onClick={() => setShowTable(v === "Table")}
                  className={cn("rounded-full px-2.5 py-1 transition-colors", (v === "Table") === showTable ? "bg-ink text-page" : "text-ink-3 hover:text-ink")}
                >
                  {v}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      {legend && !showTable && <div className="mt-4">{legend}</div>}
      <div className="mt-5">{showTable && table ? <DataTable {...table} /> : children}</div>
    </section>
  );
}
