// Applies supabase/migrations/*.sql to the connected database, in order,
// once each. Runs before `next build` so every deploy has the schema it
// expects. Skips quietly when no database URL is configured (local dev).
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import postgres from "postgres";

const url = process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL || process.env.DATABASE_URL;
if (!url) {
  console.log("[migrate] No database URL set, skipping migrations.");
  process.exit(0);
}

const dir = path.join(process.cwd(), "supabase", "migrations");
const files = (await readdir(dir)).filter((f) => f.endsWith(".sql")).sort();

// Supabase serves a certificate chain Node doesn't ship; traffic is still encrypted.
const local = /@(localhost|127\.0\.0\.1)[:/]/.test(url);
const sql = postgres(url, { ssl: local ? false : { rejectUnauthorized: false }, max: 1, prepare: false, onnotice: () => {}, connect_timeout: 20 });

try {
  await sql`create table if not exists public._steen_migrations (name text primary key, applied_at timestamptz not null default now())`;
  // No policies: only the service role (the admin checklist) can read it through the API.
  await sql`alter table public._steen_migrations enable row level security`;
  const done = new Set((await sql`select name from public._steen_migrations`).map((r) => r.name));
  for (const file of files) {
    if (done.has(file)) continue;
    const body = await readFile(path.join(dir, file), "utf8");
    console.log(`[migrate] applying ${file}`);
    await sql.begin(async (tx) => {
      await tx.unsafe(body);
      await tx`insert into public._steen_migrations (name) values (${file})`;
    });
  }
  console.log(`[migrate] database is up to date (${files.length} migrations).`);
} catch (err) {
  console.error("[migrate] FAILED:", err instanceof Error ? err.message : err);
  process.exitCode = 1;
} finally {
  await sql.end({ timeout: 5 });
}
