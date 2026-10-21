"use client";

import Link from "next/link";
import { ArrowRight, Check } from "@phosphor-icons/react";
import { FEATURES, FREE_INCLUDES, PRICING, PRO_HIGHLIGHTS } from "@/core/billing/plans";
import { getBackground } from "@/core/theme/backgrounds";
import { Parallax, Reveal } from "../motion";

export function PricingTeaser() {
  const yearlyMonthly = (PRICING.yearly / 12).toFixed(2).replace(/\.00$/, "");
  return (
    <section className="mx-auto max-w-[1240px] px-6 py-[12vh]">
      <Reveal>
        <div className="eyebrow text-accent">Pricing</div>
        <h2 className="display mt-5 max-w-[16ch] text-[clamp(2.6rem,6vw,5rem)] leading-[0.9]">Free to focus. Pro to go deeper.</h2>
      </Reveal>
      <div className="mt-12 grid gap-4 md:grid-cols-2">
        <Reveal className="rounded-[32px] bg-surface p-8 ring-1 ring-line">
          <div className="text-[15px] font-medium">Free</div>
          <div className="mt-4 text-[56px] leading-none font-semibold tracking-[-0.05em]">{PRICING.symbol}0</div>
          <ul className="mt-7 space-y-2.5">
            {FREE_INCLUDES.slice(0, 6).map((f) => (
              <li key={f} className="flex gap-2.5 text-[15px] text-ink-2">
                <Check size={16} weight="bold" className="mt-1 shrink-0 text-ink-3" /> {f}
              </li>
            ))}
          </ul>
        </Reveal>
        <Reveal delay={0.1} className="relative overflow-hidden rounded-[32px] bg-[#f3eee6] p-8 text-[#12110f]">
          <div className="text-[15px] font-medium">Pro</div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-[56px] leading-none font-semibold tracking-[-0.05em]">
              {PRICING.symbol}
              {yearlyMonthly}
            </span>
            <span className="text-[15px] text-black/55">/ month, billed yearly</span>
          </div>
          <ul className="mt-7 space-y-2.5">
            {PRO_HIGHLIGHTS.slice(0, 6).map((f) => (
              <li key={f} className="flex gap-2.5 text-[15px] text-black/75">
                <Check size={16} weight="bold" className="mt-1 shrink-0 text-black/45" /> {FEATURES[f].label}
              </li>
            ))}
          </ul>
          <Link href="/pricing" className="mt-8 inline-flex items-center gap-1.5 text-[15px] font-medium underline-offset-4 hover:underline">
            Compare plans <ArrowRight size={14} weight="bold" />
          </Link>
        </Reveal>
      </div>
    </section>
  );
}

export function FinalCta() {
  const bg = getBackground("night")!;
  return (
    <section className="relative mx-3 mb-3 overflow-hidden rounded-[40px] sm:mx-5">
      <Parallax speed={0.1} className="absolute inset-0">
        <div className="absolute inset-[-10%]" style={{ backgroundColor: bg.color, backgroundImage: `url(${bg.src})`, backgroundSize: "cover", backgroundPosition: "center 40%" }} />
      </Parallax>
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/40" />
      <div className="relative mx-auto flex min-h-[80svh] max-w-[1240px] flex-col items-center justify-center px-6 py-24 text-center text-white">
        <Reveal>
          <h2 className="display text-[clamp(3rem,9vw,8rem)] leading-[0.86]">Sit down. Start small.</h2>
        </Reveal>
        <Reveal delay={0.12}>
          <p className="mx-auto mt-7 max-w-[40ch] text-[18px] leading-relaxed text-white/75">One warm-up, one session, one stone on the pile. Free, with an account that keeps your progress safe.</p>
        </Reveal>
        <Reveal delay={0.22}>
          <Link
            href="/login?mode=signup"
            className="group mt-10 inline-flex h-14 items-center gap-2 rounded-full bg-white px-8 text-[16px] font-medium text-black transition-transform hover:-translate-y-0.5"
          >
            Create a free account <ArrowRight size={17} weight="bold" className="transition-transform group-hover:translate-x-0.5" />
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
