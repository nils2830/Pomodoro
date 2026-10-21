"use client";

import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { LockSimple } from "@phosphor-icons/react";
import { cn } from "../lib/cn";

export interface SegmentOption<T extends string> {
  value: T;
  label: ReactNode;
  icon?: ReactNode;
  locked?: boolean;
  title?: string;
}

/** Pill tabs with a sliding indicator. Locked options call onLocked instead. */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  onLocked,
  size = "md",
  className,
  ariaLabel,
}: {
  options: SegmentOption<T>[];
  value: T;
  onChange: (v: T) => void;
  onLocked?: (v: T) => void;
  size?: "sm" | "md";
  className?: string;
  ariaLabel: string;
}) {
  const refs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [box, setBox] = useState<{ left: number; width: number } | null>(null);

  useLayoutEffect(() => {
    const measure = () => {
      const el = refs.current[value];
      if (el) setBox({ left: el.offsetLeft, width: el.offsetWidth });
    };
    measure();
    const ro = new ResizeObserver(measure);
    Object.values(refs.current).forEach((el) => el && ro.observe(el));
    return () => ro.disconnect();
  }, [value, options.length]);

  return (
    <div role="tablist" aria-label={ariaLabel} className={cn("relative inline-flex rounded-full bg-fill p-1", className)}>
      {box && (
        <span
          aria-hidden
          className="absolute top-1 bottom-1 rounded-full bg-ink transition-[left,width] duration-300 ease-[var(--ease-out-soft)]"
          style={{ left: box.left, width: box.width }}
        />
      )}
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            ref={(el) => {
              refs.current[o.value] = el;
            }}
            role="tab"
            type="button"
            aria-selected={active}
            title={o.title}
            onClick={() => (o.locked ? onLocked?.(o.value) : onChange(o.value))}
            className={cn(
              "relative z-10 inline-flex items-center gap-1.5 rounded-full font-medium whitespace-nowrap transition-colors duration-200",
              size === "md" ? "h-9 px-4 text-sm" : "h-7 px-3 text-[13px]",
              active ? "text-page" : "text-ink-2 hover:text-ink",
            )}
          >
            {o.icon}
            {o.label}
            {o.locked && <LockSimple size={12} weight="bold" className="opacity-70" />}
          </button>
        );
      })}
    </div>
  );
}
