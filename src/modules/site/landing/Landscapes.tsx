"use client";

import { motion, useReducedMotion, useTransform } from "motion/react";
import { BACKGROUNDS } from "@/core/theme/backgrounds";
import { useT } from "@/core/i18n";
import { Reveal, useSectionProgress } from "../motion";

/** A gallery that glides sideways as you scroll down. */
export function Landscapes() {
  const t = useT();
  const [ref, progress] = useSectionProgress<HTMLElement>(["start end", "end start"]);
  const reduce = useReducedMotion();
  const x = useTransform(progress, [0, 1], ["6%", "-38%"]);
  return (
    <section ref={ref} className="overflow-hidden py-[12vh]">
      <div className="mx-auto max-w-[1240px] px-6">
        <Reveal>
          <div className="eyebrow text-accent">{t("Landscapes")}</div>
          <h2 className="display mt-5 max-w-[14ch] text-[clamp(2.6rem,6vw,5rem)] leading-[0.9]">{t("Pick a place to sit.")}</h2>
          <p className="mt-6 max-w-[46ch] text-[17px] leading-relaxed text-ink-2">
            {t("Six quiet landscapes made for Steen, from a cairn at dawn to a ridge under the Milky Way. Your timer sits on top, tinted by the mode you are in.")}
          </p>
        </Reveal>
      </div>
      <motion.div style={reduce ? undefined : { x }} className="mt-14 flex w-max gap-4 pl-6">
        {BACKGROUNDS.map((b, i) => (
          <motion.figure
            key={b.id}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
            className="group relative h-[min(62vh,520px)] w-[min(78vw,380px)] overflow-hidden rounded-[30px]"
            style={{ backgroundColor: b.color }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={b.src} alt="" loading="lazy" className="absolute inset-0 size-full object-cover transition-transform duration-[1.6s] ease-[cubic-bezier(.22,1,.36,1)] group-hover:scale-[1.06]" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
            <figcaption className="absolute inset-x-6 bottom-6 text-white">
              <div className="display text-[26px] leading-none">{t(b.name)}</div>
              <div className="mt-1.5 text-[13px] text-white/70">{t(b.description)}</div>
            </figcaption>
            {b.pro && <span className="absolute top-5 right-5 rounded-full bg-black/40 px-2 py-1 font-mono text-[9.5px] tracking-[0.12em] text-white backdrop-blur">PRO</span>}
          </motion.figure>
        ))}
      </motion.div>
    </section>
  );
}
