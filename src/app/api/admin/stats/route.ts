import { NextResponse } from "next/server";
import { requireAdmin } from "@/core/auth/admin.server";
import { PRICING } from "@/core/billing/plans";

export const dynamic = "force-dynamic";

/** Headline numbers for /admin: growth, activity and revenue. */
export async function GET() {
  const check = await requireAdmin();
  if (!check.ok) return check.response;

  const { data, error } = await check.db.rpc("admin_stats");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const s = data as { monthly: number; yearly: number };
  // Monthly recurring revenue, before Stripe fees and tax.
  const mrr = s.monthly * PRICING.monthly + (s.yearly * PRICING.yearly) / 12;
  return NextResponse.json({ ...s, mrr: Math.round(mrr * 100) / 100 });
}
