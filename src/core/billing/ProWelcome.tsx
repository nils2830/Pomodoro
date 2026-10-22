"use client";

import { useEffect, useState } from "react";
import { create } from "zustand";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowRight, Check } from "@phosphor-icons/react";
import { useAuth } from "../auth/store";
import { refreshAccount } from "../auth/AuthProvider";
import { usePrefs } from "../prefs";
import { useSyncStatus } from "../data/SyncProvider";
import { CAIRN_PATHS } from "../ui/Logo";
import { usePlan, useProSource } from "./entitlements";
import { FEATURES, PRO_HIGHLIGHTS } from "./plans";

const EASE = [0.22, 1, 0.36, 1] as const;
const SLOW_MS = 30_000;

type Phase = "idle" | "activating" | "celebrate";

/** Drives the Pro moment: "activating" right after checkout, then the celebration. */
export const useProWelcome = create<{ phase: Phase; activate(): void; celebrate(): void; close(): void }>()((set) => ({
  phase: "idle",
  activate: () => set({ phase: "activating" }),
  celebrate: () => set({ phase: "celebrate" }),
  close: () => set({ phase: "idle" }),
}));

/**
 * A short, calm celebration the first time an account gets Pro, whether it
 * was bought or given. Straight after checkout it first waits for Stripe to
 * confirm, with the stones settling, instead of a "may take a moment" notice.
 */
