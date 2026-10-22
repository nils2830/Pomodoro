"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight } from "@phosphor-icons/react";
import { useAuth } from "../auth/store";
import { getSupabase } from "../auth/supabase-browser";
import { usePrefs } from "../prefs";
import { useSyncStatus } from "../data/SyncProvider";
import { LogoMark } from "../ui/Logo";

const EASE = [0.22, 1, 0.36, 1] as const;

/** First name from what Google or Apple shared at sign-in, if anything. */
function suggestedName(meta: Record<string, unknown> | undefined): string {
  const raw = [meta?.given_name, meta?.full_name, meta?.name].find((v) => typeof v === "string" && v.trim()) as string | undefined;
  return raw ? raw.trim().split(/\s+/)[0].slice(0, 40) : "";
}

/**
 * Asks once per account what Steen should call you. Waits for the first sync,
 * so a name already set on another device is used instead of asking again.
 */
export function NamePrompt() {
  const status = useAuth((s) => s.status);
  const user = useAuth((s) => s.user);
  const synced = useSyncStatus((s) => s.lastSyncedAt != null);
  const asked = usePrefs((s) => s.doc.nameAsked || Boolean(s.doc.name));
  const set = usePrefs((s) => s.set);
  const [name, setName] = useState("");
  const show = status === "signedIn" && synced && !asked;

  useEffect(() => {
    if (show) setName(suggestedName(user?.user_metadata));
  }, [show, user]);

  const save = (value: string) => {
    const clean = value.trim().slice(0, 40);
    set({ name: clean, nameAsked: true });
    if (clean) void getSupabase()?.auth.updateUser({ data: { display_name: clean } });
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="name-prompt"
          role="dialog"
          aria-modal="true"
          aria-labelledby="name-prompt-title"
          className="neutral fixed inset-0 z-[150] grid place-items-center bg-black/55 px-5 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
        >
          <motion.form
            onSubmit={(e) => {
              e.preventDefault();
              save(name);
            }}
            className="w-full max-w-[440px] rounded-[32px] bg-page p-8 text-center text-ink shadow-[0_40px_120px_-40px_rgb(0_0_0/0.8)] ring-1 ring-line"
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.7, ease: EASE }}
          >
            <LogoMark size={34} animated className="mx-auto" />
            <h2 id="name-prompt-title" className="display mt-6 text-[30px] leading-none">
              What should we call you?
            </h2>
            <p className="mt-3 text-[14.5px] text-ink-3">A first name is plenty. Only you will see it.</p>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={40}
              placeholder="Your name"
              aria-label="Your name"
              className="own-focus mt-7 h-14 w-full rounded-full bg-fill px-6 text-center text-[18px] ring-1 ring-line outline-none placeholder:text-ink-3 focus:ring-ink/40"
            />
            <button
              type="submit"
              disabled={!name.trim()}
              className="group mt-4 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-ink text-[15px] font-medium text-page transition-[opacity,transform] hover:-translate-y-px disabled:opacity-40"
            >
              Continue <ArrowRight size={15} weight="bold" className="transition-transform group-hover:translate-x-0.5" />
            </button>
            <button type="button" onClick={() => save("")} className="mt-3 text-[13px] text-ink-3 hover:text-ink">
              Skip for now
            </button>
          </motion.form>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
