import "server-only";
import Stripe from "stripe";

let stripe: Stripe | null = null;

export function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  // Embedded checkout forms (ui_mode "form") need API version 2026-03-25.dahlia or later.
  stripe ??= new Stripe(key, { apiVersion: "2026-09-30.endive" });
  return stripe;
}

export function priceFor(interval: "month" | "year"): string | undefined {
  return interval === "year" ? process.env.STRIPE_PRICE_PRO_YEARLY : process.env.STRIPE_PRICE_PRO_MONTHLY;
}

export function siteUrl(req: Request): string {
  return process.env.NEXT_PUBLIC_SITE_URL || new URL(req.url).origin;
}
