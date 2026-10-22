"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowsClockwise, CloudCheck, CloudSlash, CreditCard, HardDrives, ShieldCheck, SignOut, Sparkle, Trash } from "@phosphor-icons/react";
import { Button } from "@/core/ui/Button";
import { Switch } from "@/core/ui/Switch";
import { confirmAction, toast, useUI } from "@/core/ui/store";
import { config } from "@/core/config";
import { useAuth } from "@/core/auth/store";
import { signOut } from "@/core/auth/AuthProvider";
import { wipeLocalData } from "@/core/auth/ownership";
import { usePlan, useProSource } from "@/core/billing/entitlements";
import { openBillingPortal } from "@/core/billing/checkout";
import { useProWelcome } from "@/core/billing/ProWelcome";
import { usePrefs } from "@/core/prefs";
import { useSyncStatus } from "@/core/data/SyncProvider";
import { useEntries } from "@/core/data/entries";
import { selectFocus } from "@/modules/insights/analytics";
import { formatDuration } from "@/core/lib/time";
import { localeTag, useLocale, useT } from "@/core/i18n";

function Row({ label, children, hint }: { label: string; children: React.ReactNode; hint?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line py-5">
      <div>
        <div className="text-[15px] font-medium">{label}</div>
        {hint && <div className="mt-0.5 text-[13px] text-ink-3">{hint}</div>}
      </div>
      <div className="flex items-center gap-2">{children}</div>
    </div>
  );
}

