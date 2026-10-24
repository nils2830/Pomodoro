"use client";

import { useEffect, useRef, useState } from "react";
import { animate, motion, useInView } from "motion/react";
import { createRandom } from "@/core/lib/random";
import { useT } from "@/core/i18n";
import { Reveal } from "../motion";

function CountUp({ to, decimals = 0, suffix = "" }: { to: number; decimals?: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-15% 0px" });
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!inView) return;
    const controls = animate(0, to, { duration: 2, ease: [0.22, 1, 0.36, 1], onUpdate: setValue });
    return () => controls.stop();
  }, [inView, to]);
  return (
    <span ref={ref} className="tabular-nums">
      {value.toFixed(decimals)}
      {suffix}
    </span>
  );
}

const rnd = createRandom(11);
const WEEKS = 26;
const CELLS = Array.from({ length: WEEKS * 7 }, (_, i) => {
  const day = i % 7;
  const weekend = day >= 5;
  const base = weekend ? 0.25 : 0.7;
  const v = rnd.next() < (weekend ? 0.45 : 0.15) ? 0 : Math.min(4, Math.round((base + rnd.next() * 0.9) * 2.4 * (0.6 + (i / (WEEKS * 7)) * 0.6)));
  return v;
});

const level = (v: number) => (v === 0 ? "rgb(243 238 230 / 0.06)" : `color-mix(in oklab, var(--seq) ${[0, 30, 55, 78, 100][v]}%, #0c0b0a)`);

export function InsightsShowcase() {
  const t = useT();
  return (
    <section id="insights" className="mx-auto max-w-[1240px] scroll-mt-24 px-6 py-[14vh]">
      <Reveal>
        <div className="eyebrow text-accent">{t("Insights")}</div>
        <h2 className="display mt-5 max-w-[16ch] text-[clamp(2.6rem,6vw,5rem)] leading-[0.9]">{t("See how often you actually sit down.")}</h2>
        <p className="mt-6 max-w-[50ch] text-[17px] leading-relaxed text-ink-2">
          {t(
            "Back-to-back sessions become one sit-down, so the numbers match how your day felt. Then Steen shows your rhythm: when you start, how long you stay, which days slip, and what you spend the time on.",
          )}
        </p>
      </Reveal>

      <div className="mt-14 grid gap-4 lg:grid-cols-[1fr_1.5fr]">
        <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
          {[
            { v: 2.4, d: 1, s: "", label: "sit-downs on a working day" },
            { v: 52, d: 0, s: "m", label: "average sit-down" },
            { v: 13, d: 0, s: ` ${t("days")}`, label: "longest streak" },
          ].map((k, i) => (
            <Reveal key={k.label} delay={i * 0.1} className="rounded-[28px] bg-surface p-7 ring-1 ring-line">
              <div className="text-[clamp(2.4rem,4vw,3.4rem)] leading-none font-semibold tracking-[-0.04em]">
                <CountUp to={k.v} decimals={k.d} suffix={k.s} />
              </div>
              <div className="mt-3 text-[14px] text-ink-3">{t(k.label)}</div>
            </Reveal>
          ))}
        </div>
        <Reveal delay={0.15} className="rounded-[28px] bg-surface p-7 ring-1 ring-line">
          <div className="flex items-baseline justify-between">
            <div className="text-[15px] font-medium">{t("Six months at a glance")}</div>
            <div className="text-[13px] text-ink-3">{t("sample data")}</div>
          </div>
          <div className="mt-6 grid grid-flow-col grid-rows-7 gap-[5px]" style={{ gridTemplateColumns: `repeat(${WEEKS}, minmax(0, 1fr))` }}>
            {CELLS.map((v, i) => (
              <motion.span
                key={i}
                className="aspect-square rounded-[4px]"
                style={{ background: level(v) }}
                initial={{ opacity: 0, scale: 0.4 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, margin: "-10% 0px" }}
                transition={{ duration: 0.5, delay: 0.2 + Math.floor(i / 7) * 0.035 + (i % 7) * 0.01, ease: [0.22, 1, 0.36, 1] }}
              />
            ))}
          </div>
          <div className="mt-8 grid gap-3 border-t border-line pt-6 sm:grid-cols-2">
            {[
              ["Tuesdays are your strongest day", "2h 10m on average, against 1h 05m on other days."],
              ["You usually start around 08:45", "Give or take 20 minutes. That's a steady routine."],
            ].map(([title, body]) => (
              <div key={title}>
                <div className="display text-[18px] leading-snug">{t(title)}</div>
                <p className="mt-1 text-[14px] text-ink-3">{t(body)}</p>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
