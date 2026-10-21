import { NextResponse } from "next/server";
import { requireAdmin, adminEmails } from "@/core/auth/admin.server";
import { config } from "@/core/config";
import { getStripe, priceFor } from "@/core/billing/stripe.server";
import { PRICING } from "@/core/billing/plans";

export const dynamic = "force-dynamic";

type Level = "ok" | "warn" | "fail";
interface Check {
  id: string;
  area: string;
  label: string;
  level: Level;
  detail: string;
}

/**
 * The launch checklist on /admin: what is configured and what still needs
 * doing. Reports presence and mode only, never the values of secrets.
 */
export async function GET(req: Request) {
  const check = await requireAdmin();
  if (!check.ok) return check.response;
  const out: Check[] = [];
  const add = (c: Check) => out.push(c);

  // Accounts
  add({ id: "supabase", area: "Accounts", label: "Supabase connected", level: "ok", detail: "Sign-in and the database are reachable." });
  const { data: applied, error: migErr } = await check.db.from("_steen_migrations").select("name").order("name");
  add(
    migErr
      ? { id: "migrations", area: "Accounts", label: "Database migrations", level: "warn", detail: "Couldn't read the migration log. Redeploy so the build applies them." }
      : {
          id: "migrations",
          area: "Accounts",
          label: "Database migrations",
          level: (applied ?? []).length >= 3 ? "ok" : "warn",
          detail: `${(applied ?? []).length} applied: ${(applied ?? []).map((m) => m.name).join(", ") || "none"}.`,
        },
  );
  try {
    const res = await fetch(`${config.supabase.url}/auth/v1/settings`, { headers: { apikey: config.supabase.anonKey }, cache: "no-store" });
    const s = (await res.json()) as { external?: Record<string, boolean>; disable_signup?: boolean };
    const on = (k: string) => Boolean(s.external?.[k]);
    add({ id: "email", area: "Sign-in", label: "Email links", level: on("email") ? "ok" : "fail", detail: on("email") ? "On." : "Turn on the Email provider in Supabase → Authentication." });
    add({
      id: "google",
      area: "Sign-in",
      label: "Google",
      level: on("google") ? "ok" : "warn",
      detail: on("google") ? "On." : "Off. Add a Google OAuth client in Supabase → Authentication → Providers (see docs/launch.md).",
    });
    add({
      id: "apple",
      area: "Sign-in",
      label: "Apple",
      level: on("apple") ? "ok" : "warn",
      detail: on("apple") ? "On. The Apple secret expires every 6 months; renew it in time." : "Off. Needs an Apple Developer account (see docs/launch.md).",
    });
    add({
      id: "signups",
      area: "Sign-in",
      label: "New sign-ups",
      level: s.disable_signup ? "fail" : "ok",
      detail: s.disable_signup ? "Sign-ups are disabled in Supabase, so nobody new can create an account." : "Open.",
    });
  } catch {
    add({ id: "providers", area: "Sign-in", label: "Sign-in providers", level: "warn", detail: "Couldn't read Supabase's auth settings." });
  }
  const origin = new URL(req.url).origin;
  add({
    id: "site-url",
    area: "Sign-in",
    label: "Site URL",
    level: process.env.NEXT_PUBLIC_SITE_URL ? (process.env.NEXT_PUBLIC_SITE_URL === origin ? "ok" : "warn") : "warn",
    detail: process.env.NEXT_PUBLIC_SITE_URL
      ? process.env.NEXT_PUBLIC_SITE_URL === origin
        ? `${origin}. Make sure it's also Supabase's Site URL and in its redirect list.`
        : `Set to ${process.env.NEXT_PUBLIC_SITE_URL}, but you're on ${origin}.`
      : "NEXT_PUBLIC_SITE_URL isn't set.",
  });

  // Billing
  const stripe = getStripe();
  const key = process.env.STRIPE_SECRET_KEY ?? "";
  const mode = key.includes("_live_") ? "live" : key.includes("_test_") ? "test" : null;
  add({
    id: "stripe-key",
    area: "Billing",
    label: "Stripe secret key",
    level: !key ? "fail" : mode === "live" ? "ok" : "warn",
    detail: !key ? "STRIPE_SECRET_KEY isn't set." : mode === "live" ? "Live mode." : "Test mode: real cards won't be charged.",
  });
  add({
    id: "stripe-webhook",
    area: "Billing",
    label: "Webhook secret",
    level: process.env.STRIPE_WEBHOOK_SECRET ? "ok" : "fail",
    detail: process.env.STRIPE_WEBHOOK_SECRET ? `Set. The endpoint is ${origin}/api/billing/webhook.` : `STRIPE_WEBHOOK_SECRET isn't set. Add an endpoint at ${origin}/api/billing/webhook.`,
  });
  for (const interval of ["month", "year"] as const) {
    const id = priceFor(interval);
    const want = interval === "month" ? PRICING.monthly : PRICING.yearly;
    if (!id || !stripe) {
      add({ id: `price-${interval}`, area: "Billing", label: `${interval === "month" ? "Monthly" : "Yearly"} price`, level: "fail", detail: id ? "Waiting for the Stripe key." : "Price ID isn't set." });
      continue;
    }
    try {
      const price = await stripe.prices.retrieve(id);
      const amount = (price.unit_amount ?? 0) / 100;
      const problems = [
        !price.active && "inactive",
        price.recurring?.interval !== interval && `bills every ${price.recurring?.interval ?? "once"}`,
        price.currency.toUpperCase() !== PRICING.currency && `in ${price.currency.toUpperCase()}`,
        amount !== want && `${amount} instead of ${want}`,
      ].filter(Boolean);
      add({
        id: `price-${interval}`,
        area: "Billing",
        label: `${interval === "month" ? "Monthly" : "Yearly"} price`,
        level: problems.length ? "warn" : "ok",
        detail: problems.length ? `Found, but ${problems.join(", ")}. The pricing page shows ${PRICING.symbol}${want}.` : `${PRICING.symbol}${amount} per ${interval}.`,
      });
    } catch {
      add({ id: `price-${interval}`, area: "Billing", label: `${interval === "month" ? "Monthly" : "Yearly"} price`, level: "fail", detail: "Stripe doesn't know this price ID in the key's mode." });
    }
  }
  add({
    id: "billing-flag",
    area: "Billing",
    label: "Checkout switched on",
    level: config.billingEnabled ? "ok" : "warn",
    detail: config.billingEnabled ? "NEXT_PUBLIC_BILLING_ENABLED is true." : "Set NEXT_PUBLIC_BILLING_ENABLED=true once the items above are green.",
  });
  add({
    id: "demo-pro",
    area: "Billing",
    label: "Demo Pro off",
    level: config.demoProAllowed ? "warn" : "ok",
    detail: config.demoProAllowed ? "NEXT_PUBLIC_ALLOW_DEMO_PRO is on. Turn it off for launch." : "Off.",
  });

  // Owner and legal
  add({ id: "admins", area: "Owner", label: "Admin accounts", level: "ok", detail: `${adminEmails().length} in ADMIN_EMAILS. Admins get Pro for life automatically.` });
  const legalMissing = [!process.env.NEXT_PUBLIC_LEGAL_NAME && "NEXT_PUBLIC_LEGAL_NAME", !process.env.NEXT_PUBLIC_CONTACT_EMAIL && "NEXT_PUBLIC_CONTACT_EMAIL"].filter(Boolean);
  add({
    id: "legal",
    area: "Owner",
    label: "Terms and privacy details",
    level: legalMissing.length ? "warn" : "ok",
    detail: legalMissing.length ? `Set ${legalMissing.join(" and ")} so the legal pages name you.` : "Name and contact email are set.",
  });

  return NextResponse.json({ checks: out });
}
