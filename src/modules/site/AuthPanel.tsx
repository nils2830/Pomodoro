"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { AppleLogo, ArrowRight, EnvelopeSimple, Info } from "@phosphor-icons/react";
import { getSupabase } from "@/core/auth/supabase-browser";
import { safeNext } from "@/core/auth/routes";
import { config } from "@/core/config";
import { cn } from "@/core/lib/cn";

type Provider = "google" | "apple";
interface Availability {
  configured: boolean;
  email: boolean;
  google: boolean;
  apple: boolean;
  unknown?: boolean;
}

function GoogleG() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  );
}

/** Sign in or create an account: Apple, Google or an email link. */
export function AuthPanel({ mode, next: nextParam, initialError }: { mode: "signin" | "signup"; next?: string | null; initialError?: string | null }) {
  const next = safeNext(nextParam);
  const [avail, setAvail] = useState<Availability | null>(null);
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [busy, setBusy] = useState<Provider | null>(null);
  const [error, setError] = useState<string | null>(initialError ?? null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/auth/providers")
      .then((r) => r.json())
      .then(setAvail)
      .catch(() => setAvail({ configured: true, unknown: true, email: true, google: true, apple: true }));
  }, []);

  const redirectTo = () => `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;

  const oauth = async (provider: Provider) => {
    setError(null);
    setNotice(null);
    if (avail && !avail.unknown && !avail[provider]) {
      const name = provider === "apple" ? "Apple sign-in" : "Google sign-in";
      const other = provider === "apple" && avail.google ? "Google or an email link" : "an email link";
      setNotice(`${name} is on its way. Until then, continue with ${other}. It only takes a moment.`);
      return;
    }
    const sb = getSupabase();
    if (!sb) return setError("Accounts aren't set up on this site yet.");
    setBusy(provider);
    const { error } = await sb.auth.signInWithOAuth({ provider, options: { redirectTo: redirectTo() } });
    if (error) {
      setBusy(null);
      setError(error.message);
    }
  };

  const sendLink = async () => {
    const sb = getSupabase();
    if (!sb) return setError("Accounts aren't set up on this site yet.");
    setState("sending");
    setError(null);
    const { error } = await sb.auth.signInWithOtp({ email: email.trim(), options: { emailRedirectTo: redirectTo(), shouldCreateUser: true } });
    if (error) {
      setState("idle");
      setError(/rate|limit/i.test(error.message) ? "Too many emails just now. Wait a minute and try again." : error.message);
    } else setState("sent");
  };

  if (!config.supabase.enabled) {
    return (
      <div className="rounded-[28px] bg-surface/80 p-7 ring-1 ring-line backdrop-blur-xl">
        <h2 className="display text-[26px]">Local mode</h2>
        <p className="mt-2 text-[15px] text-ink-2">Accounts aren&apos;t configured on this deployment, so Steen runs in this browser only.</p>
        <Link href="/" className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-btn text-[15px] font-medium text-btn-ink">
          Open Steen <ArrowRight size={16} weight="bold" />
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-[28px] bg-[#161513]/72 p-6 ring-1 ring-white/10 backdrop-blur-2xl sm:p-8">
      <AnimatePresence mode="wait">
        {state === "sent" ? (
          <motion.div key="sent" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="py-6 text-center">
            <div className="mx-auto grid size-14 place-items-center rounded-full bg-fill">
              <EnvelopeSimple size={26} weight="duotone" />
            </div>
            <h2 className="display mt-5 text-[28px]">Check your inbox</h2>
            <p className="mt-2 text-[15px] text-ink-2">
              We sent a link to <b className="font-medium text-ink">{email}</b>. Open it on this device to {mode === "signup" ? "finish creating your account" : "sign in"}.
            </p>
            <button type="button" onClick={() => setState("idle")} className="mt-6 text-[14px] text-ink-3 underline underline-offset-4 hover:text-ink">
              Use another email
            </button>
          </motion.div>
        ) : (
          <motion.div key="form" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <h2 className="display text-[30px] leading-none">{mode === "signup" ? "Create your account" : "Welcome back"}</h2>
            <p className="mt-2 text-[15px] text-ink-2">{mode === "signup" ? "Free, and your sessions follow you to every device." : "Sign in to pick up where you left off."}</p>

            <div className="mt-7 grid gap-2.5">
              <button
                type="button"
                onClick={() => oauth("apple")}
                disabled={busy !== null}
                className="relative inline-flex h-12 items-center justify-center gap-2.5 rounded-full bg-white text-[15px] font-medium text-black transition-transform hover:-translate-y-px disabled:opacity-60"
              >
                <AppleLogo size={19} weight="fill" />
                {busy === "apple" ? "Opening Apple…" : "Continue with Apple"}
              </button>
              <button
                type="button"
                onClick={() => oauth("google")}
                disabled={busy !== null}
                className="relative inline-flex h-12 items-center justify-center gap-2.5 rounded-full bg-fill text-[15px] font-medium text-ink ring-1 ring-line transition-[transform,background-color] hover:-translate-y-px hover:bg-white/10 disabled:opacity-60"
              >
                <GoogleG />
                {busy === "google" ? "Opening Google…" : "Continue with Google"}
              </button>
            </div>

            <div className="my-6 flex items-center gap-3 text-[12px] text-ink-3">
              <span className="h-px flex-1 bg-line" /> or with email <span className="h-px flex-1 bg-line" />
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendLink();
              }}
              className="grid gap-2.5"
            >
              <label className="sr-only" htmlFor="auth-email">
                Email
              </label>
              <input
                id="auth-email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="own-focus h-12 rounded-full bg-black/30 px-5 text-[15px] text-ink ring-1 ring-line outline-none placeholder:text-ink-3 focus:ring-white/40"
              />
              <button
                type="submit"
                disabled={state === "sending"}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-btn text-[15px] font-medium text-btn-ink transition-transform hover:-translate-y-px disabled:opacity-60"
              >
                {state === "sending" ? "Sending…" : "Email me a link"} <ArrowRight size={15} weight="bold" />
              </button>
            </form>

            <AnimatePresence>
              {(error || notice) && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className={cn("mt-4 flex gap-2 text-[14px] leading-snug", error ? "text-bad" : "text-ink-2")}
                >
                  <Info size={17} weight="bold" className="mt-px shrink-0" />
                  {error ?? notice}
                </motion.p>
              )}
            </AnimatePresence>

            <p className="mt-6 text-center text-[13px] text-ink-3">
              {mode === "signup" ? (
                <>
                  Already have an account?{" "}
                  <Link href={`/login${next !== "/" ? `?next=${encodeURIComponent(next)}` : ""}`} className="text-ink underline-offset-4 hover:underline">
                    Sign in
                  </Link>
                </>
              ) : (
                <>
                  New to Steen?{" "}
                  <Link href={`/login?mode=signup${next !== "/" ? `&next=${encodeURIComponent(next)}` : ""}`} className="text-ink underline-offset-4 hover:underline">
                    Create a free account
                  </Link>
                </>
              )}
            </p>
            <p className="mt-3 text-center text-[12px] text-ink-3">
              By continuing you agree to the{" "}
              <Link href="/terms" className="underline underline-offset-2 hover:text-ink">
                terms
              </Link>{" "}
              and{" "}
              <Link href="/privacy" className="underline underline-offset-2 hover:text-ink">
                privacy policy
              </Link>
              .
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
