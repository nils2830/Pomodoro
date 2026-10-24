"use client";

import { useEffect, useRef, useState } from "react";
import { useInView } from "motion/react";
import { MINUTE } from "@/core/lib/time";
import { getBackground } from "@/core/theme/backgrounds";
import { modeVars, getTheme } from "@/core/theme/themes";
import { Digits } from "@/modules/focus/components/faces/Digits";
import { Ring } from "@/modules/focus/components/faces/Ring";
import { WallClock } from "@/modules/focus/components/faces/WallClock";
import { Sun } from "@/modules/focus/components/faces/Sun";
import { Tide } from "@/modules/focus/components/faces/Tide";
import { Words } from "@/modules/focus/components/faces/Words";
import type { FaceProps } from "@/modules/focus/components/faces/types";
import { useT } from "@/core/i18n";
import { Parallax, Reveal } from "../motion";

const FACES = [
  { name: "Digits", note: "The classic countdown.", C: Digits, offset: 0.12 },
  { name: "Wall clock", note: "The real time, your session on the dial.", C: WallClock, offset: 0.3 },
  { name: "Ring", note: "Shows when it ends, not seconds left.", C: Ring, offset: 0.45 },
  { name: "Sun arc", note: "Sunrise to sunset across the session.", C: Sun, offset: 0.55 },
  { name: "Tide", note: "A vessel that slowly drains.", C: Tide, offset: 0.68 },
  { name: "Words", note: "“About halfway.” Nothing more.", C: Words, offset: 0.5 },
];

/** Demo props for a face at a given point in a 25-minute session. */
function demo(progress: number, now: number): FaceProps {
  const planned = 25 * MINUTE;
  const elapsed = progress * planned;
  return {
    mode: "focus",
    flow: false,
    status: "running",
    now,
    plannedMs: planned,
    elapsedMs: elapsed,
    remainingMs: planned - elapsed,
    progress,
    startedAt: now - elapsed,
    endsAt: now + planned - elapsed,
    hourFormat: "24h",
    showSeconds: true,
    size: "stage",
  };
}

export function FacesShowcase() {
  const t = useT();
  const bg = getBackground("fjord")!;
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { margin: "-10% 0px" });
  const [tick, setTick] = useState(0);
  // The faces read the real clock, so they render after mount (no hydration drift).
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => setNow(Date.now()), []);
  useEffect(() => {
    if (!inView) return;
    const id = window.setInterval(() => {
      setTick((t) => t + 1);
      setNow(Date.now());
    }, 1000);
    return () => window.clearInterval(id);
  }, [inView]);
  const vars = modeVars(getTheme("ember"), "focus", false, { photo: true });

  return (
    <section id="faces" ref={ref} className="relative scroll-mt-24 overflow-hidden py-[14vh]">
      <Parallax speed={0.12} className="absolute inset-0">
        <div className="absolute inset-[-12%]" style={{ backgroundColor: bg.color, backgroundImage: `url(${bg.src})`, backgroundSize: "cover", backgroundPosition: "center" }} />
      </Parallax>
      <div className="absolute inset-0 bg-gradient-to-b from-page via-black/35 to-page" />
      <div className="relative mx-auto max-w-[1240px] px-6">
        <Reveal>
          <div className="eyebrow text-accent">{t("Faces")}</div>
          <h2 className="display mt-5 max-w-[14ch] text-[clamp(2.6rem,6vw,5rem)] leading-[0.9]">{t("Time without the ticking.")}</h2>
          <p className="mt-6 max-w-[46ch] text-[17px] leading-relaxed text-ink-2">
            {t("A countdown in the corner of your eye can become the thing you watch. Hide it with one key, or pick a face that shows time passing without counting seconds.")}
          </p>
        </Reveal>
        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3" style={vars}>
          {FACES.map((f, i) => {
            const p = Math.min(0.98, f.offset + (tick % 600) / 1500);
            const C = f.C;
            return (
              <Reveal key={f.name} delay={(i % 3) * 0.1}>
                <div className="rounded-[30px] bg-black/30 p-5 text-[oklch(0.985_0.012_85)] ring-1 ring-white/12 backdrop-blur-2xl">
                  <div className="grid h-[230px] place-items-center [container-type:size]">
                    {now !== null && <C {...demo(p, now)} />}
                  </div>
                  <div className="mt-4 flex items-baseline justify-between gap-3 border-t border-white/10 pt-4">
                    <span className="text-[15px] font-medium">{t(f.name)}</span>
                    <span className="text-right text-[13px] text-white/60">{t(f.note)}</span>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
