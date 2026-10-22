import { NextResponse } from "next/server";
import { adminEmails, requireAdmin } from "@/core/auth/admin.server";

/**
 * Lets the client know whether to show admin tools. Admins also get Pro
 * for life: the first time an admin signs in, an "Owner" grant is written
 * for their email (and an expiry on it is cleared). Owner grants of people
 * no longer in ADMIN_EMAILS are removed here too.
 */
export async function GET() {
  const check = await requireAdmin();
  if (!check.ok) return NextResponse.json({ admin: false });

  const { data: grant } = await check.db.from("pro_grants").select("expires_at").eq("email", check.email).maybeSingle();
  if (!grant || grant.expires_at) {
    await check.db
      .from("pro_grants")
      .upsert({ email: check.email, expires_at: null, note: "Owner", granted_by: check.email, updated_at: new Date().toISOString() }, { onConflict: "email" });
  }

  // Owner grants are self-granted (granted_by = email). Grants an admin gave a friend are left alone.
  const admins = adminEmails();
  const { data: owners } = await check.db.from("pro_grants").select("email, granted_by").eq("note", "Owner");
  for (const o of owners ?? []) {
    if (o.email !== o.granted_by || admins.includes(o.email)) continue;
    await check.db.from("pro_grants").delete().eq("email", o.email).eq("granted_by", o.email).eq("note", "Owner");
  }
  return NextResponse.json({ admin: true, ownerGrant: true });
}
