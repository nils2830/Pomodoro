import { NextResponse } from "next/server";
import { requireAdmin } from "@/core/auth/admin.server";

export const dynamic = "force-dynamic";

/** Which settings members choose, how sessions go, and week-one retention. */
export async function GET() {
  const check = await requireAdmin();
  if (!check.ok) return check.response;
  const { data, error } = await check.db.rpc("admin_usage");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
