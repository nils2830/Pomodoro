"use client";

import { getSyncables, type BaseRecord } from "./record";

interface Backup {
  app: "cadence";
  version: 1;
  exportedAt: string;
  collections: Record<string, BaseRecord[]>;
}

/** Everything Cadence stores, as one JSON document. */
export function createBackup(): string {
  const collections: Record<string, BaseRecord[]> = {};
  for (const s of getSyncables()) collections[s.name] = s.changedSince(-1);
  const backup: Backup = { app: "cadence", version: 1, exportedAt: new Date().toISOString(), collections };
  return JSON.stringify(backup, null, 2);
}

/** Merges a backup into local data (newest version of each record wins). */
export function restoreBackup(json: string): number {
  const parsed = JSON.parse(json) as Partial<Backup>;
  if (parsed.app !== "cadence" || !parsed.collections) throw new Error("This file isn't a Cadence backup.");
  let count = 0;
  for (const s of getSyncables()) {
    const records = parsed.collections[s.name];
    if (Array.isArray(records) && records.length) {
      s.applyRemote(records);
      count += records.length;
    }
  }
  return count;
}

export function eraseLocalData(): void {
  Object.keys(localStorage)
    .filter((k) => k.startsWith("cadence:"))
    .forEach((k) => localStorage.removeItem(k));
}
