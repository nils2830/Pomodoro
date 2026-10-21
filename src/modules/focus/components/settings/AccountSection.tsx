"use client";

import Link from "next/link";
import { ArrowRight, CreditCard, ShieldCheck, SignOut, Sparkle } from "@phosphor-icons/react";
import { Field } from "@/core/ui/fields";
import { Button } from "@/core/ui/Button";
import { useUI } from "@/core/ui/store";
import { useAuth } from "@/core/auth/store";
import { signOut } from "@/core/auth/AuthProvider";
import { usePlan, useProSource } from "@/core/billing/entitlements";
import { openBillingPortal } from "@/core/billing/checkout";
import { useSyncStatus } from "@/core/data/SyncProvider";
import { Group, SectionTitle } from "./SettingsDialog";

export function AccountSection() {
  const { status, user, profile, isAdmin } = useAuth();
  const plan = usePlan();
  const source = useProSource();
  const sync = useSyncStatus();
  const close = useUI((s) => s.closeSettings);

  if (status === "disabled") {
    return (
      <>
        <SectionTitle eyebrow="Account" title="Local mode">
          Accounts aren&apos;t configured on this deployment, so everything stays in this browser.
        </SectionTitle>
      </>
    );
  }

  return (
    <>
      <SectionTitle eyebrow="Account" title={user?.email ?? "Your account"} />
      <Group>
        <Field
          label="Plan"
          hint={source === "gift" ? "Pro, as a gift." : source === "subscription" ? "Pro subscription." : source === "demo" ? "Pro in demo mode." : "Free."}
        >
          {plan === "free" ? (
            <Link href="/pricing" onClick={close} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-ink px-4 text-sm font-semibold text-page">
              <Sparkle size={14} weight="fill" /> Go Pro
            </Link>
          ) : profile?.stripe_customer_id ? (
            <Button size="sm" variant="outline" icon={<CreditCard size={14} weight="bold" />} onClick={openBillingPortal}>
              Billing
            </Button>
          ) : (
            <span className="rounded-full bg-ink px-3 py-1 font-mono text-[11px] tracking-[0.12em] text-page uppercase">pro</span>
          )}
        </Field>
        <Field
          label="Saved to your account"
          hint={sync.state === "error" ? `Last attempt failed: ${sync.error}` : sync.lastSyncedAt ? `Last saved ${new Date(sync.lastSyncedAt).toLocaleTimeString()}` : "Saving…"}
        >
          <Button size="sm" variant="outline" onClick={sync.requestSync}>
            Sync now
          </Button>
        </Field>
        {isAdmin && (
          <Field label="Admin" hint="Members and Pro gifts.">
            <Link href="/admin" onClick={close} className="inline-flex h-9 items-center gap-1.5 rounded-full border border-line px-4 text-sm font-semibold hover:bg-fill">
              <ShieldCheck size={14} weight="bold" /> Open
            </Link>
          </Field>
        )}
      </Group>
      <div className="mt-6 flex flex-wrap gap-2">
        <Link href="/account" onClick={close} className="inline-flex h-9 items-center gap-1.5 rounded-full border border-line px-4 text-sm font-semibold hover:bg-fill">
          Account page <ArrowRight size={13} weight="bold" />
        </Link>
        <Button size="sm" variant="outline" icon={<SignOut size={14} weight="bold" />} onClick={() => signOut()}>
          Sign out
        </Button>
      </div>
    </>
  );
}
