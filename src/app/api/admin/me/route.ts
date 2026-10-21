import { NextResponse } from "next/server";
import { requireAdmin } from "@/core/auth/admin.server";

/** Lets the client know whether to show admin tools. */
export async function GET() {
  const check = await requireAdmin();
  return NextResponse.json({ admin: check.ok });
}
