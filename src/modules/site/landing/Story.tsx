"use client";

import { motion, useTransform, type MotionValue } from "motion/react";
import { CAIRN_PATHS } from "@/core/ui/Logo";
import { useT } from "@/core/i18n";
import { Reveal, useSectionProgress } from "../motion";

function Word({ children, progress, range }: { children: string; progress: MotionValue<number>; range: [number, number] }) {
  const opacity = useTransform(progress, range, [0.16, 1]);
  return (
    <motion.span style={{ opacity }} className="inline">
      {children}{" "}
    </motion.span>
  );
}

/** A paragraph that lights up word by word as you scroll through it. */
export function ScrollStatement() {
  const t = useT();
  const [ref, progress] = useSectionProgress<HTMLDivElement>(["start end", "center center"]);
  const text = t(
    "Steen is a focus timer for people who would rather not watch the clock. Warm up for a minute or two, sit down, and let the numbers wait until you are done.",
  );
  const words = text.split(" ");
  return (
    <section className="mx-auto max-w-[1240px] px-6 py-[18vh]">
      <div ref={ref} className="display max-w-[22ch] text-[clamp(2rem,4.6vw,4.2rem)] leading-[1.02]">
        {words.map((w, i) => (
          <Word key={i} progress={progress} range={[i / words.length, Math.min(1, (i + 2) / words.length)]}>
            {w}
          </Word>
        ))}
      </div>
    </section>
  );
}

function Stones({ count, small }: { count: number; small?: boolean }) {
  return (
    <svg viewBox="0 0 32 32" className={small ? "size-8 text-ink" : "size-16 text-ink"} fill="currentColor" aria-hidden>
      {CAIRN_PATHS.map((d, i) => (
        <motion.path
          key={i}
          d={d}
          initial={{ opacity: 0, y: -10 }}
          whileInView={{ opacity: i < count ? 1 : 0.12, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.9, delay: 0.25 + i * 0.18, ease: [0.22, 1, 0.36, 1] }}
        />
      ))}
    </svg>
  );
}

const STEPS = [
  {
    title: "Warm up",
    body: "Name your first step, then rest your eyes on a single point. A calm, repeatable way into the work.",
    meta: "30 s to 3 min · when you sit down",
  },
  {
    title: "Focus",
    body: "Twenty-five minutes on one thing. Hide the countdown, or choose a face that doesn't tick.",
    meta: "25 min, or your own length",
  },
  {
    title: "Rest",
    body: "A short break after each session and a long one after four. Stepping away is part of the method.",
    meta: "5 min · 15 min after four",
  },
];

