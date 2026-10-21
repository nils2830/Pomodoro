import { NextResponse } from "next/server";
import { requireAdmin } from "@/core/auth/admin.server";

/**
 * Lets the client know whether to show admin tools. Admins also get Pro
 * for life: the first time an admin signs in, an "Owner" grant is written
 * for their email (and an expiry on it is cleared).
 */
export async function GET() {
  const check = await requireAdmin();
  if (!check.ok) return NextResponse.json({ admin: false });

  const { data: grant } = await check.db.from("pro_grants").select("expires_at").eq("email", check.email).maybeSingle();
  if (!grant || grant.expires_at) {
    await check.db.from("pro_grants").upsert(
      { email: check.email, expires_at: null, note: "Owner", granted_by: check.email, updated_at: new Date().toISOString() },
      { onConflict: "email" },
    );
  }
  return NextResponse.json({ admin: true, ownerGrant: true });
}
