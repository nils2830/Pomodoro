"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useInView } from "motion/react";
import { Reveal } from "../motion";
import { WARMUP_REFERENCES } from "@/modules/focus/warmup/protocol";

/** The demo's script: the real phases, sped up about ten times. Ticks are 250 ms. */
const SCRIPT = [
  { until: 4, text: "What's the first small thing you'll do?", dot: 0, dim: 0 },
  { until: 8, text: "Sit back. Let your shoulders drop.", dot: 1, dim: 0 },
  { until: 22, text: "Rest your eyes softly on the dot.", dot: 1, dim: 0 },
  { until: 30, text: "Close your eyes. Let the afterglow fade.", dot: 0, dim: 1 },
  { until: 36, text: "Open your eyes. Now: outline section two.", dot: 0, dim: 0 },
];
const LENGTH = SCRIPT[SCRIPT.length - 1].until;

/** A looping, sped-up preview of the warm-up screen. */
function WarmupDemo() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { margin: "-20% 0px" });
  const [t, setT] = useState(0);
  useEffect(() => {
    if (!inView) return;
    const id = window.setInterval(() => setT((x) => (x + 1) % LENGTH), 250);
    return () => window.clearInterval(id);
  }, [inView]);
  const index = SCRIPT.findIndex((p) => t < p.until);
  const step = SCRIPT[index];
  const progress = t / (LENGTH - 1);

  return (
    <div ref={ref} className="relative aspect-[4/5] w-full overflow-hidden rounded-[36px] bg-[#1e1c1a] ring-1 ring-line">
      <motion.div className="absolute inset-0 bg-black" animate={{ opacity: step.dim ? 0.55 : 0 }} transition={{ duration: 1 }} />
      <motion.div
        className="absolute top-[46%] left-1/2 -translate-x-1/2 -translate-y-1/2"
        animate={{ opacity: step.dot }}
        transition={{ duration: 1.2, ease: "easeInOut" }}
      >
        <span className="absolute top-1/2 left-1/2 size-[44px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,#b8a88f,transparent)] opacity-[0.14]" />
        <span className="block size-[17px] rounded-full bg-[#b8a88f]" />
      </motion.div>
      <div className="absolute inset-x-8 top-[20%] text-center">
        <AnimatePresence mode="wait">
          <motion.p
            key={index}
            initial={{ opacity: 0, y: 8, filter: "blur(6px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -6, filter: "blur(6px)" }}
            transition={{ duration: 0.7 }}
            className="mx-auto max-w-[24ch] text-[17px] leading-snug font-light text-white/75"
          >
            {step.text}
          </motion.p>
        </AnimatePresence>
      </div>
      <div className="absolute inset-x-0 bottom-0 h-px bg-white/[0.06]">
        <div className="h-full bg-white/25 transition-[width] duration-300 ease-linear" style={{ width: `${progress * 100}%` }} />
      </div>
      <div className="eyebrow absolute top-7 left-8 text-white/35">Warm-up · 90 s</div>
    </div>
  );
}

export function WarmupShowcase() {
  return (
    <section id="warmup" className="mx-auto grid max-w-[1240px] scroll-mt-24 items-center gap-12 px-6 py-[12vh] lg:grid-cols-[1fr_0.9fr]">
      <div>
        <Reveal>
          <div className="eyebrow text-accent">Warm-up</div>
          <h2 className="display mt-5 text-[clamp(2.6rem,6vw,5rem)] leading-[0.9]">Ninety seconds on a single point.</h2>
        </Reveal>
        <Reveal delay={0.1}>
          <p className="mt-7 max-w-[48ch] text-[17px] leading-relaxed text-ink-2">
            When you sit down, Steen asks for the first small thing you&apos;ll do. Then the screen settles to a single dot. Rest your eyes on it, blink whenever you
            like, and come back when your gaze drifts. Close your eyes while the afterglow fades, and a soft tone starts your session.
          </p>
          <p className="mt-4 max-w-[48ch] text-[17px] leading-relaxed text-ink-2">
            It&apos;s inspired by trataka, a steady-gaze practice that small studies link to better attention and memory scores afterwards. No study has tested a short
            dot before work, so we keep it optional and honest: a calm way to start, not a promise. Choose 30 seconds to 3 minutes.
          </p>
        </Reveal>
        <Reveal delay={0.2}>
          <ul className="mt-9 space-y-2 border-t border-line pt-6 text-[13px] text-ink-3">
            {WARMUP_REFERENCES.slice(0, 2).concat(WARMUP_REFERENCES.slice(4, 5)).map((r) => (
              <li key={r.url}>
                <a href={r.url} target="_blank" rel="noreferrer" className="underline-offset-4 hover:text-ink hover:underline">
                  {r.citation}
                </a>
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
      <Reveal delay={0.15} y={40}>
        <WarmupDemo />
      </Reveal>
    </section>
  );
}
