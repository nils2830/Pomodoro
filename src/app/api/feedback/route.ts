import { NextResponse } from "next/server";
import { getServerSupabase } from "@/core/auth/supabase-server";

const KINDS = ["idea", "problem", "other"] as const;

/** A member sends feedback from settings. Row-level security limits them to their own rows. Body: { kind, message } */
export async function POST(req: Request) {
  const supabase = await getServerSupabase();
  if (!supabase) return NextResponse.json({ error: "Accounts are not configured." }, { status: 501 });
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Please sign in." }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as { kind?: string; message?: string };
  const message = (body.message ?? "").trim().slice(0, 2000);
  if (!message) return NextResponse.json({ error: "Write a message first." }, { status: 400 });
  const kind = KINDS.find((k) => k === body.kind) ?? "other";

  const { error } = await supabase.from("feedback").insert({ user_id: user.id, email: user.email ?? null, kind, message });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
