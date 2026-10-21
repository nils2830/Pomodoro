"use client";

import { cn } from "../lib/cn";

export function Switch({ checked, onChange, label, disabled }: { checked: boolean; onChange: (v: boolean) => void; label: string; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-[26px] w-[44px] shrink-0 items-center rounded-full transition-colors duration-200 disabled:opacity-40",
        checked ? "bg-ink" : "bg-ink/15",
      )}
    >
      <span
        className={cn(
          "absolute top-[3px] left-[3px] size-5 rounded-full shadow-sm transition-transform duration-300 ease-[var(--ease-spring)]",
          checked ? "translate-x-[18px] bg-page" : "translate-x-0 bg-raised",
        )}
      />
    </button>
  );
}
