"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { uid } from "../lib/id";
import { type BaseRecord, registerSyncable, isAlive } from "./record";

type NewRecord<T extends BaseRecord> = Omit<T, keyof BaseRecord> & Partial<BaseRecord>;

export interface CollectionState<T extends BaseRecord> {
  items: Record<string, T>;
  create(data: NewRecord<T>): T;
  createMany(data: NewRecord<T>[]): T[];
  update(id: string, patch: Partial<Omit<T, "id" | "createdAt">>): void;
  remove(id: string): void;
  removeWhere(predicate: (item: T) => boolean): void;
  /** Last-write-wins merge used by sync and imports. */
  merge(records: T[]): void;
}

/**
 * A persisted, syncable collection of records. Modules declare their data
 * with this so the sync engine and data export pick it up automatically.
 */
export function createCollection<T extends BaseRecord>(name: string, opts: { seed?: () => NewRecord<T>[] } = {}) {
  const build = (data: NewRecord<T>, now: number): T =>
    ({ ...data, id: data.id ?? uid(), createdAt: data.createdAt ?? now, updatedAt: now, deletedAt: null }) as T;

  const store = create<CollectionState<T>>()(
    persist(
      (set) => ({
        items: {},
        create: (data) => {
          const rec = build(data, Date.now());
          set((s) => ({ items: { ...s.items, [rec.id]: rec } }));
          return rec;
        },
        createMany: (list) => {
          const now = Date.now();
          const recs = list.map((d) => build(d, now));
          set((s) => {
            const items = { ...s.items };
            for (const r of recs) items[r.id] = r;
            return { items };
          });
          return recs;
        },
        update: (id, patch) =>
          set((s) => {
            const cur = s.items[id];
            if (!cur) return s;
            return { items: { ...s.items, [id]: { ...cur, ...patch, updatedAt: Date.now() } } };
          }),
        remove: (id) =>
          set((s) => {
            const cur = s.items[id];
            if (!cur) return s;
            const now = Date.now();
            return { items: { ...s.items, [id]: { ...cur, deletedAt: now, updatedAt: now } } };
          }),
        removeWhere: (predicate) =>
          set((s) => {
            const now = Date.now();
            const items = { ...s.items };
            let changed = false;
            for (const [id, item] of Object.entries(items)) {
              if (isAlive(item) && predicate(item)) {
                items[id] = { ...item, deletedAt: now, updatedAt: now };
                changed = true;
              }
            }
            return changed ? { items } : s;
          }),
        merge: (records) =>
          set((s) => {
            const items = { ...s.items };
            let changed = false;
            for (const r of records) {
              const cur = items[r.id];
              if (!cur || r.updatedAt > cur.updatedAt) {
                items[r.id] = r;
                changed = true;
              }
            }
            return changed ? { items } : s;
          }),
      }),
      {
        name: `cadence:${name}`,
        version: 1,
        storage: createJSONStorage(() => localStorage),
        partialize: (s) => ({ items: s.items }) as unknown as CollectionState<T>,
        onRehydrateStorage: () => (state) => {
          if (!state || !opts.seed) return;
          // Seeds carry fixed ids and an ancient timestamp, so records that
          // arrive later through sync always win over the local defaults.
          if (Object.keys(state.items).length === 0)
            state.merge(opts.seed().map((d) => ({ ...d, id: d.id ?? uid(), createdAt: 1, updatedAt: 1, deletedAt: null }) as T));
        },
      },
    ),
  );

  registerSyncable({
    name,
    changedSince: (ts) => Object.values(store.getState().items).filter((r) => r.updatedAt > ts),
    applyRemote: (records) => store.getState().merge(records as T[]),
    subscribe: (listener) => store.subscribe((s, prev) => s.items !== prev.items && listener()),
  });

  return store;
}

/** Sorted list of live records. Use inside useMemo with the items object. */
export function liveList<T extends BaseRecord>(items: Record<string, T>, sort?: (a: T, b: T) => number): T[] {
  const list = Object.values(items).filter((r) => !r.deletedAt);
  return sort ? list.sort(sort) : list;
}
