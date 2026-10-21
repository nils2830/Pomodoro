"use client";

import { getSupabase } from "../auth/supabase-browser";
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

const cursorKey = (userId: string) => `cadence:sync-cursors:${userId}`;

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

export async function syncNow(userId: string): Promise<void> {
  const sb = getSupabase();
  if (!sb) return;
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
        s.applyRemote(rows.map((r) => r.data));
        from = rows[rows.length - 1].seq;
      }
      if (rows.length < PAGE) break;
    }
    cur.pulled = from;

    // Push local changes.
    const changed = s.changedSince(cur.pushed);
    for (let i = 0; i < changed.length; i += PAGE) {
      const chunk = changed.slice(i, i + PAGE);
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
