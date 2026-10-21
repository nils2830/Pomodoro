"use client";

import { ArrowsInSimple, CornersOut, Eye, EyeSlash, PictureInPicture } from "@phosphor-icons/react";
import { IconButton } from "@/core/ui/Button";
import { useUI, confirmAction } from "@/core/ui/store";
import { useGate } from "@/core/billing/useGate";
import { cn } from "@/core/lib/cn";
import { MINUTE } from "@/core/lib/time";
import { useTimer } from "../store/timer";
import { useFocusSettings } from "../store/settings";
import { useFaceProps, useTaskList } from "../hooks";
import { MODE_PROMPT } from "../labels";
import { getFace } from "./faces";
import { Digits } from "./faces/Digits";
import { Hidden } from "./faces/Hidden";
import { ModeTabs } from "./ModeTabs";
import { Controls } from "./Controls";
import { FacePicker } from "./FacePicker";
import { ActivityPicker } from "./ActivityPicker";
import { openPopout } from "./Popout";
import { usePendingWarmup } from "../warmup/store";

function Face({ zen }: { zen: boolean }) {
  const props = useFaceProps(zen ? "zen" : "stage");
  const faceId = useFocusSettings((s) => s.doc.face);
  const hidden = useFocusSettings((s) => s.doc.hideTimer);
  const def = getFace(faceId);
  const isFlow = props.flow && props.mode === "focus";
  const Component = hidden ? Hidden : isFlow && !def.flow ? Digits : def.Component;
  return (
    <div
      className={cn(
        "relative grid w-full place-items-center [container-type:size]",
        zen ? "h-[min(62svh,620px)]" : "h-[clamp(200px,34svh,380px)] sm:h-[clamp(230px,42svh,380px)]",
      )}
    >
      <Component {...props} />
    </div>
  );
}

function SessionLine() {
  const round = useTimer((s) => s.round);
  const mode = useTimer((s) => s.mode);
  const flow = useTimer((s) => s.flow);
  const activeTaskId = useTimer((s) => s.activeTaskId);
  const resetRound = useTimer((s) => s.resetRound);
  const tasks = useTaskList();
  const task = tasks.find((t) => t.id === activeTaskId);
  const prompt = mode === "focus" ? (task ? task.title : flow ? "Follow the flow." : MODE_PROMPT.focus) : MODE_PROMPT[mode];

  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <div className="flex max-w-full items-baseline gap-2.5 px-4">
        <button
          type="button"
          title="Reset the round counter"
          onClick={async () => {
            if (
              await confirmAction({
                title: "Reset the round counter?",
                body: "Starts again from #1. Your logged sessions are not affected.",
                confirmLabel: "Reset",
              })
            )
              resetRound();
          }}
          className="font-mono text-sm text-ink-3 tabular-nums hover:text-ink"
        >
          #{round}
        </button>
        <span className="display truncate text-[22px] leading-tight">{prompt}</span>
      </div>
      {mode === "focus" && <ActivityPicker />}
    </div>
  );
}

export function TimerStage() {
  const zen = useUI((s) => s.zen);
  const setZen = useUI((s) => s.setZen);
  const hidden = useFocusSettings((s) => s.doc.hideTimer);
  const setSettings = useFocusSettings((s) => s.set);
  const status = useTimer((s) => s.status);
  const flow = useTimer((s) => s.flow && s.mode === "focus");
  const extend = useTimer((s) => s.extend);
  const gate = useGate();
  const warmup = usePendingWarmup();
  const openSettings = useUI((s) => s.openSettings);

  const toolbar = (
    <div className="flex items-center gap-0.5">
      <IconButton label={hidden ? "Show timer (H)" : "Hide timer (H)"} onClick={() => setSettings({ hideTimer: !hidden })} active={hidden}>
        {hidden ? <EyeSlash size={20} weight="bold" /> : <Eye size={20} weight="bold" />}
      </IconButton>
      <FacePicker />
      <IconButton label="Pop-out timer" onClick={() => gate("popout", () => void openPopout())} className="hidden sm:inline-flex">
        <PictureInPicture size={20} weight="bold" />
      </IconButton>
      <IconButton label={zen ? "Leave zen (Z)" : "Zen mode (Z)"} onClick={() => setZen(!zen)}>
        {zen ? <ArrowsInSimple size={20} weight="bold" /> : <CornersOut size={20} weight="bold" />}
      </IconButton>
    </div>
  );

  return (
    <section aria-label="Timer" className={cn("relative flex w-full flex-col items-center", zen ? "gap-8" : "gap-6")}>
      <div
        aria-hidden
        className="pointer-events-none absolute top-1/2 left-1/2 -z-10 size-[min(100vw,820px)] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-60 blur-2xl"
        style={{ background: "radial-gradient(circle, var(--c-glow) 0%, transparent 62%)" }}
      />
      <div className={cn("flex w-full flex-col items-center gap-3 sm:flex-row sm:justify-between", zen && "sm:justify-center")}>
        {!zen && <ModeTabs className="max-w-full overflow-x-auto" />}
        {toolbar}
      </div>

      <Face zen={zen} />

      {!zen && <SessionLine />}

      <div className="flex flex-col items-center gap-3">
        <Controls />
        <div className="h-8">
          {warmup != null && !zen && (
            <button
              type="button"
              onClick={() => openSettings("warmup")}
              title="Warm-up settings"
              className="animate-fade inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[13px] text-ink-3 hover:bg-fill hover:text-ink"
            >
              <span className="size-1.5 rounded-full bg-current" />
              Starts with a {warmup >= 60 && warmup % 60 === 0 ? `${warmup / 60} min` : `${warmup} s`} warm-up
            </button>
          )}
          {status === "running" && !flow && (
            <button
              type="button"
              onClick={() => extend(MINUTE)}
              className="animate-fade rounded-full px-3 py-1.5 text-[13px] font-medium text-ink-3 hover:bg-fill hover:text-ink"
            >
              + 1 minute
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
