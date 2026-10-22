"use client";

import { ArrowCounterClockwise, SkipForward, Stop } from "@phosphor-icons/react";
import { IconButton } from "@/core/ui/Button";
import { cn } from "@/core/lib/cn";
import { useT } from "@/core/i18n";
import { confirmAction } from "@/core/ui/store";
import { MINUTE } from "@/core/lib/time";
import { useTimer } from "../store/timer";
import { elapsedOf } from "../engine/logic";
import { requestStartToggle } from "../warmup/store";

export function StartButton({ size = "lg" }: { size?: "lg" | "md" }) {
  const t = useT();
  const status = useTimer((s) => s.status);
  const running = status === "running";
  const label = running ? t("Pause") : status === "paused" ? t("Resume") : t("Start");
  return (
    <button
      type="button"
      onClick={requestStartToggle}
      aria-label={label}
      className={cn(
        "display relative rounded-full bg-btn text-btn-ink uppercase transition-[transform,box-shadow,filter] duration-150 select-none hover:brightness-[1.04]",
        size === "lg"
          ? "h-[64px] min-w-[176px] px-10 text-[20px] tracking-[0.16em] sm:h-[70px] sm:min-w-[220px] sm:px-12 sm:text-[22px]"
          : "h-12 min-w-[132px] px-7 text-[16px] tracking-[0.14em]",
        running
          ? "translate-y-[6px] shadow-[0_0_0_0_var(--c-btn-shadow)]"
          : "shadow-[0_6px_0_0_color-mix(in_oklab,var(--c-btn-shadow)_70%,transparent)] active:translate-y-[6px] active:shadow-none",
      )}
    >
      {label}
    </button>
  );
}

export function Controls() {
  const t = useTimer();
  const tr = useT();
  const isFlow = t.flow && t.mode === "focus";
  const started = t.status !== "idle";

  const reset = async () => {
    const elapsed = elapsedOf(useTimer.getState(), Date.now());
    if (elapsed > MINUTE) {
      const ok = await confirmAction({
        title: tr("Reset this session?"),
        body: tr("Resetting discards the time on the clock. Use skip if you want to keep it."),
        confirmLabel: tr("Reset"),
        tone: "danger",
      });
      if (!ok) return;
    }
    useTimer.getState().reset();
  };

  return (
    <div className="flex items-center justify-center gap-3 sm:gap-5">
      <IconButton label={tr("Reset (R)")} variant="soft" size="lg" onClick={reset} disabled={!started}>
        <ArrowCounterClockwise size={20} weight="bold" />
      </IconButton>
      <StartButton />
      {isFlow ? (
        <IconButton label={tr("Stop and log")} variant="soft" size="lg" onClick={() => t.finish(true)} disabled={!started}>
          <Stop size={20} weight="fill" />
        </IconButton>
      ) : (
        <IconButton label={tr("Skip (S)")} variant="soft" size="lg" onClick={() => t.skip()}>
          <SkipForward size={20} weight="fill" />
        </IconButton>
      )}
    </div>
  );
}