export function ProWelcome() {
  const phase = useProWelcome((s) => s.phase);
  const plan = usePlan();
  const source = useProSource();
  const signedIn = useAuth((s) => s.status === "signedIn");
  const synced = useSyncStatus((s) => s.lastSyncedAt != null);
  const welcomed = usePrefs((s) => s.doc.proWelcomed);
  const [slow, setSlow] = useState(false);

  // After checkout: ask for the new plan every few seconds until Stripe's webhook lands.
  useEffect(() => {
    if (phase !== "activating") return;
    if (plan === "pro") {
      useProWelcome.getState().celebrate();
      return;
    }
    setSlow(false);
    const poll = window.setInterval(() => void refreshAccount(), 2500);
    const later = window.setTimeout(() => setSlow(true), SLOW_MS);
    return () => {
      window.clearInterval(poll);
      window.clearTimeout(later);
    };
  }, [phase, plan]);

  // A gift (or a subscription bought elsewhere) gets the moment too, once per account.
  // Waiting for the first sync means another device's "already shown" counts.
  useEffect(() => {
    if (phase === "idle" && signedIn && synced && !welcomed && (source === "gift" || source === "subscription")) {
      useProWelcome.getState().celebrate();
    }
  }, [phase, signedIn, synced, welcomed, source]);

  const finish = () => {
    if (phase === "celebrate") usePrefs.getState().set({ proWelcomed: true });
    useProWelcome.getState().close();
  };

  return (
    <AnimatePresence>
      {phase !== "idle" && (
        <motion.div
          key="pro-welcome"
          role="dialog"
          aria-modal="true"
          aria-label="Steen Pro"
          className="fixed inset-0 z-[210] grid place-items-center overflow-y-auto bg-[#0d0c0b] px-6 py-16 text-[#f3eee6]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: EASE }}
        >
          <motion.div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{ background: "radial-gradient(60% 50% at 50% 42%, rgb(241 201 162 / 0.16), transparent 70%)" }}
            animate={{ opacity: phase === "celebrate" ? 1 : 0.4 }}
            transition={{ duration: 1.6, ease: "easeOut" }}
          />
          {phase === "activating" ? <Activating slow={slow} onClose={finish} /> : <Celebrate source={source} onDone={finish} />}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** The cairn: stones drop and settle one by one; while waiting they rest, faint and breathing. */
function Cairn({ settled }: { settled: boolean }) {
  const reduce = useReducedMotion();
  return (
    <div className="relative mx-auto size-[132px]">
      {settled && !reduce && (
        <motion.span
          aria-hidden
          className="absolute inset-0 rounded-full ring-1 ring-[#f1c9a2]/60"
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: [0.5, 1.9], opacity: [0, 0.7, 0] }}
          transition={{ duration: 1.6, delay: 1.05, ease: "easeOut" }}
        />
      )}
      <svg viewBox="0 0 32 32" className="relative size-full overflow-visible" fill="currentColor" aria-hidden>
        {CAIRN_PATHS.map((d, i) =>
          settled ? (
            <motion.path
              key={`s${i}`}
              d={d}
              initial={reduce ? { opacity: 0 } : { y: -26 - i * 4, opacity: 0, rotate: i % 2 ? 6 : -6 }}
              animate={{ y: 0, opacity: 1, rotate: 0 }}
              transition={reduce ? { duration: 0.4 } : { type: "spring", stiffness: 210, damping: 15, mass: 0.9, delay: 0.15 + i * 0.28 }}
              style={{ transformBox: "fill-box", transformOrigin: "50% 100%" }}
            />
          ) : (
            <motion.path
              key={`w${i}`}
              d={d}
              initial={{ opacity: 0.15 }}
              animate={reduce ? { opacity: 0.35 } : { opacity: [0.15, 0.6, 0.15], y: [0, -0.6, 0] }}
              transition={reduce ? { duration: 0.4 } : { duration: 2.4, repeat: Infinity, ease: "easeInOut", delay: (2 - i) * 0.35 }}
            />
          ),
        )}
      </svg>
    </div>
  );
}

function Activating({ slow, onClose }: { slow: boolean; onClose: () => void }) {
  return (
    <div className="relative w-full max-w-[460px] text-center">
      <Cairn settled={false} />
      <h2 className="display mt-10 text-[34px] leading-none">Setting up Pro</h2>
      <p className="mt-4 text-[15px] leading-relaxed text-white/55">
        {slow
          ? "Stripe is taking longer than usual. Pro switches on by itself the moment the payment is confirmed, so you can carry on."
          : "Stripe is confirming your payment. This only takes a few seconds."}
      </p>
      {slow && (
        <button type="button" onClick={onClose} className="mt-8 h-11 rounded-full px-6 text-[14px] text-white/70 ring-1 ring-white/15 hover:text-white">
          Continue to Steen
        </button>
      )}
    </div>
  );
}

function Celebrate({ source, onDone }: { source: ReturnType<typeof useProSource>; onDone: () => void }) {
  const name = usePrefs((s) => s.doc.name);
  const owner = useAuth((s) => s.grant?.note === "Owner");
  const title = name ? `Welcome to Pro, ${name}.` : "Welcome to Pro.";
  const subtitle = owner
    ? "Owner access. Everything in Steen is unlocked, for good."
    : source === "gift"
      ? "You've been given Steen Pro. Everything is unlocked."
      : "Thank you for supporting Steen. Everything is unlocked.";

  return (
    <div className="relative w-full max-w-[560px] text-center">
      <Cairn settled />
      <motion.div className="eyebrow mt-10 text-[#f1c9a2]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2, duration: 0.8 }}>
        Steen Pro
      </motion.div>
      <h2 className="display mt-4 text-[clamp(2.2rem,6vw,3.4rem)] leading-[0.95]">
        {title.split(" ").map((w, i) => (
          <motion.span
            key={i}
            className="inline-block"
            initial={{ opacity: 0, y: 14, filter: "blur(6px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ delay: 1.35 + i * 0.08, duration: 0.8, ease: EASE }}
          >
            {w}&nbsp;
          </motion.span>
        ))}
      </h2>
      <motion.p
        className="mx-auto mt-4 max-w-[40ch] text-[16px] leading-relaxed text-white/60"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.8, duration: 0.8, ease: EASE }}
      >
        {subtitle}
      </motion.p>
      <ul className="mx-auto mt-8 flex max-w-[520px] flex-wrap justify-center gap-2">
        {PRO_HIGHLIGHTS.slice(0, 6).map((f, i) => (
          <motion.li
            key={f}
            className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.06] px-3.5 py-2 text-[13.5px] text-white/80 ring-1 ring-white/10"
            initial={{ opacity: 0, y: 10, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 2.05 + i * 0.07, duration: 0.6, ease: EASE }}
          >
            <Check size={13} weight="bold" className="text-[#f1c9a2]" /> {FEATURES[f].label}
          </motion.li>
        ))}
      </ul>
      <motion.button
        type="button"
        autoFocus
        onClick={onDone}
        className="group mt-10 inline-flex h-13 items-center gap-2 rounded-full bg-[#f3eee6] px-7 py-3.5 text-[15px] font-medium text-[#12110f] transition-transform hover:-translate-y-0.5"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 2.6, duration: 0.7, ease: EASE }}
      >
        Start exploring <ArrowRight size={16} weight="bold" className="transition-transform group-hover:translate-x-0.5" />
      </motion.button>
    </div>
  );
}
