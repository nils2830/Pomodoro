"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "../lib/cn";

/**
 * Lightweight anchored popover. The trigger receives toggle props;
 * the panel closes on outside click, Escape, or when an item calls close().
 */
export function Popover({
  trigger,
  children,
  align = "start",
  side = "bottom",
  className,
  panelClassName,
}: {
  trigger: (props: { onClick: () => void; "aria-expanded": boolean; "aria-haspopup": "menu" }) => ReactNode;
  children: (close: () => void) => ReactNode;
  align?: "start" | "end" | "center";
  side?: "bottom" | "top";
  className?: string;
  panelClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (root.current && !root.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={root} className={cn("relative inline-flex", className)}>
      {trigger({ onClick: () => setOpen((o) => !o), "aria-expanded": open, "aria-haspopup": "menu" })}
      {open && (
        <div
          role="menu"
          className={cn(
            "neutral animate-rise absolute z-50 min-w-[220px] rounded-[20px] bg-raised p-1.5 shadow-[0_18px_50px_-12px_rgb(0_0_0/0.35),0_0_0_1px_rgb(0_0_0/0.04)]",
            side === "bottom" ? "top-[calc(100%+8px)]" : "bottom-[calc(100%+8px)]",
            align === "start" && "left-0",
            align === "end" && "right-0",
            align === "center" && "left-1/2 -translate-x-1/2",
            panelClassName,
          )}
        >
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  );
}

export function MenuItem({
  icon,
  children,
  onClick,
  tone = "default",
  trailing,
  disabled,
}: {
  icon?: ReactNode;
  children: ReactNode;
  onClick: () => void;
  tone?: "default" | "danger";
  trailing?: ReactNode;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 rounded-[14px] px-3 py-2.5 text-left text-sm font-medium transition-colors disabled:opacity-40",
        tone === "danger" ? "text-bad hover:bg-bad/8" : "text-ink hover:bg-fill",
      )}
    >
      {icon && <span className="text-ink-3">{icon}</span>}
      <span className="flex-1">{children}</span>
      {trailing}
    </button>
  );
}

export function MenuSeparator() {
  return <div className="mx-3 my-1 h-px bg-line" />;
}