export function AccountView() {
  const t = useT();
  const lang = localeTag(useLocale());
  const { status, user, profile, grant, isAdmin } = useAuth();
  const plan = usePlan();
  const source = useProSource();
  const planHint =
    source === "subscription"
      ? `${profile?.plan_status === "past_due" ? `${t("Payment overdue.")} ` : ""}${profile?.current_period_end ? t("Renews {date}", { date: new Date(profile.current_period_end).toLocaleDateString(lang) }) : t("Renews automatically")}`
      : source === "gift"
        ? grant?.expires_at
          ? t("A gift, active until {date}", { date: new Date(grant.expires_at).toLocaleDateString(lang) })
          : t("A gift, no end date")
        : source === "demo"
          ? t("Unlocked in demo mode")
          : t("Free: the timer, tasks and 7 days of insights.");
  const demoPro = usePrefs((s) => s.doc.demoPro);
  const displayName = usePrefs((s) => s.doc.name);
  const setPrefs = usePrefs((s) => s.set);
  const sync = useSyncStatus();
  const openSettings = useUI((s) => s.openSettings);
  const params = useSearchParams();
  const items = useEntries((s) => s.items);
  const focus = selectFocus(Object.values(items));
  const total = focus.reduce((s, e) => s + e.durationMs, 0);

  useEffect(() => {
    if (params.get("checkout") !== "success") return;
    useProWelcome.getState().activate();
    window.history.replaceState(null, "", "/account");
  }, [params]);

  return (
    <div className="mx-auto w-full max-w-[880px] px-5 pt-10 pb-28 sm:pt-16">
      <div className="eyebrow text-ink-3">{t("Account")}</div>
      <h1 className="display mt-4 text-[clamp(2.6rem,6vw,4.4rem)] leading-[0.88]">
        {status === "signedIn" ? displayName || (user?.email ?? t("Your account")) : t("You, on this device.")}
      </h1>
      <p className="mt-4 text-[15px] text-ink-2">
        {t("{count} sessions · {time} focused since you started.", { count: focus.length, time: formatDuration(total) })}
      </p>

      <div className="mt-10 border-t border-ink/80">
        <Row label={t("Plan")} hint={planHint}>
          <span className="rounded-full bg-ink px-3 py-1 font-mono text-[11px] tracking-[0.12em] text-page uppercase">
            {plan === "free" ? t("Free") : "Pro"}
          </span>
          {plan === "free" && (
            <Link href="/pricing" className="inline-flex h-9 items-center gap-1.5 rounded-full border border-line px-4 text-sm font-semibold hover:bg-fill">
              <Sparkle size={14} weight="fill" /> {t("Upgrade")}
            </Link>
          )}
          {profile?.stripe_customer_id && (
            <Button size="sm" variant="outline" icon={<CreditCard size={14} weight="bold" />} onClick={openBillingPortal}>
              {t("Billing")}
            </Button>
          )}
        </Row>

        {status === "disabled" && (
          <Row label={t("Storage")} hint={t("Accounts aren't configured on this deployment. Your data lives in this browser only.")}>
            <HardDrives size={20} weight="bold" className="text-ink-3" />
          </Row>
        )}

        {status === "signedIn" && (
          <>
            <Row label={t("Name")} hint={t("What Steen calls you.")}>
              <input
                defaultValue={displayName}
                key={displayName}
                maxLength={40}
                placeholder={t("Your name")}
                aria-label={t("Your name")}
                onBlur={(e) => setPrefs({ name: e.target.value.trim(), nameAsked: true })}
                onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
                className="h-9 w-48 rounded-full bg-fill px-4 text-[14px] ring-1 ring-line outline-none focus:ring-ink/40"
              />
            </Row>
            <Row label={t("Signed in with")} hint={t(providerLabel(user?.app_metadata?.provider))}>
              <span className="text-[14px] text-ink-2">{user?.email}</span>
            </Row>
            <Row
              label={t("Saved to your account")}
              hint={
                sync.state === "error"
                  ? t("Last attempt failed: {error}", { error: String(sync.error) })
                  : sync.lastSyncedAt
                    ? t("Last saved {time}", { time: new Date(sync.lastSyncedAt).toLocaleTimeString(lang) })
                    : t("Saving for the first time…")
              }
            >
              {sync.state === "error" ? <CloudSlash size={20} weight="bold" className="text-bad" /> : <CloudCheck size={20} weight="bold" />}
              <Button
                size="sm"
                variant="outline"
                icon={<ArrowsClockwise size={14} weight="bold" className={sync.state === "syncing" ? "animate-spin" : ""} />}
                onClick={sync.requestSync}
              >
                {t("Sync now")}
              </Button>
            </Row>
            <Row label={t("Sign out")} hint={t("Everything is saved to your account first, then cleared from this browser.")}>
              <Button size="sm" variant="outline" icon={<SignOut size={14} weight="bold" />} onClick={() => signOut()}>
                {t("Sign out")}
              </Button>
            </Row>
          </>
        )}

        {isAdmin && (
          <Row label={t("Admin")} hint={t("See members and give Pro to friends.")}>
            <Link href="/admin" className="inline-flex h-9 items-center gap-1.5 rounded-full border border-line px-4 text-sm font-semibold hover:bg-fill">
              <ShieldCheck size={14} weight="bold" /> {t("Open")}
            </Link>
          </Row>
        )}

        <Row label={t("Backup & data")} hint={t("Download, restore or erase what's stored here.")}>
          <Button size="sm" variant="outline" onClick={() => openSettings("data")}>
            {t("Open")}
          </Button>
        </Row>

        {status === "signedIn" && (
          <Row label={t("Delete account")} hint={t("Ends any subscription and erases your sessions, tasks and settings for good.")}>
            <DeleteAccountButton />
          </Row>
        )}

        {config.demoProAllowed && !config.billingEnabled && (
          <Row label="Demo Pro" hint={t("For development: unlocks Pro locally because billing isn't configured.")}>
            <Switch label="Demo Pro" checked={demoPro} onChange={(v) => setPrefs({ demoPro: v })} />
          </Row>
        )}
      </div>
    </div>
  );
}

function providerLabel(provider: unknown): string {
  if (provider === "google") return "Google";
  if (provider === "apple") return "Apple";
  return "An email link";
}

function DeleteAccountButton() {
  const t = useT();
  const [busy, setBusy] = useState(false);
  const run = async () => {
    const ok = await confirmAction({
      title: t("Delete your account?"),
      body: t("Your subscription ends now, and every session, task and setting is erased from Steen. This can't be undone."),
      confirmLabel: t("Delete account"),
      tone: "danger",
    });
    if (!ok) return;
    setBusy(true);
    const res = await fetch("/api/account/delete", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ confirm: true }),
    }).catch(() => null);
    if (!res?.ok) {
      const body = (await res?.json().catch(() => ({}))) as { error?: string } | undefined;
      setBusy(false);
      toast({ message: body?.error ?? t("Couldn't delete the account. Check your connection."), tone: "error" });
      return;
    }
    wipeLocalData();
    window.location.assign("/welcome");
  };
  return (
    <Button size="sm" variant="outline" icon={<Trash size={14} weight="bold" />} onClick={run} disabled={busy}>
      {busy ? t("Deleting…") : t("Delete")}
    </Button>
  );
}
