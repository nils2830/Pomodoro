/**
 * Every persisted, syncable thing in Steen is a record.
 * Soft deletes (deletedAt) let deletions travel through sync.
 */
export interface BaseRecord {
  id: string;
  createdAt: number;
  updatedAt: number;
  deletedAt?: number | null;
}

export function isAlive<T extends BaseRecord>(r: T | undefined): r is T {
  return Boolean(r) && !r!.deletedAt;
}

/** Anything the sync engine can push and pull. */
export interface Syncable {
  name: string;
  changedSince(ts: number): BaseRecord[];
  applyRemote(records: BaseRecord[]): void;
  subscribe(listener: () => void): () => void;
}

const registry = new Map<string, Syncable>();

export function registerSyncable(s: Syncable): void {
  registry.set(s.name, s);
}

export function getSyncables(): Syncable[] {
  return [...registry.values()];
}
