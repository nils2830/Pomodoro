"use client";

import { AnimatePresence, motion } from "motion/react";
import { Check, LockSimple, X } from "@phosphor-icons/react";
import { usePrefs } from "@/core/prefs";
import { useUI } from "@/core/ui/store";
import { useCan } from "@/core/billing/entitlements";
import { useGate } from "@/core/billing/useGate";
import { BACKGROUNDS } from "@/core/theme/backgrounds";
import { useT } from "@/core/i18n";
import { cn } from "@/core/lib/cn";
import { useFocusSettings } from "../store/settings";

const PICKS = ["dawn", "fjord", "moss", "night"];

/** First visits: a quick way to swap the plain colour for a landscape, easy to dismiss for good. */
export function BackgroundNudge() {
  const t = useT();
  const done = usePrefs((p) => p.doc.bgNudgeDone);
  const setPrefs = usePrefs((p) => p.set);
  const current = useFocusSettings((s) => s.doc.background);
  const set = useFocusSettings((s) => s.set);
  const canAll = useCan("backgrounds.all");
  const gate = useGate();
  const picks = PICKS.map((id) => BACKGROUNDS.find((b) => b.id === id)).filter((b) => b != null);
  const close = () => setPrefs({ bgNudgeDone: true });

  return (
    <AnimatePresence initial={false}>
      {!done && (
        <motion.div
          key="bg-nudge"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="overflow-hidden"
        >
          <div className="mb-6 rounded-[24px] bg-fill p-4">
            <div className="flex items-start gap-3">
              <div className="min-w-0 flex-1">
                <div className="text-[14.5px] font-medium">{t("Pick a place to sit")}</div>
                <p className="text-[12.5px] text-ink-3">{t("Tap one to try it. More in settings.")}</p>
              </div>
              <button type="button" onClick={close} aria-label={t("Close")} className="grid size-7 shrink-0 place-items-center rounded-full text-ink-3 hover:bg-ink/10 hover:text-ink">
                <X size={13} weight="bold" />
              </button>
            </div>
            <div className="mt-3 grid grid-cols-5 gap-1.5">
              <button
                type="button"
                onClick={() => set({ background: "none" })}
                aria-pressed={current === "none"}
                aria-label={t("Theme colour")}
                className={cn("relative aspect-square rounded-xl bg-page ring-2 transition-all", current === "none" ? "ring-ink" : "ring-line hover:ring-ink/40")}
              >
                {current === "none" && <Check size={13} weight="bold" className="absolute inset-0 m-auto" />}
              </button>
              {picks.map((b) => {
                const active = current === b.id;
                const apply = () => set({ background: b.id });
                return (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => (b.pro ? gate("backgrounds.all", apply) : apply())}
                    aria-pressed={active}
                    aria-label={t("{name} background", { name: t(b.name) })}
                    className={cn("relative aspect-square overflow-hidden rounded-xl ring-2 transition-all", active ? "ring-ink" : "ring-transparent hover:ring-ink/40")}
                    style={{ backgroundColor: b.color, backgroundImage: `url(${b.blur})`, backgroundSize: "cover" }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={b.src} alt="" loading="lazy" className="absolute inset-0 size-full object-cover" />
                    {(active || (b.pro && !canAll)) && (
                      <span className="absolute inset-0 grid place-items-center bg-black/25 text-white">
                        {active ? <Check size={13} weight="bold" /> : <LockSimple size={12} weight="bold" />}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            <div className="mt-3 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  close();
                  useUI.getState().openSettings("appearance");
                }}
                className="text-[12.5px] text-ink-3 hover:text-ink"
              >
                {t("All backgrounds")}
              </button>
              <button type="button" onClick={close} className="rounded-full bg-ink px-3.5 py-1.5 text-[12.5px] font-semibold text-page">
                {current === "none" ? t("Keep as is") : t("Done")}
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
