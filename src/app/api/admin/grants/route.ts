import { NextResponse } from "next/server";
import { requireAdmin } from "@/core/auth/admin.server";
import { isValidEmail, normalizeEmail } from "@/core/billing/grants";

/** All grants, with whether each email already has an account. */
export async function GET() {
  const check = await requireAdmin();
  if (!check.ok) return check.response;

  const { data: grants, error } = await check.db.from("pro_grants").select("*").order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const emails = (grants ?? []).map((g) => g.email as string);
  const { data: profiles } = emails.length ? await check.db.from("profiles").select("email, created_at").in("email", emails) : { data: [] };
  const joined = new Map((profiles ?? []).map((p) => [p.email as string, p.created_at as string]));

  return NextResponse.json({
    grants: (grants ?? []).map((g) => ({ ...g, signed_up_at: joined.get(g.email) ?? null })),
  });
}

/** Create or update a grant. Body: { email, expiresAt: ISO string | null, note? } */
export async function POST(req: Request) {
  const check = await requireAdmin();
  if (!check.ok) return check.response;

  const body = (await req.json().catch(() => ({}))) as { email?: string; expiresAt?: string | null; note?: string };
  const email = normalizeEmail(body.email ?? "");
  if (!isValidEmail(email)) return NextResponse.json({ error: "That doesn't look like an email address." }, { status: 400 });

  let expires_at: string | null = null;
  if (body.expiresAt) {
    const d = new Date(body.expiresAt);
    if (Number.isNaN(d.getTime())) return NextResponse.json({ error: "Invalid expiry date." }, { status: 400 });
    expires_at = d.toISOString();
  }

  const { error } = await check.db.from("pro_grants").upsert(
    {
      email,
      expires_at,
      note: body.note?.trim().slice(0, 200) || null,
      granted_by: check.email,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "email" },
  );
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

/** Remove a grant. Body: { email } */
export async function DELETE(req: Request) {
  const check = await requireAdmin();
  if (!check.ok) return check.response;

  const body = (await req.json().catch(() => ({}))) as { email?: string };
  const email = normalizeEmail(body.email ?? "");
  const { error } = await check.db.from("pro_grants").delete().eq("email", email);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
