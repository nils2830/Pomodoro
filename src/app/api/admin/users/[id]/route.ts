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
    bannedUntil: (u as { banned_until?: string | null }).banned_until ?? null,
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

/** Body: { action: "suspend" | "unsuspend" }. A suspended member can't sign in; their data stays. */
export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const check = await requireAdmin();
  if (!check.ok) return check.response;
  const { id } = await ctx.params;
  const body = (await req.json().catch(() => ({}))) as { action?: string };
  if (body.action !== "suspend" && body.action !== "unsuspend") return NextResponse.json({ error: "Invalid action." }, { status: 400 });

  const { data: profile } = await check.db.from("profiles").select("email").eq("id", id).maybeSingle();
  if (profile?.email && adminEmails().includes(String(profile.email).toLowerCase())) {
    return NextResponse.json({ error: "Admin accounts can't be suspended." }, { status: 400 });
  }
  const { error } = await check.db.auth.admin.updateUserById(id, { ban_duration: body.action === "suspend" ? "876000h" : "none" });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
