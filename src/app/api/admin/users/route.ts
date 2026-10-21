import { NextResponse } from "next/server";
import { requireAdmin } from "@/core/auth/admin.server";

/** Recent accounts (optionally filtered by email) plus headline counts. */
export async function GET(req: Request) {
  const check = await requireAdmin();
  if (!check.ok) return check.response;

  const q = new URL(req.url).searchParams.get("q")?.trim().toLowerCase() ?? "";
  let query = check.db
    .from("profiles")
    .select("id, email, plan, plan_status, plan_interval, current_period_end, created_at")
    .order("created_at", { ascending: false })
    .limit(100);
  if (q) query = query.ilike("email", `%${q.replace(/[%_,()]/g, "")}%`);

  const [{ data: users, error }, total, paying] = await Promise.all([
    query,
    check.db.from("profiles").select("id", { count: "exact", head: true }),
    check.db.from("profiles").select("id", { count: "exact", head: true }).eq("plan", "pro"),
  ]);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ users: users ?? [], counts: { total: total.count ?? 0, paying: paying.count ?? 0 } });
}
