"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowRight, EnvelopeSimple, GoogleLogo } from "@phosphor-icons/react";
import { Button } from "@/core/ui/Button";
import { TextInput } from "@/core/ui/fields";
import { config } from "@/core/config";
import { getSupabase } from "@/core/auth/supabase-browser";

export function LoginView() {
  const params = useSearchParams();
  const next = params.get("next") ?? "/account";
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState<string | null>(params.get("error") ? "That sign-in link didn't work. Try again." : null);
  const redirectTo = typeof window !== "undefined" ? `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}` : undefined;

  if (!config.supabase.enabled) {
    return (
      <div className="mx-auto max-w-[620px] px-5 pt-16 pb-24">
        <div className="eyebrow text-ink-3">Accounts</div>
        <h1 className="display mt-4 text-[48px] leading-[0.9]">This deployment runs in local mode.</h1>
        <p className="mt-5 text-[16px] leading-relaxed text-ink-2">
          Accounts aren&apos;t set up here yet, so everything you do is saved in this browser. You can still back up and restore your data from Settings → Data.
        </p>
        <Link href="/" className="mt-8 inline-flex h-11 items-center gap-2 rounded-full bg-btn px-5 text-sm font-semibold text-btn-ink">
          Back to the timer <ArrowRight size={15} weight="bold" />
        </Link>
      </div>
    );
  }

  const sendLink = async () => {
    const sb = getSupabase();
    if (!sb) return;
    setState("sending");
    setError(null);
    const { error } = await sb.auth.signInWithOtp({ email, options: { emailRedirectTo: redirectTo } });
    if (error) {
      setError(error.message);
      setState("error");
    } else setState("sent");
  };

  const google = async () => {
    const sb = getSupabase();
    if (!sb) return;
    const { error } = await sb.auth.signInWithOAuth({ provider: "google", options: { redirectTo } });
    if (error) setError(error.message);
  };

  return (
    <div className="mx-auto grid max-w-[1080px] gap-12 px-5 pt-12 pb-24 lg:grid-cols-2 lg:pt-20">
      <div>
        <div className="eyebrow text-ink-3">Sign in</div>
        <h1 className="display mt-4 text-[clamp(2.6rem,6vw,4.4rem)] leading-[0.88]">Pick up where you left off.</h1>
        <p className="mt-5 max-w-[40ch] text-[16px] leading-relaxed text-ink-2">
          An account keeps your plan and, with Pro, syncs every session and task across your devices. No password: we email you a link.
        </p>
      </div>
      <div className="rounded-[32px] bg-surface p-7 sm:p-9">
        {state === "sent" ? (
          <div className="py-6 text-center">
            <EnvelopeSimple size={40} weight="duotone" className="mx-auto" />
            <h2 className="display mt-4 text-[28px]">Check your inbox</h2>
            <p className="mt-2 text-[15px] text-ink-2">
              We sent a sign-in link to <b className="text-ink">{email}</b>.
            </p>
            <button type="button" onClick={() => setState("idle")} className="mt-6 text-[14px] text-ink-3 underline underline-offset-4 hover:text-ink">
              Use a different email
            </button>
          </div>
        ) : (
          <>
            <Button variant="outline" size="lg" className="w-full" icon={<GoogleLogo size={18} weight="bold" />} onClick={google}>
              Continue with Google
            </Button>
            <div className="my-6 flex items-center gap-3 text-[12px] text-ink-3">
              <span className="h-px flex-1 bg-line" /> or <span className="h-px flex-1 bg-line" />
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendLink();
              }}
              className="space-y-3"
            >
              <label className="block">
                <span className="eyebrow mb-2 block text-ink-3">Email</span>
                <TextInput type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" />
              </label>
              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full"
                disabled={state === "sending"}
                trailing={<ArrowRight size={16} weight="bold" />}
              >
                {state === "sending" ? "Sending…" : "Email me a link"}
              </Button>
            </form>
          </>
        )}
        {error && <p className="mt-4 text-[14px] text-bad">{error}</p>}
        <p className="mt-6 text-center text-[12.5px] text-ink-3">
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
      </div>
    </div>
  );
}
