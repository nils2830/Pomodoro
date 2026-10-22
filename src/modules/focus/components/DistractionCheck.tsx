"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { X } from "@phosphor-icons/react";
import { useEntries } from "@/core/data/entries";
import { useT } from "@/core/i18n";
import { cn } from "@/core/lib/cn";
import { timerEvents } from "../engine/events";
import { useFocusSettings } from "../store/settings";

const COUNTS = [0, 1, 2, 3, 4, 5];
const MINUTES = [
  { label: "Under 2 min", value: 1 },
  { label: "2–5 min", value: 4 },
  { label: "5–15 min", value: 10 },
  { label: "15+ min", value: 20 },
];
const HIDE_AFTER_MS = 3 * 60_000;

/**
 * After a focus session: "how many times did you drift off, and for how long?"
 * Two taps at most, easy to ignore. Saved on the session, shown in Insights.
 */
export function DistractionCheck() {
  const t = useT();
  const [entryId, setEntryId] = useState<string | null>(null);
  const [count, setCount] = useState<number | null>(null);

  useEffect(
    () =>
      timerEvents.on((e) => {
        if (e.mode !== "focus" || !e.entry || !useFocusSettings.getState().doc.askDistractions) return;
        setEntryId(e.entry.id);
        setCount(null);
      }),
    [],
  );

  useEffect(() => {
    if (!entryId) return;
    const id = window.setTimeout(() => setEntryId(null), HIDE_AFTER_MS);
    return () => window.clearTimeout(id);
  }, [entryId]);

  const save = (distractions: number, distractedMin: number) => {
    if (entryId) useEntries.getState().update(entryId, { distractions, distractedMin });
    setEntryId(null);
  };

  const pick = (n: number) => {
    if (n === 0) save(0, 0);
    else setCount(n);
  };

  return (
    <AnimatePresence>
      {entryId && (
        <motion.div
          key="distraction-check"
          role="dialog"
          aria-label={t("How focused was that session?")}
          className="neutral fixed inset-x-3 bottom-24 z-[60] mx-auto max-w-[420px] rounded-[26px] bg-page p-5 text-ink shadow-[0_30px_80px_-30px_rgb(0_0_0/0.6)] ring-1 ring-line md:bottom-6"
          initial={{ opacity: 0, y: 24, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        >
          <button
            type="button"
            onClick={() => setEntryId(null)}
            aria-label={t("Not now")}
            className="absolute top-3 right-3 grid size-8 place-items-center rounded-full text-ink-3 hover:bg-fill hover:text-ink"
          >
            <X size={14} weight="bold" />
          </button>
          <AnimatePresence mode="wait" initial={false}>
            {count === null ? (
              <motion.div key="count" initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 8 }} transition={{ duration: 0.2 }}>
                <div className="pr-8 text-[15px] font-medium">{t("How many times did you get distracted?")}</div>
                <p className="mt-1 text-[13px] text-ink-3">{t("A rough count is fine. It shows up in Insights.")}</p>
                <div className="mt-4 grid grid-cols-6 gap-1.5">
                  {COUNTS.map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => pick(n)}
                      className={cn(
                        "h-11 rounded-2xl text-[15px] font-semibold tabular-nums transition-colors",
                        n === 0 ? "bg-ink text-page hover:opacity-90" : "bg-fill hover:bg-ink/10",
                      )}
                    >
                      {n === 5 ? "5+" : n}
                    </button>
                  ))}
                </div>
              </motion.div>
            ) : (
              <motion.div key="minutes" initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                <div className="pr-8 text-[15px] font-medium">{t("About how long did they take, in total?")}</div>
                <div className="mt-4 grid grid-cols-2 gap-1.5">
                  {MINUTES.map((m) => (
                    <button
                      key={m.value}
                      type="button"
                      onClick={() => save(count, m.value)}
                      className="h-11 rounded-2xl bg-fill text-[14px] font-medium transition-colors hover:bg-ink/10"
                    >
                      {t(m.label)}
                    </button>
                  ))}
                </div>
                <button type="button" onClick={() => setCount(null)} className="mt-3 text-[12.5px] text-ink-3 hover:text-ink">
                  {t("Back")}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
