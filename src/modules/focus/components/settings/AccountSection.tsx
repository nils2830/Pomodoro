"use client";

import Link from "next/link";
import { ArrowRight, CreditCard, ShieldCheck, SignOut, Sparkle } from "@phosphor-icons/react";
import { Field } from "@/core/ui/fields";
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