/** Warm up: a still dot on a dim stage, its glow breathing. */
function WarmupVisual() {
  return (
    <div className="relative grid h-full place-items-center">
      <motion.span
        className="absolute size-16 rounded-full bg-[radial-gradient(closest-side,#b8a88f,transparent)]"
        animate={{ opacity: [0.12, 0.3, 0.12], scale: [0.9, 1.15, 0.9] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      />
      <span className="size-3.5 rounded-full bg-[#b8a88f]" />
    </div>
  );
}

/** Focus: a ring that fills, slowly, like the session itself. */
function FocusVisual() {
  const r = 34;
  const c = 2 * Math.PI * r;
  return (
    <div className="grid h-full place-items-center">
      <svg width="92" height="92" viewBox="0 0 92 92" className="-rotate-90">
        <circle cx="46" cy="46" r={r} fill="none" stroke="currentColor" strokeOpacity="0.12" strokeWidth="5" />
        <motion.circle
          cx="46"
          cy="46"
          r={r}
          fill="none"
          stroke="var(--c-accent)"
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          whileInView={{ strokeDashoffset: [c, c * 0.08] }}
          viewport={{ once: false, margin: "-15% 0px" }}
          transition={{ duration: 7, ease: "easeInOut", repeat: Infinity, repeatType: "reverse", repeatDelay: 0.8 }}
        />
      </svg>
    </div>
  );
}

/** Rest: a slow wave, like breathing out. */
function RestVisual() {
  const wave = (phase: number) =>
    `M0 40 ${Array.from({ length: 9 }, (_, i) => `Q ${i * 30 + 15} ${40 + (i % 2 ? -1 : 1) * (10 + phase)} ${i * 30 + 30} 40`).join(" ")}`;
  return (
    <div className="grid h-full place-items-center overflow-hidden">
      <svg viewBox="0 0 270 80" className="w-[85%] text-ink" fill="none">
        <motion.path
          stroke="currentColor"
          strokeOpacity="0.5"
          strokeWidth="2"
          strokeLinecap="round"
          animate={{ d: [wave(0), wave(-14), wave(0)] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.path
          stroke="currentColor"
          strokeOpacity="0.18"
          strokeWidth="2"
          strokeLinecap="round"
          animate={{ d: [wave(-10), wave(2), wave(-10)] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.6 }}
        />
      </svg>
    </div>
  );
}

const VISUALS = [WarmupVisual, FocusVisual, RestVisual];

/** A stop on the progress line that lights up as the line reaches it. */
function Node({ at, progress }: { at: number; progress: MotionValue<number> }) {
  const reach = 0.25 + (at / 100) * 0.7;
  const bg = useTransform(progress, [reach - 0.04, reach], ["rgb(243 238 230 / 0.15)", "rgb(241 201 162 / 1)"]);
  const scale = useTransform(progress, [reach - 0.04, reach, reach + 0.06], [1, 1.5, 1]);
  return <motion.span className="absolute top-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full" style={{ left: `${at}%`, backgroundColor: bg, scale }} />;
}

export function Steps() {
  const t = useT();
  const [ref, progress] = useSectionProgress<HTMLDivElement>(["start end", "center center"]);
  const line = useTransform(progress, [0.25, 0.95], ["0%", "100%"]);
  return (
    <section className="mx-auto max-w-[1240px] px-6 pb-[14vh]">
      <Reveal className="mb-12 flex flex-wrap items-end justify-between gap-6">
        <div>
          <div className="eyebrow text-accent">{t("The method")}</div>
          <h2 className="display mt-4 max-w-[16ch] text-[clamp(2.2rem,5vw,4rem)] leading-[0.92]">{t("Three stones, every sit-down.")}</h2>
        </div>
        <p className="max-w-[38ch] text-[16px] leading-relaxed text-ink-2">
          {t("Every sit-down follows the same three steps. Do it often enough and it becomes the way you start.")}
        </p>
      </Reveal>
      <div ref={ref} className="relative">
        <div aria-hidden className="relative mx-[16.66%] mb-8 hidden h-px bg-line md:block">
          <motion.div className="h-full bg-gradient-to-r from-[#f1c9a2]/40 to-[#f1c9a2]" style={{ width: line }} />
          {[0, 50, 100].map((at) => (
            <Node key={at} at={at} progress={progress} />
          ))}
        </div>
        <div className="relative grid gap-4 md:grid-cols-3">
          {STEPS.map((s, i) => {
            const Visual = VISUALS[i];
            return (
              <Reveal
                key={s.title}
                delay={i * 0.14}
                className="group relative overflow-hidden rounded-[32px] bg-surface p-3 ring-1 ring-line transition-[transform,box-shadow] duration-500 hover:-translate-y-1 hover:shadow-[0_30px_80px_-40px_rgb(241_201_162/0.35)]"
              >
                <div className="relative h-[180px] overflow-hidden rounded-[24px] bg-[#141311] ring-1 ring-white/[0.05]">
                  <div aria-hidden className="absolute inset-0 bg-[radial-gradient(70%_60%_at_50%_45%,rgb(241_201_162/0.07),transparent)]" />
                  <Visual />
                  <span className="absolute top-4 left-4 font-mono text-[11px] tracking-[0.12em] text-white/35">0{i + 1}</span>
                  <div className="absolute top-3 right-3 opacity-60 transition-opacity group-hover:opacity-100">
                    <Stones count={i + 1} small />
                  </div>
                </div>
                <div className="px-5 pt-6 pb-5">
                  <h3 className="display text-[30px] leading-none">{t(s.title)}</h3>
                  <p className="mt-3 text-[15.5px] leading-relaxed text-ink-2">{t(s.body)}</p>
                  <div className="mt-5 inline-flex rounded-full bg-fill px-3 py-1.5 text-[12.5px] text-ink-3">{t(s.meta)}</div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
