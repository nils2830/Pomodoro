"use client";

import { config } from "../config";
import { useAuth } from "../auth/store";
import { usePrefs } from "../prefs";
import { toast } from "../ui/store";
import { useCheckout } from "./CheckoutDialog";
import { t } from "../i18n";

export type Interval = "month" | "year";

/**
 * Starts the upgrade flow. With billing configured this opens Stripe's
 * embedded checkout form; in local/demo mode it flips the local Pro switch instead.
 */
export async function startUpgrade(interval: Interval, router: { push: (href: string) => void }): Promise<void> {
  if (!config.billingEnabled) {
    if (config.demoProAllowed) {
      usePrefs.getState().set({ demoPro: true });
      toast({ message: t("Pro unlocked in demo mode. Billing isn't configured on this deployment."), tone: "success" });
    } else {
      toast({ message: t("Upgrades aren't available on this deployment yet."), tone: "error" });
    }
    return;
  }
  if (useAuth.getState().status !== "signedIn") {
    router.push(`/login?next=${encodeURIComponent(`/pricing?interval=${interval}`)}`);
    return;
  }
  const res = await fetch("/api/billing/checkout", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ interval }),
  });
  const body = (await res.json().catch(() => ({}))) as { clientSecret?: string; trial?: boolean; error?: string };
  if (body.clientSecret) useCheckout.getState().open(body.clientSecret, body.trial);
  else toast({ message: body.error ?? t("Couldn't start checkout."), tone: "error" });
}

export async function openBillingPortal(): Promise<void> {
  const res = await fetch("/api/billing/portal", { method: "POST" });
  const body = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
  if (body.url) window.location.assign(body.url);
  else toast({ message: body.error ?? t("Couldn't open billing."), tone: "error" });
}
