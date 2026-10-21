import { beforeEach, describe, expect, it, vi } from "vitest";
import Stripe from "stripe";

const SECRET = "whsec_test_secret";
process.env.STRIPE_SECRET_KEY = "sk_test_unit";
process.env.STRIPE_WEBHOOK_SECRET = SECRET;

// Captures what the webhook writes to the profiles table.
const updates: { patch: Record<string, unknown>; column: string; value: string }[] = [];
vi.mock("@/core/auth/supabase-server", () => ({
  getAdminSupabase: () => ({
    from: () => ({
      update: (patch: Record<string, unknown>) => ({
        eq: async (column: string, value: string) => {
          updates.push({ patch, column, value });
          return { error: null };
        },
      }),
    }),
  }),
}));

// A real Stripe client (for signature checks) whose API calls never leave the test.
const stripe = new Stripe("sk_test_unit");
stripe.subscriptions.retrieve = vi.fn(() => Promise.reject(new Error("offline"))) as unknown as typeof stripe.subscriptions.retrieve;
vi.mock("@/core/billing/stripe.server", () => ({ getStripe: () => stripe }));

const { POST } = await import("./route");

function subscriptionEvent(status: string, type = "customer.subscription.updated") {
  return {
    id: "evt_1",
    object: "event",
    type,
    data: {
      object: {
        id: "sub_1",
        object: "subscription",
        status,
        customer: "cus_1",
        metadata: { user_id: "user-1" },
        items: { data: [{ current_period_end: 1_900_000_000, price: { recurring: { interval: "year" } } }] },
      },
    },
  };
}

function signed(payload: object, secret = SECRET) {
  const body = JSON.stringify(payload);
  const header = stripe.webhooks.generateTestHeaderString({ payload: body, secret });
  return new Request("http://localhost/api/billing/webhook", { method: "POST", body, headers: { "stripe-signature": header } });
}

describe("Stripe webhook", () => {
  beforeEach(() => {
    updates.length = 0;
  });

  it("rejects requests without a signature", async () => {
    const res = await POST(new Request("http://localhost/api/billing/webhook", { method: "POST", body: "{}" }));
    expect(res.status).toBe(400);
    expect(updates).toHaveLength(0);
  });

  it("rejects a payload signed with the wrong secret", async () => {
    const res = await POST(signed(subscriptionEvent("active"), "whsec_wrong"));
    expect(res.status).toBe(400);
    expect(updates).toHaveLength(0);
  });

  it("turns an active subscription into Pro, with the period end from the item", async () => {
    const res = await POST(signed(subscriptionEvent("active")));
    expect(res.status).toBe(200);
    expect(updates).toHaveLength(1);
    expect(updates[0]).toMatchObject({ column: "id", value: "user-1" });
    expect(updates[0].patch).toMatchObject({
      plan: "pro",
      plan_status: "active",
      plan_interval: "year",
      stripe_customer_id: "cus_1",
      current_period_end: new Date(1_900_000_000 * 1000).toISOString(),
    });
  });

  it("drops a cancelled subscription back to Free", async () => {
    const res = await POST(signed(subscriptionEvent("canceled", "customer.subscription.deleted")));
    expect(res.status).toBe(200);
    expect(updates[0].patch).toMatchObject({ plan: "free", plan_status: "canceled" });
  });

  it("prefers the subscription's current state over the event payload", async () => {
    vi.mocked(stripe.subscriptions.retrieve).mockResolvedValueOnce(
      subscriptionEvent("canceled").data.object as unknown as Awaited<ReturnType<typeof stripe.subscriptions.retrieve>>,
    );
    const res = await POST(signed(subscriptionEvent("active")));
    expect(res.status).toBe(200);
    expect(updates[0].patch).toMatchObject({ plan: "free" });
  });
});
