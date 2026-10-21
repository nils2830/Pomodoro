"use client";

import { useEffect } from "react";
import { create } from "zustand";
import { useAuth } from "../auth/store";
import { useCan } from "../billing/entitlements";
import { getSyncables } from "./record";
import { syncNow, type SyncStatus } from "./sync";

export const useSyncStatus = create<SyncStatus & { requestSync: () => void }>()(() => ({
  state: "idle",
  lastSyncedAt: null,
  requestSync: () => {},
}));

const INTERVAL = 60_000;
const DEBOUNCE = 4_000;

/** Runs sync for signed-in Pro users: on start, on change, on focus, every minute. */
export function SyncProvider() {
  const userId = useAuth((s) => s.user?.id ?? null);
  const canSync = useCan("sync");

  useEffect(() => {
    if (!userId || !canSync) return;
    let running = false;
    let queued = false;
    let timer: number | undefined;

    const run = async () => {
      if (running) {
        queued = true;
        return;
      }
      running = true;
      useSyncStatus.setState({ state: "syncing" });
      try {
        await syncNow(userId);
        useSyncStatus.setState({ state: "idle", lastSyncedAt: Date.now(), error: undefined });
      } catch (e) {
        useSyncStatus.setState({ state: "error", error: e instanceof Error ? e.message : String(e) });
      } finally {
        running = false;
        if (queued) {
          queued = false;
          run();
        }
      }
    };

    const schedule = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(run, DEBOUNCE);
    };

    useSyncStatus.setState({ requestSync: run });
    run();
    const unsubs = getSyncables().map((s) => s.subscribe(schedule));
    const interval = window.setInterval(run, INTERVAL);
    const onVisible = () => document.visibilityState === "visible" && run();
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      unsubs.forEach((u) => u());
      window.clearInterval(interval);
      window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisible);
      useSyncStatus.setState({ requestSync: () => {} });
    };
  }, [userId, canSync]);

  return null;
}
