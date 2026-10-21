/**
 * Runtime feature flags derived from public env vars.
 * Cadence is local-first: every integration is optional.
 */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const config = {
  appName: "Cadence",
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  supabase: {
    url: supabaseUrl,
    anonKey: supabaseAnonKey,
    enabled: Boolean(supabaseUrl && supabaseAnonKey),
  },
  billingEnabled: process.env.NEXT_PUBLIC_BILLING_ENABLED === "true",
  demoProAllowed: process.env.NEXT_PUBLIC_ALLOW_DEMO_PRO === "true",
} as const;
