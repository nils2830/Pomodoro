"use client";

import { type ReactNode, type SelectHTMLAttributes, type InputHTMLAttributes, forwardRef } from "react";
import { CaretDown, Minus, Plus } from "@phosphor-icons/react";
import { cn } from "../lib/cn";

export function NumberField({
  value,
  onChange,
  min = 0,
  max = 999,
  step = 1,
  suffix,
  label,
  className,
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
  label: string;
  className?: string;
}) {
  const clamp = (v: number) => Math.min(max, Math.max(min, v));
  return (
    <div className={cn("inline-flex h-10 items-center rounded-full bg-fill", className)}>
      <button
        type="button"
        aria-label={`Decrease ${label}`}
        onClick={() => onChange(clamp(value - step))}
        disabled={value <= min}
        className="grid size-10 place-items-center rounded-full text-ink-2 hover:text-ink disabled:opacity-30"
      >
        <Minus size={14} weight="bold" />
      </button>
      <label className="flex items-baseline gap-1">
        <span className="sr-only">{label}</span>
        <input
          type="number"
          inputMode="numeric"
          value={Number.isFinite(value) ? value : ""}
          min={min}
          max={max}
          step={step}
          onChange={(e) => {
            const n = Number(e.target.value);
            if (!Number.isNaN(n)) onChange(clamp(n));
          }}
          className="tnum w-9 bg-transparent text-center text-[15px] font-semibold outline-none"
        />
        {suffix && <span className="text-xs text-ink-3">{suffix}</span>}
      </label>
      <button
        type="button"
        aria-label={`Increase ${label}`}
        onClick={() => onChange(clamp(value + step))}
        disabled={value >= max}
        className="grid size-10 place-items-center rounded-full text-ink-2 hover:text-ink disabled:opacity-30"
      >
        <Plus size={14} weight="bold" />
      </button>
    </div>
  );
}

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement> & { wrapperClassName?: string }>(function Select(
  { className, wrapperClassName, children, ...rest },
  ref,
) {
  return (
    <div className={cn("relative inline-flex", wrapperClassName)}>
      <select
        ref={ref}
        className={cn(
          "h-10 w-full appearance-none rounded-full bg-fill pr-9 pl-4 text-sm font-medium text-ink outline-none hover:bg-ink/10 focus-visible:ring-2 focus-visible:ring-ink",
          className,
        )}
        {...rest}
      >
        {children}
      </select>
      <CaretDown size={14} weight="bold" className="pointer-events-none absolute top-1/2 right-3.5 -translate-y-1/2 text-ink-3" />
    </div>
  );
});

export const TextInput = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function TextInput({ className, ...rest }, ref) {
  return (
    <input
      ref={ref}
      className={cn(
        "h-11 w-full rounded-2xl border border-line bg-raised px-4 text-[15px] text-ink outline-none placeholder:text-ink-3 focus:border-ink/40",
        className,
      )}
      {...rest}
    />
  );
});

/** A settings row: label + hint on the left, control on the right. */
export function Field({ label, hint, children, badge }: { label: ReactNode; hint?: ReactNode; children: ReactNode; badge?: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-6 py-3.5">
      <div className="min-w-0">
        <div className="flex items-center gap-2 text-[15px] font-medium text-ink">
          {label}
          {badge}
        </div>
        {hint && <div className="mt-0.5 text-[13px] leading-snug text-ink-3">{hint}</div>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}
