"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { registerSyncable, type BaseRecord } from "./record";

export interface DocumentState<T extends object> {
  doc: T;
  updatedAt: number;
  set(patch: Partial<T>): void;
  reset(): void;
}

/**
 * A single persisted, syncable settings object. Missing keys are filled
 * from defaults on load, so adding new settings never breaks old data.
 */
export function createDocument<T extends object>(name: string, defaults: T, opts: { sync?: boolean } = { sync: true }) {
  const store = create<DocumentState<T>>()(
    persist(
      (set) => ({
        doc: defaults,
        updatedAt: 0,
        set: (patch) => set((s) => ({ doc: { ...s.doc, ...patch }, updatedAt: Date.now() })),
        reset: () => set({ doc: defaults, updatedAt: Date.now() }),
      }),
      {
        name: `cadence:${name}`,
        version: 1,
        storage: createJSONStorage(() => localStorage),
        partialize: (s) => ({ doc: s.doc, updatedAt: s.updatedAt }) as unknown as DocumentState<T>,
        merge: (persisted, current) => {
          const p = (persisted ?? {}) as Partial<DocumentState<T>>;
          return { ...current, updatedAt: p.updatedAt ?? 0, doc: { ...defaults, ...(p.doc ?? {}) } };
        },
      },
    ),
  );

  if (opts.sync !== false) {
    registerSyncable({
      name,
      changedSince: (ts) => {
        const s = store.getState();
        if (s.updatedAt <= ts) return [];
        const rec: BaseRecord & { data: T } = { id: "doc", createdAt: 0, updatedAt: s.updatedAt, data: s.doc };
        return [rec];
      },
      applyRemote: (records) => {
        const rec = records.find((r) => r.id === "doc") as (BaseRecord & { data: T }) | undefined;
        if (!rec) return;
        const s = store.getState();
        if (rec.updatedAt > s.updatedAt) store.setState({ doc: { ...defaults, ...rec.data }, updatedAt: rec.updatedAt });
      },
      subscribe: (listener) => store.subscribe((s, prev) => s.updatedAt !== prev.updatedAt && listener()),
    });
  }

  return store;
}
