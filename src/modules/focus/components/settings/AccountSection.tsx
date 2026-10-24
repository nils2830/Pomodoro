"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, CreditCard, ShieldCheck, SignOut, Sparkle } from "@phosphor-icons/react";
import { Field } from "@/core/ui/fields";
import { Segmented } from "@/core/ui/Segmented";
import { toast } from "@/core/ui/store";
import { Button } from "@/core/ui/Button";
import { useUI } from "@/core/ui/store";
import { usePrefs } from "@/core/prefs";
import { useAuth } from "@/core/auth/store";
import { signOut } from "@/core/auth/AuthProvider";
import { usePlan, useProSource } from "@/core/billing/entitlements";
import { openBillingPortal } from "@/core/billing/checkout";
import { useSyncStatus } from "@/core/data/SyncProvider";
import { localeTag, useLocale, useT } from "@/core/i18n";
import { Group, SectionTitle } from "./SettingsDialog";

export function AccountSection() {
  const t = useT();
  const locale = useLocale();
  const { status, user, profile, isAdmin } = useAuth();
  const plan = usePlan();
  const source = useProSource();
  const sync = useSyncStatus();
  const close = useUI((s) => s.closeSettings);
  const name = usePrefs((s) => s.doc.name);
  const setPrefs = usePrefs((s) => s.set);

  if (status === "disabled") {
    return (
      <>
        <SectionTitle eyebrow={t("Account")} title={t("Local mode")}>
          {t("Accounts aren't configured on this deployment, so everything stays in this browser.")}
        </SectionTitle>
      </>
    );
  }

  return (
    <>
      <SectionTitle eyebrow={t("Account")} title={user?.email ?? t("Your account")} />
      <Group>
        <Field label={t("Name")} hint={t("What Steen calls you.")}>
          <input
            defaultValue={name}
            key={name}
            maxLength={40}
            placeholder={t("Your name")}
            aria-label={t("Your name")}
            onBlur={(e) => setPrefs({ name: e.target.value.trim(), nameAsked: true })}
            onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
            className="h-9 w-44 rounded-full bg-fill px-4 text-[14px] ring-1 ring-line outline-none focus:ring-ink/40"
          />
        </Field>
        <Field
          label={t("Plan")}
          hint={
            source === "gift"
              ? t("Pro, as a gift.")
              : source === "subscription" && profile?.plan_status === "trialing" && profile.current_period_end
                ? t("Free trial until {date}. After that it renews unless you cancel.", {
                    date: new Date(profile.current_period_end).toLocaleDateString(localeTag(locale), { day: "numeric", month: "long" }),
                  })
                : source === "subscription"
                ? t("Pro subscription.")
                : source === "demo"
                  ? t("Pro in demo mode.")
                  : t("Free.")
          }
        >
          {plan === "free" ? (
            <Link href="/pricing" onClick={close} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-ink px-4 text-sm font-semibold text-page">
              <Sparkle size={14} weight="fill" /> {t("Go Pro")}
            </Link>
          ) : profile?.stripe_customer_id ? (
            <Button size="sm" variant="outline" icon={<CreditCard size={14} weight="bold" />} onClick={openBillingPortal}>
              {t("Billing")}
            </Button>
          ) : (
            <span className="rounded-full bg-ink px-3 py-1 font-mono text-[11px] tracking-[0.12em] text-page uppercase">pro</span>
          )}
        </Field>
        <Field
          label={t("Saved to your account")}
          hint={
            sync.state === "error"
              ? t("Last attempt failed: {error}", { error: String(sync.error) })
              : sync.lastSyncedAt
                ? t("Last saved {time}", { time: new Date(sync.lastSyncedAt).toLocaleTimeString(localeTag(locale)) })
                : t("Saving…")
          }
        >
          <Button size="sm" variant="outline" onClick={sync.requestSync}>
            {t("Sync now")}
          </Button>
        </Field>
        {isAdmin && (
          <Field label={t("Admin")} hint={t("Members and Pro gifts.")}>
            <Link
              href="/admin"
              onClick={close}
              className="inline-flex h-9 items-center gap-1.5 rounded-full border border-line px-4 text-sm font-semibold hover:bg-fill"
            >
              <ShieldCheck size={14} weight="bold" /> {t("Open")}
            </Link>
          </Field>
        )}
      </Group>
      <FeedbackForm />
      <div className="mt-6 flex flex-wrap gap-2">
        <Link
          href="/account"
          onClick={close}
          className="inline-flex h-9 items-center gap-1.5 rounded-full border border-line px-4 text-sm font-semibold hover:bg-fill"
        >
          {t("Account page")} <ArrowRight size={13} weight="bold" />
        </Link>
        <Button size="sm" variant="outline" icon={<SignOut size={14} weight="bold" />} onClick={() => signOut()}>
          {t("Sign out")}
        </Button>
      </div>
    </>
  );
}

/** Straight to the admin's inbox. */
function FeedbackForm() {
  const t = useT();
  const [kind, setKind] = useState<"idea" | "problem" | "other">("idea");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const send = async () => {
    setSending(true);
    try {
      const res = await fetch("/api/feedback", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ kind, message }) });
      if (!res.ok) throw new Error(((await res.json().catch(() => ({}))) as { error?: string }).error ?? t("Couldn't send it. Try again."));
      setMessage("");
      toast({ message: t("Thanks. It went straight to the person who builds Steen."), tone: "success" });
    } catch (e) {
      toast({ message: (e as Error).message, tone: "error" });
    } finally {
      setSending(false);
    }
  };
  return (
    <Group title={t("Feedback")}>
      <div className="py-4">
        <Segmented
          size="sm"
          ariaLabel={t("Kind of feedback")}
          value={kind}
          onChange={setKind}
          options={[
            { value: "idea", label: t("Idea") },
            { value: "problem", label: t("Problem") },
            { value: "other", label: t("Other") },
          ]}
        />
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          maxLength={2000}
          rows={3}
          aria-label={t("Your feedback")}
          placeholder={kind === "problem" ? t("What happened, and what did you expect?") : t("What would make Steen better for you?")}
          className="mt-3 w-full resize-none bg-fill px-4 py-3 text-[14.5px] ring-1 ring-line outline-none"
        />
        <div className="mt-2 flex justify-end">
          <Button size="sm" onClick={send} disabled={sending || !message.trim()}>
            {t("Send")}
          </Button>
        </div>
      </div>
    </Group>
  );
}
