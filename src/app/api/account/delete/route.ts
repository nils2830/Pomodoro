import { NextResponse } from "next/server";
import { getAdminSupabase, getServerSupabase } from "@/core/auth/supabase-server";
import { getStripe } from "@/core/billing/stripe.server";

/** This site's origins: the request's and NEXT_PUBLIC_SITE_URL's, each with its www/non-www twin. */
function siteOrigins(req: Request): Set<string> {
  const origins = new Set<string>();
  for (const raw of [req.url, process.env.NEXT_PUBLIC_SITE_URL]) {
    if (!raw) continue;
    try {
      const url = new URL(raw);
      origins.add(url.origin);
      url.hostname = url.hostname.startsWith("www.") ? url.hostname.slice(4) : `www.${url.hostname}`;
      origins.add(url.origin);
    } catch {
      // A malformed NEXT_PUBLIC_SITE_URL just adds nothing.
    }
  }
  return origins;
}

/** Browsers send Origin on cross-site POSTs, so a foreign one means another site sent this. */
function isSameOrigin(req: Request): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return true;
  try {
    return siteOrigins(req).has(new URL(origin).origin);
  } catch {
    return false; // e.g. "null" from a sandboxed frame
  }
}

/**
 * Deletes the signed-in account for good: ends any subscription, removes
 * the Stripe customer, the auth user and any Pro gift for the email.
 * Profiles and synced records go with the user (on delete cascade).
 * Body: { confirm: true }
 */
export async function POST(req: Request) {
  if (!isSameOrigin(req)) return NextResponse.json({ error: "Cross-site request refused." }, { status: 403 });
  const type = req.headers.get("content-type")?.split(";")[0].trim().toLowerCase();
  if (type !== "application/json") return NextResponse.json({ error: "Expected JSON." }, { status: 415 });

  const body = (await req.json().catch(() => ({}))) as { confirm?: boolean };
  if (body.confirm !== true) return NextResponse.json({ error: "Missing confirmation." }, { status: 400 });

  const supabase = await getServerSupabase();
  const admin = getAdminSupabase();
  if (!supabase || !admin) return NextResponse.json({ error: "Accounts are not configured." }, { status: 501 });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Please sign in first." }, { status: 401 });

  // Without the profile we can't tell whether a subscription is still charging, so stop here.
  const { data: profile, error: profileError } = await admin.from("profiles").select("stripe_customer_id").eq("id", user.id).maybeSingle();
  if (profileError) return NextResponse.json({ error: "Couldn't load the account. Nothing was deleted. Try again." }, { status: 503 });

  const customer = profile?.stripe_customer_id as string | null | undefined;
  if (customer) {
    const stripe = getStripe();
    if (!stripe) return NextResponse.json({ error: "Billing is unavailable right now, so the subscription can't be ended. Try again later." }, { status: 503 });
    try {
      // Deleting a customer also cancels its active subscriptions straight away.
      await stripe.customers.del(customer);
    } catch (err) {
      const code = (err as { code?: string }).code;
      if (code !== "resource_missing") return NextResponse.json({ error: "Couldn't end the subscription. Nothing was deleted." }, { status: 502 });
    }
    // The customer is gone, so stop pointing at it in case deleting the user fails below.
    // Best effort: on success the profile goes with the user anyway.
    await admin
      .from("profiles")
      .update({
        stripe_customer_id: null,
        stripe_subscription_id: null,
        plan: "free",
        plan_status: null,
        plan_interval: null,
        current_period_end: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);
  }

  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Only once the user is gone, so a failed delete keeps the gift.
  if (user.email) await admin.from("pro_grants").delete().eq("email", user.email.toLowerCase());

  await supabase.auth.signOut().catch(() => {});
  return NextResponse.json({ ok: true });
}
