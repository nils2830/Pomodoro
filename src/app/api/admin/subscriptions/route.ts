import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { requireAdmin } from "@/core/auth/admin.server";
import { getStripe } from "@/core/billing/stripe.server";

export const dynamic = "force-dynamic";

const periodEnd = (s: Stripe.Subscription) => {
  const x = s as unknown as { current_period_end?: number; items?: { data?: { current_period_end?: number }[] } };
  return x.items?.data?.[0]?.current_period_end ?? x.current_period_end ?? null;
};

/** Recent Stripe subscriptions with their state, newest first. */
export async function GET() {
  const check = await requireAdmin();
  if (!check.ok) return check.response;
  const stripe = getStripe();
  if (!stripe) return NextResponse.json({ error: "Stripe isn't configured." }, { status: 501 });

  const list = await stripe.subscriptions.list({ status: "all", limit: 50, expand: ["data.customer"] });
  return NextResponse.json({
    live: list.data[0]?.livemode ?? null,
    items: list.data.map((s) => {
      const price = s.items.data[0]?.price;
      const customer = s.customer as Stripe.Customer | Stripe.DeletedCustomer;
      return {
        id: s.id,
        email: "email" in customer ? customer.email : null,
        status: s.status,
        interval: price?.recurring?.interval ?? null,
        amount: price?.unit_amount != null ? price.unit_amount / 100 : null,
        currency: price?.currency ?? "usd",
        cancelAtPeriodEnd: s.cancel_at_period_end,
        periodEnd: periodEnd(s),
        created: s.created,
      };
    }),
  });
}

/** Body: { id, action: "cancel" | "resume" }. Cancelling stops renewal; they keep Pro until the period ends. */
export async function POST(req: Request) {
  const check = await requireAdmin();
  if (!check.ok) return check.response;
  const stripe = getStripe();
  if (!stripe) return NextResponse.json({ error: "Stripe isn't configured." }, { status: 501 });
  const body = (await req.json().catch(() => ({}))) as { id?: string; action?: string };
  if (!body.id?.startsWith("sub_") || (body.action !== "cancel" && body.action !== "resume")) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  // The webhook picks up the change and updates the member's plan.
  await stripe.subscriptions.update(body.id, { cancel_at_period_end: body.action === "cancel" });
  return NextResponse.json({ ok: true });
}
