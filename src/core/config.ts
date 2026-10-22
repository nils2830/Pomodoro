/**
 * Runtime feature flags derived from public env vars.
 * Steen is local-first: every integration is optional.
 */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const config = {
  appName: "Steen",
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  supabase: {
    url: supabaseUrl,
    anonKey: supabaseAnonKey,
    enabled: Boolean(supabaseUrl && supabaseAnonKey),
  },
  billingEnabled: process.env.NEXT_PUBLIC_BILLING_ENABLED === "true",
  /** Publishable key for the embedded Stripe checkout form. */
  stripePublishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "",
  demoProAllowed: process.env.NEXT_PUBLIC_ALLOW_DEMO_PRO === "true",
  /** Shown on the terms and privacy pages. */
  legal: {
    owner: process.env.NEXT_PUBLIC_LEGAL_NAME || "[your name]",
    country: process.env.NEXT_PUBLIC_LEGAL_COUNTRY || "Denmark",
    email: process.env.NEXT_PUBLIC_CONTACT_EMAIL || "[your contact email]",
  },
} as const;
