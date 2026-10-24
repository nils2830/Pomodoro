"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { AppleLogo, ArrowRight } from "@phosphor-icons/react";
import { getBackground } from "@/core/theme/backgrounds";
import { formatClock, MINUTE } from "@/core/lib/time";
import { useT } from "@/core/i18n";
import { EASE, WordReveal } from "../motion";

/** A glass timer card that counts down for real while you read. */
function HeroTimer() {
  const t = useT();
  const [left, setLeft] = useState(25 * MINUTE - 7_000);
  useEffect(() => {
    const id = window.setInterval(() => setLeft((l) => (l <= 1000 ? 25 * MINUTE : l - 1000)), 1000);
    return () => window.clearInterval(id);
  }, []);
  const progress = 1 - left / (25 * MINUTE);
  const r = 46;
  const c = 2 * Math.PI * r;
  return (
    <div className="animate-bob w-[300px] rounded-[30px] bg-black/28 p-5 text-white shadow-[0_30px_80px_-30px_rgb(0_0_0/0.8)] ring-1 ring-white/15 backdrop-blur-2xl">
      <div className="flex items-center justify-between">
        <div className="flex gap-1 rounded-full bg-white/10 p-1 text-[11.5px]">
          <span className="rounded-full bg-white px-2.5 py-1 font-medium text-black">{t("Focus")}</span>
          <span className="px-2 py-1 text-white/70">{t("Break")}</span>
        </div>
        <svg width="38" height="38" viewBox="0 0 110 110" className="-rotate-90">
          <circle cx="55" cy="55" r={r} fill="none" stroke="white" strokeOpacity="0.18" strokeWidth="10" />
          <circle cx="55" cy="55" r={r} fill="none" stroke="white" strokeWidth="10" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * progress} style={{ transition: "stroke-dashoffset 1s linear" }} />
        </svg>
      </div>
      <div className="timer-digits mt-6 text-[78px] leading-none">{formatClock(left)}</div>
      <div className="mt-3 flex items-center justify-between text-[13px] text-white/75">
        <span>#3 · {t("Chapter 5 notes")}</span>
        <span className="flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-[#3987e5]" /> {t("Study")}
        </span>
      </div>
    </div>
  );
}

export function Hero() {
  const t = useT();
  const bg = getBackground("dawn")!;
  const reduce = useReducedMotion();
  const { scrollY } = useScroll();
  const imageY = useTransform(scrollY, [0, 900], ["0%", "16%"]);
  const contentY = useTransform(scrollY, [0, 600], [0, -90]);
  const contentOpacity = useTransform(scrollY, [0, 480], [1, 0]);

  return (
    <section className="relative h-[100svh] min-h-[680px] overflow-hidden" style={{ backgroundColor: bg.color }}>
      <motion.div className="absolute inset-[-4%]" style={reduce ? undefined : { y: imageY }}>
        <div className="absolute inset-0 scale-110 bg-cover bg-center blur-2xl" style={{ backgroundImage: `url(${bg.blur})` }} />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={bg.src} alt="" fetchPriority="high" className="animate-ken-burns absolute inset-0 size-full object-cover object-[92%_60%]" />
      </motion.div>
      <div className="absolute inset-0 bg-[radial-gradient(120%_80%_at_0%_100%,rgb(12_11_10/0.88),transparent_60%)]" />
      <div className="absolute inset-x-0 bottom-0 h-[42%] bg-gradient-to-t from-page via-page/40 to-transparent" />
      <div className="absolute inset-x-0 top-0 h-[38%] bg-gradient-to-b from-black/55 via-black/20 to-transparent" />

      <motion.div style={reduce ? undefined : { y: contentY, opacity: contentOpacity }} className="relative z-10 mx-auto flex h-full max-w-[1240px] flex-col justify-end px-6 pb-[12vh]">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.35, ease: EASE }}
          className="mb-7 inline-flex w-fit items-center gap-2 rounded-full bg-black/30 py-1.5 pr-3.5 pl-2 text-[13px] text-white ring-1 ring-white/15 backdrop-blur-md"
        >
          <span className="grid size-6 place-items-center rounded-full bg-white text-black">
            <AppleLogo size={13} weight="fill" />
          </span>
          {t("Coming soon to iPhone")}
        </motion.div>
        <h1 className="display max-w-[12ch] text-[clamp(3.4rem,10vw,9rem)] leading-[0.86] text-white">
          <WordReveal text={t("Focus, set in stone.")} delay={0.45} />
        </h1>
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.1, delay: 1.05, ease: EASE }}
          className="mt-7 max-w-[46ch] text-[clamp(1.05rem,1.6vw,1.3rem)] leading-relaxed text-white/80"
        >
          {t("A calm focus timer. Warm up on a single point, hide the countdown if it distracts you, and see how often you really sit down to work.")}
        </motion.p>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1.1, delay: 1.25, ease: EASE }} className="mt-9 flex flex-wrap gap-3">
          <Link
            href="/login?mode=signup"
            className="group inline-flex h-14 items-center gap-2 rounded-full bg-white px-7 text-[16px] font-medium text-black shadow-[0_16px_40px_-16px_rgb(255_255_255/0.5)] transition-transform hover:-translate-y-0.5"
          >
            {t("Create a free account")}
            <ArrowRight size={17} weight="bold" className="transition-transform group-hover:translate-x-0.5" />
          </Link>
          <Link href="/login" className="inline-flex h-14 items-center rounded-full bg-white/10 px-7 text-[16px] text-white ring-1 ring-white/20 backdrop-blur-md transition-colors hover:bg-white/15">
            {t("Sign in")}
          </Link>
        </motion.div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 40, filter: "blur(10px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        transition={{ duration: 1.4, delay: 1.5, ease: EASE }}
        className="absolute right-[3.5vw] bottom-[13vh] z-10 hidden lg:block"
      >
        <HeroTimer />
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.2, duration: 1 }} className="absolute bottom-6 left-1/2 z-10 hidden -translate-x-1/2 flex-col items-center gap-2 text-[11px] tracking-[0.2em] text-white/55 uppercase sm:flex">
        {t("Scroll")}
        <span className="relative h-10 w-px overflow-hidden bg-white/20">
          <motion.span className="absolute inset-x-0 top-0 h-4 bg-white" animate={{ y: [-16, 40] }} transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }} />
        </span>
      </motion.div>
    </section>
  );
}
