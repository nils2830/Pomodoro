"use client";

import { motion, useReducedMotion, useTransform } from "motion/react";
import { AppleLogo, DeviceMobile, Export } from "@phosphor-icons/react";
import { getBackground } from "@/core/theme/backgrounds";
import { LogoMark } from "@/core/ui/Logo";
import { Reveal, useSectionProgress } from "../motion";

/** A phone, drawn in CSS, showing Steen running. */
export function PhoneMockup() {
  const bg = getBackground("moss")!;
  return (
    <div className="relative mx-auto aspect-[9/19.5] w-[min(78vw,320px)] rounded-[54px] bg-[#0b0b0b] p-[11px] shadow-[0_50px_120px_-40px_rgb(0_0_0/0.9),inset_0_0_0_1.5px_rgb(255_255_255/0.12)]">
      <div className="relative size-full overflow-hidden rounded-[44px]" style={{ backgroundColor: bg.color }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={bg.src} alt="" loading="lazy" className="absolute inset-0 size-full object-cover object-[45%_50%]" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-black/25 to-black/70" />
        <div className="absolute top-3 left-1/2 h-[30px] w-[100px] -translate-x-1/2 rounded-full bg-black" />
        <div className="relative flex h-full flex-col items-center px-6 pt-16 pb-10 text-white">
          <div className="flex items-center gap-1.5 text-[13px] text-white/80">
            <LogoMark size={14} /> steen
          </div>
          <div className="mt-6 flex gap-1 rounded-full bg-white/12 p-1 text-[11px] backdrop-blur">
            <span className="rounded-full bg-white px-3 py-1 font-medium text-black">Focus</span>
            <span className="px-2.5 py-1 text-white/70">Break</span>
          </div>
          <div className="timer-digits mt-auto text-[86px] leading-none">18:42</div>
          <div className="mt-3 text-[13px] text-white/70">#2 · Problem set 4</div>
          <div className="mt-auto mb-2 flex h-14 w-full items-center justify-center rounded-full bg-white text-[15px] font-semibold tracking-[0.14em] text-black uppercase">Pause</div>
        </div>
      </div>
    </div>
  );
}

export function IphoneSection() {
  const [ref, progress] = useSectionProgress<HTMLElement>(["start end", "end start"]);
  const reduce = useReducedMotion();
  const rotate = useTransform(progress, [0, 0.5, 1], [-10, 0, 6]);
  const y = useTransform(progress, [0, 1], [80, -80]);
  return (
    <section ref={ref} className="relative overflow-hidden py-[14vh]">
      <div className="absolute inset-0 bg-[radial-gradient(50%_60%_at_70%_50%,#2a2119,transparent)]" />
      <div className="relative mx-auto grid max-w-[1240px] items-center gap-16 px-6 lg:grid-cols-2">
        <div>
          <Reveal>
            <div className="eyebrow text-accent">iPhone</div>
            <h2 className="display mt-5 max-w-[12ch] text-[clamp(2.6rem,6vw,5rem)] leading-[0.9]">Steen for iPhone is on its way.</h2>
            <p className="mt-6 max-w-[44ch] text-[17px] leading-relaxed text-ink-2">
              A native app with the same calm: Live Activities on the lock screen, a warm-up that fills the screen, and everything synced with your account.
            </p>
          </Reveal>
          <Reveal delay={0.12}>
            <div className="mt-9 inline-flex items-center gap-3 rounded-2xl bg-white/[0.06] px-5 py-3.5 ring-1 ring-white/12">
              <AppleLogo size={30} weight="fill" />
              <div className="leading-tight">
                <div className="text-[11px] tracking-[0.06em] text-ink-3 uppercase">Coming soon on the</div>
                <div className="text-[19px] font-semibold tracking-[-0.01em]">App Store</div>
              </div>
            </div>
            <div className="mt-8 flex max-w-[46ch] gap-3 rounded-2xl bg-surface p-5 ring-1 ring-line">
              <DeviceMobile size={22} weight="duotone" className="mt-0.5 shrink-0 text-accent" />
              <p className="text-[14.5px] leading-relaxed text-ink-2">
                Until then, open Steen in Safari, tap <Export size={14} weight="bold" className="inline -translate-y-px" /> Share, then <b className="font-medium text-ink">Add to Home Screen</b>.
                It opens full screen, like an app.
              </p>
            </div>
          </Reveal>
        </div>
        <motion.div style={reduce ? undefined : { rotate, y }} className="[perspective:1200px]">
          <PhoneMockup />
        </motion.div>
      </div>
    </section>
  );
}
