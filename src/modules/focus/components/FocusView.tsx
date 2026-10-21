"use client";

import { useEffect, useState } from "react";
import { X } from "@phosphor-icons/react";
import { useUI } from "@/core/ui/store";
import { isTypingTarget } from "@/core/lib/dom";
import { cn } from "@/core/lib/cn";
import { MINUTE } from "@/core/lib/time";
import { useTimer } from "../store/timer";
import { useFocusSettings } from "../store/settings";
import { TimerStage } from "./TimerStage";
import { TaskPanel } from "./TaskPanel";
import { ProgressLine } from "./ProgressLine";

export function FocusView() {
  const zen = useUI((s) => s.zen);
  const setZen = useUI((s) => s.setZen);
  const [addRequest, setAddRequest] = useState(0);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (isTypingTarget(e.target) || e.metaKey || e.ctrlKey || e.altKey) return;
      if (document.querySelector("dialog[open]")) return;
      const t = useTimer.getState();
      const settings = useFocusSettings.getState();
      switch (e.key) {
        case " ":
          // Space always means start/pause, even if a button has focus:
          // blur it so the browser doesn't also "click" it on keyup.
          e.preventDefault();
          (document.activeElement as HTMLElement | null)?.blur();
          if (!e.repeat) t.toggle();
          break;
        case "s":
        case "S":
          if (!(t.flow && t.mode === "focus")) t.skip();
          break;
        case "r":
        case "R":
          if (t.status !== "idle") t.reset();
          break;
        case "h":
        case "H":
          settings.set({ hideTimer: !settings.doc.hideTimer });
          break;
        case "f":
        case "F":
          (document.querySelector('[aria-label="Timer face (F)"]') as HTMLButtonElement | null)?.click();
          break;
        case "z":
        case "Z":
          setZen(!useUI.getState().zen);
          break;
        case "Escape":
          if (useUI.getState().zen) setZen(false);
          break;
        case "1":
          if (t.status === "idle") t.setMode("focus");
          break;
        case "2":
          if (t.status === "idle") t.setMode("short");
          break;
        case "3":
          if (t.status === "idle") t.setMode("long");
          break;
        case "n":
        case "N":
          e.preventDefault();
          setAddRequest((n) => n + 1);
          break;
        case "+":
          if (t.status === "running" && !(t.flow && t.mode === "focus")) t.extend(MINUTE);
          break;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setZen]);

  if (zen) {
    return (
      <div className="relative flex min-h-svh flex-col items-center justify-center px-4 py-10">
        <button
          type="button"
          onClick={() => setZen(false)}
          className="absolute top-5 right-5 inline-flex h-10 items-center gap-2 rounded-full px-4 text-sm font-medium text-ink-3 hover:bg-fill hover:text-ink"
        >
          <X size={16} weight="bold" /> Leave zen <span className="font-mono text-[11px] opacity-70">esc</span>
        </button>
        <TimerStage />
      </div>
    );
  }

  return (
    <>
      <ProgressLine />
      <div
        className={cn(
          "mx-auto grid w-full max-w-[1320px] grid-cols-[minmax(0,1fr)] gap-x-14 gap-y-12 px-4 pt-6 pb-16 sm:px-6",
          "lg:min-h-[calc(100svh-75px)] lg:grid-cols-[minmax(0,1fr)_minmax(340px,410px)] lg:items-center lg:pt-2",
        )}
      >
        <TimerStage />
        <div className="lg:max-h-[calc(100svh-140px)] lg:overflow-y-auto lg:rounded-[30px] lg:bg-surface lg:p-6 lg:pr-5">
          <TaskPanel addRequest={addRequest} />
        </div>
      </div>
    </>
  );
}
