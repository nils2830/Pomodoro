import { NextResponse } from "next/server";
import { adminEmails, requireAdmin } from "@/core/auth/admin.server";

export const dynamic = "force-dynamic";

/** One member: sign-in details and how much they use Steen. */
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const check = await requireAdmin();
  if (!check.ok) return check.response;
  const { id } = await ctx.params;

  const [{ data: auth, error }, { data: usage }] = await Promise.all([
    check.db.auth.admin.getUserById(id),
    check.db.rpc("admin_user_summary", { uid: id }),
  ]);
  if (error || !auth.user) return NextResponse.json({ error: error?.message ?? "Not found." }, { status: 404 });
  const u = auth.user;
  return NextResponse.json({
    lastSignInAt: u.last_sign_in_at ?? null,
    confirmedAt: u.email_confirmed_at ?? null,
    providers: (u.app_metadata?.providers as string[] | undefined) ?? [u.app_metadata?.provider].filter(Boolean),
    usage: usage ?? { sessions: 0, focusHours: 0, lastSession: null },
  });
}

/** Delete a member and everything they saved. Paying members must be cancelled in Stripe first. */
export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const check = await requireAdmin();
  if (!check.ok) return check.response;
  const { id } = await ctx.params;

  const { data: profile } = await check.db.from("profiles").select("email, plan, plan_status").eq("id", id).maybeSingle();
  if (!profile) return NextResponse.json({ error: "Not found." }, { status: 404 });
  if (profile.email && adminEmails().includes(String(profile.email).toLowerCase())) {
    return NextResponse.json({ error: "Admin accounts can't be deleted here." }, { status: 400 });
  }
  if (profile.plan === "pro" && profile.plan_status !== "canceled") {
    return NextResponse.json({ error: "Cancel their subscription in Stripe first." }, { status: 409 });
  }
  // Profiles and records cascade from auth.users.
  const { error } = await check.db.auth.admin.deleteUser(id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
