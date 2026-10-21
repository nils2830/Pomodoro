import { NextResponse } from "next/server";
import { getAdminSupabase, getServerSupabase } from "@/core/auth/supabase-server";
import { getStripe, priceFor, siteUrl } from "@/core/billing/stripe.server";

/** Creates a Stripe Checkout session for the signed-in user. */
export async function POST(req: Request) {
  const stripe = getStripe();
  const supabase = await getServerSupabase();
  const admin = getAdminSupabase();
  if (!stripe || !supabase || !admin) return NextResponse.json({ error: "Billing is not configured." }, { status: 501 });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Please sign in first." }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as { interval?: string };
  const interval = body.interval === "month" ? "month" : "year";
  const price = priceFor(interval);
  if (!price) return NextResponse.json({ error: "Price is not configured." }, { status: 501 });

  // Reuse the Stripe customer if we have one.
  const { data: profile } = await admin.from("profiles").select("stripe_customer_id, plan").eq("id", user.id).maybeSingle();
  if (profile?.plan === "pro") return NextResponse.json({ error: "You're already on Pro." }, { status: 409 });

  let customer = profile?.stripe_customer_id as string | null | undefined;
  if (!customer) {
    const created = await stripe.customers.create({ email: user.email ?? undefined, metadata: { user_id: user.id } });
    customer = created.id;
    await admin.from("profiles").update({ stripe_customer_id: customer, updated_at: new Date().toISOString() }).eq("id", user.id);
  }

  const base = siteUrl(req);
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer,
    client_reference_id: user.id,
    line_items: [{ price, quantity: 1 }],
    allow_promotion_codes: true,
    subscription_data: { metadata: { user_id: user.id } },
    success_url: `${base}/account?checkout=success`,
    cancel_url: `${base}/pricing?checkout=cancelled`,
  });

  return NextResponse.json({ url: session.url });
}
