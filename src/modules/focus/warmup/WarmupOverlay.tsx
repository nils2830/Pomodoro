"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowRight } from "@phosphor-icons/react";
import { LogoMark } from "@/core/ui/Logo";
import { useFocusSettings } from "../store/settings";
import { useTasks } from "../store/data";
import { useTimer } from "../store/timer";
import { playSoftTone } from "../audio/synth";
import { FIXATE_TIP, FIXATE_TIP_AT_MS, PHASE_COPY, phaseAt, phaseLength, type WarmupPhaseId } from "./protocol";
import { useWarmup } from "./store";

const EASE = [0.22, 1, 0.36, 1] as const;
/** A warm, muted stone tone on warm dark grey: about 7:1 contrast, never white on black. */
const SURFACE = "#1e1c1a";
const DOT = "#b8a88f";
/** How long phase instructions stay before fading, so the screen is just the dot. */
const COPY_MS = 5_000;

/** Full-screen warm-up, mounted once in the app shell. */
export function WarmupOverlay() {
  const stage = useWarmup((s) => s.stage);
  return <AnimatePresence>{stage !== "closed" && <WarmupScreen key="warmup" />}</AnimatePresence>;
}

function useNow(active: boolean) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return;
    const id = window.setInterval(() => setNow(Date.now()), 200);
    return () => window.clearInterval(id);
  }, [active]);
  return now;
}

function WarmupScreen() {
  const stage = useWarmup((s) => s.stage);
  const plan = useWarmup((s) => s.plan);
  const startedAt = useWarmup((s) => s.startedAt);
  const preview = useWarmup((s) => s.preview);
  const tone = useFocusSettings((s) => s.doc.warmupTone);
  const reduce = useReducedMotion();
  const now = useNow(stage === "running");

  const elapsed = stage === "running" && startedAt != null ? Math.max(0, now - startedAt) : 0;
  const phase = plan ? phaseAt(plan, elapsed) : null;
  const phaseId: WarmupPhaseId = stage === "running" && phase ? phase.id : "settle";
  const progress = plan && stage === "running" ? Math.min(1, elapsed / plan.totalMs) : 0;

  // Finish on time.
  useEffect(() => {
    if (stage === "running" && plan && elapsed >= plan.totalMs) useWarmup.getState().complete();
  }, [stage, plan, elapsed]);

  // One soft tone (and a tap on phones) to say "open your eyes".
  const lastPhase = useRef<WarmupPhaseId | null>(null);
  useEffect(() => {
    if (stage !== "running") return;
    if (lastPhase.current === "close" && phaseId === "open" && tone) {
      playSoftTone(0.35);
      navigator.vibrate?.(40);
    }
    lastPhase.current = phaseId;
  }, [stage, phaseId, tone]);

  // Esc leaves the warm-up and starts the session; the page underneath stays still.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.preventDefault();
      e.stopPropagation();
      useWarmup.getState().skip();
    };
    window.addEventListener("keydown", onKey, true);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey, true);
      document.body.style.overflow = overflow;
    };
  }, []);

  // Keep the screen awake through the eyes-closed part.
  useEffect(() => {
    let lock: WakeLockSentinel | null = null;
    navigator.wakeLock
      ?.request("screen")
      .then((l) => (lock = l))
      .catch(() => {});
    return () => void lock?.release().catch(() => {});
  }, []);

  const fade = (seconds: number) => (reduce ? 0.2 : seconds);
  const { skip, cancel } = useWarmup.getState();

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label="Focus warm-up"
      className="fixed inset-0 z-[200] overflow-hidden text-[#e9e2d6] select-none"
      style={{ backgroundColor: SURFACE }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: fade(0.9), ease: EASE }}
    >
      {/* With the eyes closed, dim further so less light comes through the lids. */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-black"
        initial={false}
        animate={{ opacity: phaseId === "close" ? 0.55 : 0 }}
        transition={{ duration: fade(2), ease: "easeInOut" }}
      />

      <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between p-4 text-[13px] text-white/30 sm:p-6">
        <div className="flex items-center gap-2">
          <LogoMark size={15} />
          <span className="eyebrow">{preview ? "Warm-up preview" : "Warm-up"}</span>
        </div>
        <div className="flex items-center gap-1">
          <button type="button" onClick={cancel} className="rounded-full px-3 py-2 transition-colors hover:text-white/75">
            Cancel
          </button>
          <button type="button" onClick={skip} className="inline-flex items-center gap-2 rounded-full px-3 py-2 transition-colors hover:text-white/75">
            {preview ? "End" : "Skip to session"}
            <span className="hidden font-mono text-[10px] opacity-70 sm:inline">esc</span>
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {stage === "intent" ? (
          <FirstStep key="intent" />
        ) : (
          <motion.div key="gaze" className="absolute inset-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: fade(0.8) }}>
            <PhaseCopy phaseId={phaseId} phaseElapsed={phase ? elapsed - phase.startMs : 0} fixateMs={plan ? phaseLength(plan, "fixate") : 0} />
            <Dot phaseId={phaseId} reduce={Boolean(reduce)} />
          </motion.div>
        )}
      </AnimatePresence>

      {stage === "running" && (
        <div aria-hidden className="absolute inset-x-0 bottom-0 h-px bg-white/[0.05]">
          <div className="h-full bg-white/20 transition-[width] duration-200 ease-linear" style={{ width: `${progress * 100}%` }} />
        </div>
      )}
    </motion.div>
  );
}

