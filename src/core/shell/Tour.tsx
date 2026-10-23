"use client";

import { useCallback, useEffect, useLayoutEffect, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { create } from "zustand";
import { ChartLineUp, GearSix, ListChecks, Play, SlidersHorizontal, Sparkle, Target, Timer, X, type Icon } from "@phosphor-icons/react";
import { usePrefs } from "@/core/prefs";
import { useT } from "@/core/i18n";
import { Button } from "@/core/ui/Button";

const STEPS: { id: string; title: string; body: string; icon: Icon; hue: number }[] = [
  { id: "timer", title: "Timer", body: "Shows the time left in the session.", icon: Timer, hue: 35 },
  { id: "modes", title: "Modes", body: "Choose focus or a break, the activity and the clock style.", icon: SlidersHorizontal, hue: 300 },
  { id: "controls", title: "Start", body: "Starts, pauses or skips the session.", icon: Play, hue: 150 },
  { id: "tasks", title: "Tasks", body: "What you plan to do. Tick it off when done.", icon: ListChecks, hue: 230 },
  { id: "goal", title: "Today", body: "Focus time today against your daily goal.", icon: Target, hue: 15 },
  { id: "nav", title: "Insights", body: "Your focus history and patterns.", icon: ChartLineUp, hue: 260 },
  { id: "settings", title: "Settings", body: "Look, sounds, warm-up and language.", icon: GearSix, hue: 80 },
];

export const useTour = create<{ open: boolean; start(): void; stop(): void }>((set) => ({
  open: false,
  start: () => set({ open: true }),
  stop: () => set({ open: false }),
}));

/** Unhurried, so the eye can follow the spotlight. */
const EASE = { duration: 0.8, ease: [0.22, 1, 0.36, 1] } as const;

type Rect = { top: number; left: number; width: number; height: number };
const PAD = 10;

function rectOf(id: string): Rect | null {
  const el = document.querySelector(`[data-tour="${id}"]`);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  if (!r.width || !r.height) return null;
  return { top: r.top - PAD, left: r.left - PAD, width: r.width + PAD * 2, height: r.height + PAD * 2 };
}

/** Offers a short tour to new members, then spotlights each part of the timer page in turn. */
export function Tour() {
  const t = useT();
  const pathname = usePathname();
  const { nameAsked, tourDone } = usePrefs((p) => p.doc);
  const setPrefs = usePrefs((p) => p.set);
  const open = useTour((s) => s.open);
  const [offer, setOffer] = useState(false);
  const [steps, setSteps] = useState(STEPS);
  const [i, setI] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);

  useEffect(() => {
    if (pathname !== "/" || !nameAsked || tourDone || open) return setOffer(false);
    const id = window.setTimeout(() => setOffer(true), 1200);
    return () => window.clearTimeout(id);
  }, [pathname, nameAsked, tourDone, open]);

  const finish = useCallback(() => {
    useTour.getState().stop();
    setOffer(false);
    setPrefs({ tourDone: true });
  }, [setPrefs]);

  // Only the parts that are on screen at this width.
  useLayoutEffect(() => {
    if (!open) return;
    setSteps(STEPS.filter((s) => rectOf(s.id)));
    setI(0);
  }, [open]);

  const step = open ? steps[i] : undefined;

  useEffect(() => {
    if (!step) return;
    // Scroll only when the part is out of view, and only as far as needed, so the page doesn't bounce between steps.
    const r = document.querySelector(`[data-tour="${step.id}"]`)?.getBoundingClientRect();
    if (r && r.top < 72) window.scrollBy({ top: r.top - 96, behavior: "smooth" });
    else if (r && r.bottom > window.innerHeight - 16) window.scrollBy({ top: Math.min(r.bottom - window.innerHeight + 32, r.top - 96), behavior: "smooth" });
    let raf = 0;
    const tick = () => {
      setRect(rectOf(step.id));
      raf = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(raf);
  }, [step]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") finish();
      if (e.key === "ArrowRight") setI((n) => (n + 1 < steps.length ? n + 1 : n));
      if (e.key === "ArrowLeft") setI((n) => Math.max(0, n - 1));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, steps.length, finish]);

  if (typeof document === "undefined") return null;

  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const cardW = Math.min(360, vw - 24);
  const cardH = 196;
  // Below the part if it fits, else above, else wherever there's more room, kept on screen.
  let cardTop = vh / 2 - cardH / 2;
  if (rect) {
    const roomBelow = vh - (rect.top + rect.height);
    if (roomBelow >= cardH + 24) cardTop = rect.top + rect.height + 14;
    else if (rect.top >= cardH + 24) cardTop = rect.top - cardH - 14;
    else cardTop = roomBelow > rect.top ? vh - cardH - 16 : 16;
  }
  cardTop = Math.min(Math.max(12, cardTop), vh - cardH - 12);
  const cardLeft = rect ? Math.min(Math.max(12, rect.left + rect.width / 2 - cardW / 2), vw - cardW - 12) : vw / 2 - cardW / 2;
  const last = i === steps.length - 1;
  const accent = step ? `oklch(0.72 0.13 ${step.hue})` : "transparent";

  return createPortal(
    <>
      <AnimatePresence>
        {offer && !open && (
          <motion.div
            key="offer"
            className="neutral fixed right-3 bottom-24 z-[70] flex items-center gap-1 rounded-full bg-page py-1.5 pr-1.5 pl-2 text-ink shadow-[0_20px_50px_-24px_rgb(0_0_0/0.55)] ring-1 ring-line md:right-6 md:bottom-6"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={EASE}
          >
            <span className="grid size-8 place-items-center rounded-full bg-[oklch(0.72_0.13_80/0.22)] text-[oklch(0.55_0.13_80)]">
              <Sparkle size={15} weight="duotone" />
            </span>
            <span className="mr-2 ml-1 text-[13.5px] font-medium">{t("New here?")}</span>
            <button type="button" onClick={() => useTour.getState().start()} className="h-8 rounded-full bg-ink px-3.5 text-[12.5px] font-semibold text-page">
              {t("Take the tour")}
            </button>
            <button type="button" onClick={finish} aria-label={t("No thanks")} className="grid size-8 place-items-center rounded-full text-ink-3 hover:bg-fill hover:text-ink">
              <X size={13} weight="bold" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {step && (
          <motion.div key="tour" className="fixed inset-0 z-[90]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }}>
            {/* Catches clicks so the page underneath stays still during the tour. */}
            <div className="absolute inset-0" onClick={() => setI((n) => (n + 1 < steps.length ? n + 1 : n))} />
            {rect && (
              <motion.div
                aria-hidden
                className="pointer-events-none absolute rounded-[26px] shadow-[0_0_0_200vmax_rgb(8_8_6/0.72)]"
                initial={false}
                animate={{ ...rect, boxShadow: `0 0 0 2px ${accent}, 0 0 40px 4px ${accent}, 0 0 0 200vmax rgb(8 8 6 / 0.72)` }}
                transition={EASE}
              />
            )}
            <motion.div
              role="dialog"
              aria-label={t(step.title)}
              className="neutral absolute overflow-hidden rounded-[26px] bg-page text-ink shadow-[0_30px_80px_-30px_rgb(0_0_0/0.7)]"
              style={{ width: cardW }}
              initial={false}
              animate={{ top: cardTop, left: cardLeft }}
              transition={EASE}
            >
              <motion.div
                aria-hidden
                className="pointer-events-none absolute -top-16 -right-10 size-44 rounded-full blur-2xl"
                animate={{ backgroundColor: accent, opacity: 0.28 }}
                transition={EASE}
              />
              <button type="button" onClick={finish} aria-label={t("Skip")} className="absolute top-3 right-3 z-[1] grid size-8 place-items-center rounded-full text-ink-3 hover:bg-fill hover:text-ink">
                <X size={13} weight="bold" />
              </button>
              <div className="relative p-5">
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={step.id}
                    className="flex gap-3.5"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.35, ease: "easeOut" }}
                  >
                    <motion.span
                      className="grid size-11 shrink-0 place-items-center rounded-2xl"
                      style={{ background: `oklch(0.72 0.13 ${step.hue} / 0.2)`, color: `oklch(0.5 0.14 ${step.hue})` }}
                      initial={{ scale: 0.6, rotate: -12 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: "spring", stiffness: 220, damping: 14, delay: 0.1 }}
                    >
                      <step.icon size={22} weight="duotone" />
                    </motion.span>
                    <div className="min-w-0 pr-6">
                      <div className="text-[17px] font-semibold tracking-[-0.01em]">{t(step.title)}</div>
                      <p className="mt-0.5 text-[14px] leading-snug text-ink-2">{t(step.body)}</p>
                    </div>
                  </motion.div>
                </AnimatePresence>
                <div className="mt-5 flex items-center gap-2">
                  <div className="mr-auto flex items-center gap-1.5" aria-label={`${i + 1} / ${steps.length}`}>
                    {steps.map((s, n) => (
                      <motion.span
                        key={s.id}
                        className="h-1.5 rounded-full"
                        initial={false}
                        animate={{ width: n === i ? 18 : 6, backgroundColor: n === i ? accent : "var(--c-line)" }}
                        transition={EASE}
                      />
                    ))}
                  </div>
                  {i > 0 && (
                    <Button size="sm" variant="outline" onClick={() => setI(i - 1)}>
                      {t("Back")}
                    </Button>
                  )}
                  <Button size="sm" onClick={() => (last ? finish() : setI(i + 1))}>
                    {last ? t("Done") : t("Next")}
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>,
    document.body,
  );
}
