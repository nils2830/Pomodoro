// Applies supabase/migrations/*.sql to the connected database, in order,
// once each. Runs before `next build` so every production deploy has the
// schema it expects. Skips quietly when no database URL is configured (local dev).
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import postgres from "postgres";

// Preview builds on Vercel get the production database URL too, so only
// production (or a local build) migrates. MIGRATE=1 forces a run.
const vercelEnv = process.env.VERCEL_ENV;
if (vercelEnv && vercelEnv !== "production" && process.env.MIGRATE !== "1") {
  console.log(`[migrate] skipped: VERCEL_ENV is "${vercelEnv}", only production builds migrate (set MIGRATE=1 to force).`);
  process.exit(0);
}

// A direct connection: the advisory lock below doesn't hold through a transaction pooler,
// so Supabase's pooled POSTGRES_URL is deliberately not used.
const url = process.env.POSTGRES_URL_NON_POOLING || process.env.DATABASE_URL;
if (!url) {
  console.log("[migrate] No database URL set, skipping migrations.");
  process.exit(0);
}

const dir = path.join(process.cwd(), "supabase", "migrations");
const files = (await readdir(dir)).filter((f) => f.endsWith(".sql")).sort();

// Supabase signs its database certificate with its own CA, which Node doesn't trust,
// so verify only when that CA is given (PEM in SUPABASE_DB_CA). Traffic is encrypted either way.
const ca = process.env.SUPABASE_DB_CA?.replace(/\\n/g, "\n");
const local = /@(localhost|127\.0\.0\.1)[:/]/.test(url);
const ssl = local ? false : ca ? { ca, rejectUnauthorized: true } : { rejectUnauthorized: false };
const sql = postgres(url, { ssl, max: 1, prepare: false, onnotice: () => {}, connect_timeout: 20 });

// Two builds at once would race, so the whole run holds this advisory lock.
// Session locks belong to one connection: everything below runs on `db`.
const LOCK_KEY = 537323169860488614n;
let db;

try {
  db = await sql.reserve();
  const [{ locked }] = await db`select pg_try_advisory_lock(${LOCK_KEY}) as locked`;
  if (!locked) {
    console.log("[migrate] another run holds the lock, waiting...");
    await db`select pg_advisory_lock(${LOCK_KEY})`;
  }

  await db`create table if not exists public._steen_migrations (name text primary key, applied_at timestamptz not null default now())`;
  // No policies: only the service role (the admin checklist) can read it through the API.
  await db`alter table public._steen_migrations enable row level security`;
  const done = new Set((await db`select name from public._steen_migrations`).map((r) => r.name));
  for (const file of files) {
    if (done.has(file)) continue;
    const body = await readFile(path.join(dir, file), "utf8");
    console.log(`[migrate] applying ${file}`);
    await db`begin`;
    try {
      await db.unsafe(body);
      await db`insert into public._steen_migrations (name) values (${file})`;
      await db`commit`;
    } catch (err) {
      await db`rollback`.catch(() => {});
      throw err;
    }
  }
  console.log(`[migrate] database is up to date (${files.length} migrations).`);
} catch (err) {
  console.error("[migrate] FAILED:", err instanceof Error ? err.message : err);
  process.exitCode = 1;
} finally {
  // Closing the connection would release the lock too; unlock first to be tidy.
  if (db) {
    await db`select pg_advisory_unlock(${LOCK_KEY})`.catch(() => {});
    db.release();
  }
  await sql.end({ timeout: 5 });
}
