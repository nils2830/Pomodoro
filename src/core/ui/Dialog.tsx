"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "@phosphor-icons/react";
import { cn } from "../lib/cn";
import { useHydrated } from "../lib/useHydrated";

/**
 * Native <dialog> for focus trapping and Esc handling, portalled to <body>
 * and rendered in the neutral palette so it reads well over any theme.
 */
export function Dialog({
  open,
  onClose,
  title,
  eyebrow,
  children,
  size = "md",
  className,
  bare,
}: {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  eyebrow?: ReactNode;
  children: ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  /** Skip the default header and padding. */
  bare?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const hydrated = useHydrated();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open, hydrated]);

  if (!hydrated) return null;

  const widths = { sm: "max-w-[420px]", md: "max-w-[560px]", lg: "max-w-[760px]", xl: "max-w-[960px]" };

  return createPortal(
    <dialog
      ref={ref}
      onClose={onClose}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onMouseDown={(e) => {
        if (e.target === ref.current) onClose();
      }}
      className={cn("neutral m-auto w-[calc(100%-24px)] overflow-visible bg-transparent p-0 text-ink backdrop:bg-transparent", widths[size])}
    >
      {open && (
        <div
          className={cn("relative max-h-[calc(100svh-32px)] overflow-y-auto rounded-[28px] bg-surface shadow-[0_30px_80px_-20px_rgb(0_0_0/0.45)]", className)}
        >
          {bare ? (
            children
          ) : (
            <>
              <div className="sticky top-0 z-10 flex items-start justify-between gap-4 bg-surface/95 px-6 pt-6 pb-3 backdrop-blur sm:px-8 sm:pt-7">
                <div>
                  {eyebrow && <div className="eyebrow mb-2 text-ink-3">{eyebrow}</div>}
                  {title && <h2 className="display text-[26px] leading-none">{title}</h2>}
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close"
                  className="-mt-1 -mr-2 grid size-9 place-items-center rounded-full text-ink-3 hover:bg-fill hover:text-ink"
                >
                  <X size={18} weight="bold" />
                </button>
              </div>
              <div className="px-6 pb-7 sm:px-8">{children}</div>
            </>
          )}
        </div>
      )}
    </dialog>,
    document.body,
  );
}
