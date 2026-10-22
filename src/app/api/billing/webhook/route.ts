import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getAdminSupabase } from "@/core/auth/supabase-server";
import { getStripe } from "@/core/billing/stripe.server";

const ACTIVE = new Set(["active", "trialing", "past_due"]);

/** Period end moved onto subscription items in newer Stripe API versions. */
function periodEnd(sub: Stripe.Subscription): string | null {
  const s = sub as unknown as { current_period_end?: number; items?: { data?: { current_period_end?: number }[] } };
  const ts = s.items?.data?.[0]?.current_period_end ?? s.current_period_end;
  return ts ? new Date(ts * 1000).toISOString() : null;
}

async function applySubscription(sub: Stripe.Subscription) {
  const admin = getAdminSupabase();
  if (!admin) throw new Error("Supabase service role is not configured.");
  const customer = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
  const userId = sub.metadata?.user_id;
  const active = ACTIVE.has(sub.status);

  // With more than one subscription, an old one ending mustn't downgrade the current one.
  if (!active) {
    const read = admin.from("profiles").select("plan, stripe_subscription_id");
    const { data: profile, error } = userId ? await read.eq("id", userId).maybeSingle() : await read.eq("stripe_customer_id", customer).maybeSingle();
    if (error) throw error;
    if (profile?.plan === "pro" && profile.stripe_subscription_id && profile.stripe_subscription_id !== sub.id) return;
  }

  const interval = sub.items.data[0]?.price.recurring?.interval;
  const patch = {
    plan: active ? "pro" : "free",
    plan_status: sub.status,
    plan_interval: interval === "year" || interval === "month" ? interval : null,
    current_period_end: periodEnd(sub),
    stripe_customer_id: customer,
    stripe_subscription_id: sub.id,
    updated_at: new Date().toISOString(),
  };
  const query = admin.from("profiles").update(patch);
  const { error } = userId ? await query.eq("id", userId) : await query.eq("stripe_customer_id", customer);
  if (error) throw error;
}

export async function POST(req: Request) {
  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !secret) return NextResponse.json({ error: "Billing is not configured." }, { status: 501 });

  const signature = req.headers.get("stripe-signature");
  if (!signature) return NextResponse.json({ error: "Missing signature." }, { status: 400 });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(await req.text(), signature, secret);
  } catch (err) {
    return NextResponse.json({ error: `Invalid signature: ${err instanceof Error ? err.message : "unknown"}` }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        if (session.mode === "subscription" && session.subscription) {
          const id = typeof session.subscription === "string" ? session.subscription : session.subscription.id;
          await applySubscription(await stripe.subscriptions.retrieve(id));
        }
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        // Events can arrive out of order, so read the subscription as it is now.
        // Only a subscription Stripe no longer has falls back to the payload; other errors retry.
        const sent = event.data.object;
        const current = await stripe.subscriptions.retrieve(sent.id).catch((err: unknown) => {
          if ((err as { code?: string }).code === "resource_missing") return sent;
          throw err;
        });
        await applySubscription(current);
        break;
      }
    }
  } catch (err) {
    // A 500 makes Stripe retry the event later.
    return NextResponse.json({ error: err instanceof Error ? err.message : "Webhook failed." }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
