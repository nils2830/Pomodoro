import { NextResponse } from "next/server";
import { getAdminSupabase, getServerSupabase } from "@/core/auth/supabase-server";
import { getStripe, siteUrl } from "@/core/billing/stripe.server";

/** Opens the Stripe customer portal (cancel, change card, invoices). */
export async function POST(req: Request) {
  const stripe = getStripe();
  const supabase = await getServerSupabase();
  const admin = getAdminSupabase();
  if (!stripe || !supabase || !admin) return NextResponse.json({ error: "Billing is not configured." }, { status: 501 });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Please sign in first." }, { status: 401 });

  const { data: profile } = await admin.from("profiles").select("stripe_customer_id").eq("id", user.id).maybeSingle();
  if (!profile?.stripe_customer_id) return NextResponse.json({ error: "No billing account yet." }, { status: 404 });

  const portal = await stripe.billingPortal.sessions.create({ customer: profile.stripe_customer_id, return_url: `${siteUrl(req)}/account` });
  return NextResponse.json({ url: portal.url });
}