/** The point to rest on: a crisp core with a faint, candle-like glow. It never moves. */
function Dot({ phaseId, reduce }: { phaseId: WarmupPhaseId; reduce: boolean }) {
  const visible = phaseId === "settle" || phaseId === "fixate";
  const breathe = phaseId === "settle" && !reduce;
  return (
    <motion.div
      aria-hidden
      className="absolute top-[46%] left-1/2 -translate-x-1/2 -translate-y-1/2"
      initial={{ opacity: 0 }}
      animate={{ opacity: visible ? 1 : 0 }}
      transition={{ duration: reduce ? 0.2 : visible ? 1.5 : 2, ease: "easeInOut" }}
    >
      <motion.div
        className="relative grid place-items-center"
        animate={breathe ? { scale: [1, 1.04, 1] } : { scale: 1 }}
        transition={breathe ? { duration: 6, repeat: Infinity, ease: "easeInOut" } : { duration: 1 }}
      >
        <span className="absolute size-[36px] rounded-full opacity-[0.14] sm:size-[45px]" style={{ background: `radial-gradient(closest-side, ${DOT}, transparent)` }} />
        <span className="size-[14px] rounded-full sm:size-[18px]" style={{ backgroundColor: DOT }} />
      </motion.div>
    </motion.div>
  );
}

/** Instructions sit well above the dot and fade, so nothing competes with it. */
function PhaseCopy({ phaseId, phaseElapsed, fixateMs }: { phaseId: WarmupPhaseId; phaseElapsed: number; fixateMs: number }) {
  const firstStep = useWarmup((s) => s.firstStep.trim());
  const copy = PHASE_COPY[phaseId];
  const showCopy = phaseId === "open" || phaseElapsed < COPY_MS;
  const showTip = phaseId === "fixate" && fixateMs >= 40_000 && phaseElapsed >= FIXATE_TIP_AT_MS && phaseElapsed < FIXATE_TIP_AT_MS + COPY_MS;
  const line = showTip ? { key: "tip", text: FIXATE_TIP, hint: "" } : showCopy ? { key: phaseId, ...copy } : null;

  return (
    <>
      <div className="absolute inset-x-0 top-[17%] px-6 text-center sm:top-[20%]" aria-live="polite">
        <AnimatePresence mode="wait">
          {line && (
            <motion.div
              key={line.key}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1, ease: EASE }}
              className="mx-auto max-w-[34ch]"
            >
              <p className="text-[17px] leading-snug font-light text-[#e9e2d6]/85 sm:text-[19px]">{line.text}</p>
              {line.hint && <p className="mt-2 text-[13.5px] leading-relaxed text-[#e9e2d6]/45">{line.hint}</p>}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <AnimatePresence>
        {phaseId === "open" && firstStep && (
          <motion.div
            key="first-step"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.1, delay: 0.4, ease: EASE }}
            className="absolute inset-x-0 top-[46%] -translate-y-1/2 px-6 text-center"
          >
            <div className="eyebrow text-white/35">Now</div>
            <p className="display mx-auto mt-3 max-w-[22ch] text-[clamp(1.6rem,4vw,2.4rem)] leading-[1.05] text-[#f3eee6]">{firstStep}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

/** Optional: name the first small step. One tap skips it. */
function FirstStep() {
  const firstStep = useWarmup((s) => s.firstStep);
  const setFirstStep = useWarmup((s) => s.setFirstStep);
  const begin = useWarmup((s) => s.begin);
  const seconds = useFocusSettings((s) => s.doc.warmupSeconds);
  const taskTitle = useTimer((s) => (s.activeTaskId ? useTasks.getState().items[s.activeTaskId]?.title : undefined));
  const length = seconds >= 60 && seconds % 60 === 0 ? `${seconds / 60} min` : `${seconds} s`;

  return (
    <motion.div
      key="intent"
      className="absolute inset-0 grid place-items-center px-5"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.8, ease: EASE }}
    >
      <form
        className="w-full max-w-[540px] text-center"
        onSubmit={(e) => {
          e.preventDefault();
          begin();
        }}
      >
        <div className="eyebrow text-white/35">Before you start</div>
        <h2 className="display mt-4 text-[clamp(1.9rem,5vw,2.8rem)] leading-[1.02] text-[#f3eee6]">What&apos;s the first small thing you&apos;ll do?</h2>
        {taskTitle && <p className="mt-3 text-[14px] text-white/40">Up next: {taskTitle}</p>}
        <label className="mt-9 block rounded-[22px] bg-white/[0.05] px-5 pt-3 pb-3.5 text-left ring-1 ring-white/10 transition-shadow focus-within:ring-white/30">
          <span className="block text-[12.5px] text-white/40">When the timer starts, I&apos;ll…</span>
          <input
            autoFocus
            value={firstStep}
            onChange={(e) => setFirstStep(e.target.value)}
            maxLength={140}
            placeholder="open the notes and write one line"
            className="own-focus mt-1 w-full bg-transparent text-[17px] text-[#f3eee6] outline-none placeholder:text-white/20"
          />
        </label>
        <button
          type="submit"
          className="group mt-6 inline-flex h-12 items-center gap-2 rounded-full bg-[#f3eee6] px-6 text-[15px] font-medium text-[#12110f] transition-transform hover:-translate-y-px"
        >
          Begin warm-up <ArrowRight size={15} weight="bold" className="transition-transform group-hover:translate-x-0.5" />
        </button>
        <div>
          <button
            type="button"
            onClick={() => {
              setFirstStep("");
              begin();
            }}
            className="mt-3 rounded-full px-3 py-1.5 text-[13px] text-white/35 transition-colors hover:text-white/70"
          >
            Skip this step
          </button>
        </div>
        <p className="mt-10 text-[12.5px] text-white/25">{length} with a single dot · Blink whenever you like</p>
      </form>
    </motion.div>
  );
}
