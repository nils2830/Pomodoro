import { NextResponse } from "next/server";
import { requireAdmin } from "@/core/auth/admin.server";

export const dynamic = "force-dynamic";

/** The site-wide announcement, whether it's showing or not. */
export async function GET() {
  const check = await requireAdmin();
  if (!check.ok) return check.response;
  const { data, error } = await check.db.from("announcements").select("message, active, updated_at").eq("id", 1).maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? { message: "", active: false, updated_at: null });
}

/** Body: { message, active } */
export async function POST(req: Request) {
  const check = await requireAdmin();
  if (!check.ok) return check.response;
  const body = (await req.json().catch(() => ({}))) as { message?: string; active?: boolean };
  const message = (body.message ?? "").trim().slice(0, 280);
  if (body.active && !message) return NextResponse.json({ error: "Write a message first." }, { status: 400 });
  const { error } = await check.db
    .from("announcements")
    .upsert({ id: 1, message, active: Boolean(body.active), updated_at: new Date().toISOString() });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
