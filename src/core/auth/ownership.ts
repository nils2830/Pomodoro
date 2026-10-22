"use client";

/**
 * Local data belongs to exactly one account. The browser remembers which
 * one in "steen:owner"; if a different person signs in on the same device,
 * the previous person's local copy is cleared before anything can sync.
 */
export const OWNER_KEY = "steen:owner";
/** Sync keeps one cursor key per account: steen:sync-cursors:<userId>. */
export const CURSOR_PREFIX = "steen:sync-cursors:";
const PRESERVE = new Set<string>([]);

function read(): string | null {
  try {
    return localStorage.getItem(OWNER_KEY);
  } catch {
    return null;
  }
}

/**
 * Data from before owners were recorded (moved over from "cadence:" keys)
 * has no owner key, but its sync cursors name the account it synced with.
 */
function otherCursorOwner(userId: string): string | null {
  try {
    const ids = Object.keys(localStorage)
      .filter((k) => k.startsWith(CURSOR_PREFIX))
      .map((k) => k.slice(CURSOR_PREFIX.length));
    return ids.find((id) => id && id !== userId) ?? null;
  } catch {
    return null;
  }
}

/** Whether this browser's local data belongs to userId right now. */
export function ownsLocalData(userId: string): boolean {
  try {
    return localStorage.getItem(OWNER_KEY) === userId;
  } catch {
    return true; // no storage, so nothing local to mix up
  }
}

/** Removes every Steen key from this browser. */
export function wipeLocalData(): void {
  try {
    Object.keys(localStorage)
      .filter((k) => k.startsWith("steen:") && !PRESERVE.has(k))
      .forEach((k) => localStorage.removeItem(k));
  } catch {
    // storage unavailable
  }
}

/**
 * Returns "ok" when local data may be used with this account (claiming
 * unowned data on first sign-in), or "switched" after wiping another
 * account's data; the caller should then reload so stores start empty.
 */
export function claimLocalData(userId: string): "ok" | "switched" {
  const owner = read() ?? otherCursorOwner(userId);
  if (owner === userId) return "ok";
  if (owner && owner !== userId) {
    wipeLocalData();
    localStorage.setItem(OWNER_KEY, userId);
    return "switched";
  }
  try {
    localStorage.setItem(OWNER_KEY, userId);
  } catch {
    // ignore
  }
  return "ok";
}
