"use client";

import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabase } from "../auth/supabase-browser";
import { CURSOR_PREFIX, ownsLocalData } from "../auth/ownership";
import { getSyncables, type BaseRecord } from "./record";

/**
 * Minimal last-write-wins sync against one generic `records` table.
 * New modules get sync for free by declaring collections/documents;
 * no new tables or migrations are needed.
 *
 * Order matters: pull first, then push, so fresh devices adopt remote
 * data before uploading their local defaults.
 *
 * Pulls page by the server's `seq` column (not client clocks), and the
 * database keeps whichever version has the newest updated_at.
 */
type Cursors = Record<string, { pulled: number; pushed: number }>;

export type SyncStatus = { state: "idle" | "syncing" | "error"; lastSyncedAt: number | null; error?: string };

const cursorKey = (userId: string) => `${CURSOR_PREFIX}${userId}`;

function readCursors(userId: string): Cursors {
  try {
    return JSON.parse(localStorage.getItem(cursorKey(userId)) ?? "{}") as Cursors;
  } catch {
    return {};
  }
}

function writeCursors(userId: string, c: Cursors) {
  localStorage.setItem(cursorKey(userId), JSON.stringify(c));
}

interface Row {
  id: string;
  data: BaseRecord;
  /** Server-assigned, monotonically increasing change number. */
  seq: number;
}

const PAGE = 1000;
/** The database rejects bigger records (0004_record_limits.sql); skip them so the rest still syncs. */
const MAX_RECORD_CHARS = 200_000;
/** sessionStorage: when this tab last reloaded over ownership, so a stuck owner key can't loop. */
const RELOAD_GUARD = "steen:owner-reload";

function reloadOnce(): never {
  const reason = "This browser's data doesn't match the signed-in account.";
  try {
    const last = Number(sessionStorage.getItem(RELOAD_GUARD) ?? 0);
    if (Date.now() - last < 30_000) throw new Error(reason);
    sessionStorage.setItem(RELOAD_GUARD, String(Date.now()));
  } catch {
    // Reloaded moments ago, or can't record that: stop syncing instead of looping.
    throw new Error(reason);
  }
  window.location.reload();
  throw new Error(reason);
}

/**
 * The session lives in cookies shared by every tab, so another tab can sign
 * in as someone else without this one hearing about it. Before taking in or
 * sending anything, check that the session and the local data still belong
 * to userId; if not, reload so this tab starts over with the right account.
 */
async function ensureOwner(sb: SupabaseClient, userId: string): Promise<void> {
  const { data, error } = await sb.auth.getSession();
  if (error) throw error; // can't tell right now (e.g. offline); try next round
  if (data.session?.user.id === userId && ownsLocalData(userId)) return;
  reloadOnce();
}

export async function syncNow(userId: string): Promise<void> {
  const sb = getSupabase();
  if (!sb) return;
  await ensureOwner(sb, userId);
  const cursors = readCursors(userId);

  for (const s of getSyncables()) {
    const cur = cursors[s.name] ?? { pulled: 0, pushed: 0 };

    // Pull everything newer than our cursor, page by page.
    let from = cur.pulled;
    for (;;) {
      const { data, error } = await sb
        .from("records")
        .select("id,data,seq")
        .eq("collection", s.name)
        .gt("seq", from)
        .order("seq", { ascending: true })
        .limit(PAGE);
      if (error) throw error;
      const rows = (data ?? []) as Row[];
      if (rows.length) {
        await ensureOwner(sb, userId);
        s.applyRemote(rows.map((r) => r.data));
        from = rows[rows.length - 1].seq;
      }
      if (rows.length < PAGE) break;
    }
    cur.pulled = from;

    // Push local changes.
    const changed = s.changedSince(cur.pushed);
    const fits = changed.filter((r) => {
      const ok = JSON.stringify(r).length <= MAX_RECORD_CHARS;
      if (!ok) console.warn(`[sync] ${s.name}/${r.id} is too large to sync and stays on this device.`);
      return ok;
    });
    for (let i = 0; i < fits.length; i += PAGE) {
      const chunk = fits.slice(i, i + PAGE);
      await ensureOwner(sb, userId);
      const { error } = await sb.from("records").upsert(
        chunk.map((r) => ({
          user_id: userId,
          collection: s.name,
          id: r.id,
          data: r,
          updated_at: r.updatedAt,
          deleted: Boolean(r.deletedAt),
        })),
        { onConflict: "user_id,collection,id" },
      );
      if (error) throw error;
    }
    if (changed.length) cur.pushed = Math.max(cur.pushed, ...changed.map((r) => r.updatedAt));
    cursors[s.name] = cur;
    writeCursors(userId, cursors);
  }
}
