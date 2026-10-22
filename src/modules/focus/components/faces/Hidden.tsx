"use client";

import { useState } from "react";
import { Eye } from "@phosphor-icons/react";
import { formatClock, formatElapsed, formatDuration } from "@/core/lib/time";
import { useT } from "@/core/i18n";
import type { FaceProps } from "./types";

/** The timer is hidden. A breathing orb shows that time is moving; hold to peek. */
export function Hidden(p: FaceProps) {
  const t = useT();
  const [peek, setPeek] = useState(false);
  const isFlow = p.flow && p.mode === "focus";
  const label =
    p.status === "idle"
      ? isFlow
        ? t("Flow, hidden")
        : t("{duration}, hidden", { duration: formatDuration(p.plannedMs) })
      : p.status === "paused"
        ? t("Paused")
        : p.mode === "focus"
          ? t("In focus")
          : t("On a break");

  const on = () => setPeek(true);
  const off = () => setPeek(false);

  return (
    <div className="flex h-full flex-col items-center justify-center gap-[min(4cqw,6cqh)]">
      <div className="relative grid size-[min(34cqw,52cqh)] place-items-center">
        {p.status === "running" && <span className="absolute inset-0 rounded-full bg-ink/15 [animation:pulse-ring_5.5s_ease-out_infinite]" />}
        <span className={`absolute inset-[12%] rounded-full bg-ink/90 ${p.status === "running" ? "animate-breathe" : "opacity-60"}`} />
        {peek && (
          <span className="timer-digits animate-fade relative text-[min(9cqw,14cqh)] text-page">
            {isFlow ? formatElapsed(p.elapsedMs) : formatClock(p.remainingMs)}
          </span>
        )}
      </div>
      <div className="flex flex-col items-center gap-2">
        <div className="display text-[min(6cqw,9cqh)] leading-none">{label}</div>
        {p.status !== "idle" && (
          <button
            type="button"
            onPointerDown={on}
            onPointerUp={off}
            onPointerLeave={off}
            onKeyDown={(e) => (e.key === " " || e.key === "Enter") && (e.preventDefault(), on())}
            onKeyUp={off}
            onBlur={off}
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-medium text-ink-3 select-none hover:bg-fill hover:text-ink"
          >
            <Eye size={15} weight="bold" />
            {t("Hold to peek")}
          </button>
        )}
      </div>
    </div>
  );
}
