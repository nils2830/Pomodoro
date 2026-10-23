import { NextResponse } from "next/server";
import { requireAdmin } from "@/core/auth/admin.server";

export const dynamic = "force-dynamic";

/** The latest feedback from members, open first. */
export async function GET() {
  const check = await requireAdmin();
  if (!check.ok) return check.response;
  const { data, error } = await check.db
    .from("feedback")
    .select("id, email, kind, message, resolved, created_at")
    .order("resolved")
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ items: data ?? [] });
}

/** Body: { id, resolved } */
export async function PATCH(req: Request) {
  const check = await requireAdmin();
  if (!check.ok) return check.response;
  const body = (await req.json().catch(() => ({}))) as { id?: string; resolved?: boolean };
  if (!body.id) return NextResponse.json({ error: "Missing id." }, { status: 400 });
  const { error } = await check.db.from("feedback").update({ resolved: Boolean(body.resolved) }).eq("id", body.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

/** Body: { id } */
export async function DELETE(req: Request) {
  const check = await requireAdmin();
  if (!check.ok) return check.response;
  const body = (await req.json().catch(() => ({}))) as { id?: string };
  if (!body.id) return NextResponse.json({ error: "Missing id." }, { status: 400 });
  const { error } = await check.db.from("feedback").delete().eq("id", body.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
