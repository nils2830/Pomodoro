import { NextResponse } from "next/server";
import { getAdminSupabase, getServerSupabase } from "@/core/auth/supabase-server";
import { getStripe } from "@/core/billing/stripe.server";

/**
 * Deletes the signed-in account for good: ends any subscription, removes
 * the Stripe customer, any Pro gift for the email, and the auth user.
 * Profiles and synced records go with the user (on delete cascade).
 * Body: { confirm: true }
 */
export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { confirm?: boolean };
  if (body.confirm !== true) return NextResponse.json({ error: "Missing confirmation." }, { status: 400 });

  const supabase = await getServerSupabase();
  const admin = getAdminSupabase();
  if (!supabase || !admin) return NextResponse.json({ error: "Accounts are not configured." }, { status: 501 });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Please sign in first." }, { status: 401 });

  const { data: profile } = await admin.from("profiles").select("stripe_customer_id").eq("id", user.id).maybeSingle();
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
  }

  if (user.email) await admin.from("pro_grants").delete().eq("email", user.email.toLowerCase());
  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await supabase.auth.signOut().catch(() => {});
  return NextResponse.json({ ok: true });
}
