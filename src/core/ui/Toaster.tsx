"use client";

import { CheckCircle, WarningCircle, X } from "@phosphor-icons/react";
import { useUI } from "./store";
import { cn } from "../lib/cn";
import { useT } from "../i18n";

export function Toaster() {
  const toasts = useUI((s) => s.toasts);
  const dismiss = useUI((s) => s.dismissToast);
  const t = useT();
  return (
    <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-20 z-[60] flex flex-col items-center gap-2 px-4 sm:bottom-6">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="neutral-dark animate-rise pointer-events-auto flex max-w-[460px] items-center gap-3 rounded-full bg-[#181715] py-2 pr-2 pl-4 text-sm text-[#f2efe8] shadow-[0_16px_40px_-12px_rgb(0_0_0/0.5)]"
        >
          {toast.tone === "success" && <CheckCircle size={18} weight="fill" className="shrink-0 text-[#3fbf5a]" />}
          {toast.tone === "error" && <WarningCircle size={18} weight="fill" className="shrink-0 text-[#e66767]" />}
          <span className="min-w-0 flex-1">{toast.message}</span>
          {toast.action && (
            <button
              type="button"
              onClick={() => {
                toast.action!.onClick();
                dismiss(toast.id);
              }}
              className="rounded-full bg-white/10 px-3 py-1 text-[13px] font-semibold hover:bg-white/15"
            >
              {toast.action.label}
            </button>
          )}
          <button
            type="button"
            aria-label={t("Dismiss")}
            onClick={() => dismiss(toast.id)}
            className={cn("grid size-7 place-items-center rounded-full text-white/50 hover:text-white")}
          >
            <X size={14} weight="bold" />
          </button>
        </div>
      ))}
    </div>
  );
}
