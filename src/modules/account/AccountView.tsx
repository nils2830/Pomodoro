"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowsClockwise, CloudCheck, CloudSlash, CreditCard, HardDrives, SignOut, Sparkle } from "@phosphor-icons/react";
import { Button } from "@/core/ui/Button";
import { Switch } from "@/core/ui/Switch";
import { toast, useUI } from "@/core/ui/store";
import { config } from "@/core/config";
import { useAuth } from "@/core/auth/store";
import { signOut } from "@/core/auth/AuthProvider";
import { usePlan } from "@/core/billing/entitlements";
import { openBillingPortal } from "@/core/billing/checkout";
import { usePrefs } from "@/core/prefs";
import { useSyncStatus } from "@/core/data/SyncProvider";
import { useEntries } from "@/core/data/entries";
import { selectFocus } from "@/modules/insights/analytics";
import { formatDuration } from "@/core/lib/time";

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
  const { status, user, profile } = useAuth();
  const plan = usePlan();
  const demoPro = usePrefs((s) => s.doc.demoPro);
  const setPrefs = usePrefs((s) => s.set);
  const sync = useSyncStatus();
  const openSettings = useUI((s) => s.openSettings);
  const router = useRouter();
  const params = useSearchParams();
  const items = useEntries((s) => s.items);
  const focus = selectFocus(Object.values(items));
  const total = focus.reduce((s, e) => s + e.durationMs, 0);

  useEffect(() => {
    if (params.get("checkout") === "success") toast({ message: "Welcome to Pro. It can take a few seconds to activate.", tone: "success" });
  }, [params]);

  return (
    <div className="mx-auto w-full max-w-[880px] px-5 pt-10 pb-28 sm:pt-16">
      <div className="eyebrow text-ink-3">Account</div>
      <h1 className="display mt-4 text-[clamp(2.6rem,6vw,4.4rem)] leading-[0.88]">
        {status === "signedIn" ? (user?.email ?? "Your account") : "You, on this device."}
      </h1>
      <p className="mt-4 text-[15px] text-ink-2">
        {focus.length} sessions · {formatDuration(total)} focused since you started.
      </p>

      <div className="mt-10 border-t border-ink/80">
        <Row
          label="Plan"
          hint={
            plan === "pro"
              ? profile?.plan === "pro"
                ? `Renews ${profile.current_period_end ? new Date(profile.current_period_end).toLocaleDateString() : ""}`
                : "Unlocked in demo mode"
              : "Free: the timer, tasks and 7 days of insights."
          }
        >
          <span className="rounded-full bg-ink px-3 py-1 font-mono text-[11px] tracking-[0.12em] text-page uppercase">{plan}</span>
          {plan === "free" && (
            <Link href="/pricing" className="inline-flex h-9 items-center gap-1.5 rounded-full border border-line px-4 text-sm font-semibold hover:bg-fill">
              <Sparkle size={14} weight="fill" /> Upgrade
            </Link>
          )}
          {profile?.stripe_customer_id && (
            <Button size="sm" variant="outline" icon={<CreditCard size={14} weight="bold" />} onClick={openBillingPortal}>
              Billing
            </Button>
          )}
        </Row>

        {status === "disabled" && (
          <Row label="Storage" hint="Accounts aren't configured on this deployment. Your data lives in this browser only.">
            <HardDrives size={20} weight="bold" className="text-ink-3" />
          </Row>
        )}

        {status === "signedOut" && (
          <Row label="Sign in" hint="Keep your plan and sync your data across devices.">
            <Button variant="primary" size="sm" onClick={() => router.push("/login?next=/account")}>
              Sign in
            </Button>
          </Row>
        )}

        {status === "signedIn" && (
          <>
            <Row
              label="Cloud sync"
              hint={
                plan !== "pro"
                  ? "Sync is part of Pro."
                  : sync.state === "error"
                    ? `Last attempt failed: ${sync.error}`
                    : sync.lastSyncedAt
                      ? `Last synced ${new Date(sync.lastSyncedAt).toLocaleTimeString()}`
                      : "Waiting for first sync…"
              }
            >
              {plan === "pro" ? (
                <>
                  {sync.state === "error" ? <CloudSlash size={20} weight="bold" className="text-bad" /> : <CloudCheck size={20} weight="bold" />}
                  <Button
                    size="sm"
                    variant="outline"
                    icon={<ArrowsClockwise size={14} weight="bold" className={sync.state === "syncing" ? "animate-spin" : ""} />}
                    onClick={sync.requestSync}
                  >
                    Sync now
                  </Button>
                </>
              ) : (
                <CloudSlash size={20} weight="bold" className="text-ink-3" />
              )}
            </Row>
            <Row label="Sign out" hint="Your local data stays on this device.">
              <Button size="sm" variant="outline" icon={<SignOut size={14} weight="bold" />} onClick={() => signOut()}>
                Sign out
              </Button>
            </Row>
          </>
        )}

        <Row label="Backup & data" hint="Download, restore or erase what's stored here.">
          <Button size="sm" variant="outline" onClick={() => openSettings("data")}>
            Open
          </Button>
        </Row>

        {config.demoProAllowed && !config.billingEnabled && (
          <Row label="Demo Pro" hint="For development: unlocks Pro locally because billing isn't configured.">
            <Switch label="Demo Pro" checked={demoPro} onChange={(v) => setPrefs({ demoPro: v })} />
          </Row>
        )}
      </div>
    </div>
  );
}
