"use client";

import { motion, useTransform, type MotionValue } from "motion/react";
import { CAIRN_PATHS } from "@/core/ui/Logo";
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
  const [ref, progress] = useSectionProgress<HTMLDivElement>(["start end", "center center"]);
  const text =
    "Steen is a focus timer for people who would rather not watch the clock. Warm up for a minute or two, sit down, and let the numbers wait until you are done.";
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

function Stones({ count }: { count: number }) {
  return (
    <svg viewBox="0 0 32 32" className="size-16 text-ink" fill="currentColor" aria-hidden>
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
  { title: "Warm up", body: "Name your first step, then rest your eyes on a single point for a minute or two. A calm way into the work." },
  { title: "Focus", body: "Twenty-five minutes on one thing. Hide the countdown, or choose a face that doesn't tick." },
  { title: "Rest", body: "A short break after each session, a long one after four. Stepping away is part of the method." },
];

export function Steps() {
  return (
    <section className="mx-auto max-w-[1240px] px-6 pb-[14vh]">
      <div className="grid gap-4 md:grid-cols-3">
        {STEPS.map((s, i) => (
          <Reveal key={s.title} delay={i * 0.12} className="group rounded-[32px] bg-surface p-8 ring-1 ring-line transition-colors hover:bg-raised">
            <Stones count={i + 1} />
            <div className="eyebrow mt-10 text-ink-3">0{i + 1}</div>
            <h3 className="display mt-3 text-[30px] leading-none">{s.title}</h3>
            <p className="mt-3 text-[15.5px] leading-relaxed text-ink-2">{s.body}</p>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
