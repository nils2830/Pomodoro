"use client";

import { useCallback, useEffect, useLayoutEffect, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { create } from "zustand";
import { usePrefs } from "@/core/prefs";
import { useT } from "@/core/i18n";
import { Button } from "@/core/ui/Button";

const STEPS = [
  { id: "timer", title: "Your timer", body: "This is where the session runs. You can change how the clock looks, or hide it completely and let the time run on its own." },
  { id: "modes", title: "Focus and breaks", body: "Switch between focus, a short break and a long break. Next to them you pick what you're working on and the timer's face." },
  { id: "controls", title: "Start", body: "Start, pause and skip here. Before a new sit-down, a short warm-up can help you settle first." },
  { id: "tasks", title: "Tasks", body: "Write down what you want to get done and tick it off as you go." },
  { id: "goal", title: "Today", body: "How much you've focused today, measured against your goal." },
  { id: "nav", title: "Insights", body: "When and how long you focus, how often you get distracted, and what helps. It fills in as you use Steen." },
  { id: "settings", title: "Settings", body: "Backgrounds, colours, warm-up, sounds and language. You can take this tour again from here." },
];

export const useTour = create<{ open: boolean; start(): void; stop(): void }>((set) => ({
  open: false,
  start: () => set({ open: true }),
  stop: () => set({ open: false }),
}));

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
    document.querySelector(`[data-tour="${step.id}"]`)?.scrollIntoView({ block: "center", behavior: "smooth" });
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

  const vw = typeof window === "undefined" ? 1024 : window.innerWidth;
  const vh = typeof window === "undefined" ? 768 : window.innerHeight;
  const cardW = Math.min(340, vw - 24);
  const below = rect ? rect.top + rect.height + 200 < vh : true;
  const cardTop = rect ? (below ? rect.top + rect.height + 12 : Math.max(12, rect.top - 12 - 190)) : vh / 2 - 90;
  const cardLeft = rect ? Math.min(Math.max(12, rect.left + rect.width / 2 - cardW / 2), vw - cardW - 12) : vw / 2 - cardW / 2;
  const last = i === steps.length - 1;

  return createPortal(
    <>
      <AnimatePresence>
        {offer && !open && (
          <motion.div
            key="offer"
            className="neutral fixed inset-x-3 bottom-24 z-[70] mx-auto max-w-[400px] rounded-[26px] bg-page p-5 text-ink shadow-[0_30px_80px_-30px_rgb(0_0_0/0.6)] ring-1 ring-line md:bottom-6"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="text-[15px] font-medium">{t("New here? A quick look around")}</div>
            <p className="mt-1 text-[13.5px] text-ink-3">{t("Seven short stops, about 30 seconds. You can skip it and find it later in settings.")}</p>
            <div className="mt-4 flex gap-2">
              <Button size="sm" onClick={() => useTour.getState().start()}>
                {t("Show me")}
              </Button>
              <Button size="sm" variant="outline" onClick={finish}>
                {t("No thanks")}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {step && (
          <motion.div key="tour" className="fixed inset-0 z-[90]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
            {/* Catches clicks so the page underneath stays still during the tour. */}
            <div className="absolute inset-0" onClick={() => setI((n) => (n + 1 < steps.length ? n + 1 : n))} />
            {rect && (
              <motion.div
                aria-hidden
                className="pointer-events-none absolute rounded-[26px] shadow-[0_0_0_200vmax_rgb(8_8_6/0.72)] ring-2 ring-white/70"
                initial={false}
                animate={rect}
                transition={{ type: "spring", stiffness: 260, damping: 32 }}
              />
            )}
            <motion.div
              role="dialog"
              aria-label={t(step.title)}
              className="neutral absolute rounded-[24px] bg-page p-5 text-ink shadow-[0_30px_80px_-30px_rgb(0_0_0/0.7)]"
              style={{ width: cardW }}
              initial={false}
              animate={{ top: cardTop, left: cardLeft }}
              transition={{ type: "spring", stiffness: 260, damping: 32 }}
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.div key={step.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.18 }}>
                  <div className="eyebrow text-ink-3 tabular-nums">
                    {i + 1} / {steps.length}
                  </div>
                  <div className="mt-2 text-[17px] font-semibold tracking-[-0.01em]">{t(step.title)}</div>
                  <p className="mt-1.5 text-[14px] leading-snug text-ink-2">{t(step.body)}</p>
                </motion.div>
              </AnimatePresence>
              <div className="mt-4 flex items-center gap-2">
                <button type="button" onClick={finish} className="mr-auto text-[13px] text-ink-3 hover:text-ink">
                  {t("Skip")}
                </button>
                {i > 0 && (
                  <Button size="sm" variant="outline" onClick={() => setI(i - 1)}>
                    {t("Back")}
                  </Button>
                )}
                <Button size="sm" onClick={() => (last ? finish() : setI(i + 1))}>
                  {last ? t("Done") : t("Next")}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>,
    document.body,
  );
}
