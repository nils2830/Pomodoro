"use client";

import { create } from "zustand";
import type { Feature } from "../billing/plans";
import { uid } from "../lib/id";

export type SettingsTab = "account" | "timer" | "warmup" | "tasks" | "sound" | "display" | "appearance" | "notifications" | "activities" | "data";

export interface Toast {
  id: string;
  message: string;
  tone?: "default" | "success" | "error";
  action?: { label: string; onClick: () => void };
}

interface ConfirmRequest {
  title: string;
  body?: string;
  confirmLabel?: string;
  tone?: "default" | "danger";
  resolve: (ok: boolean) => void;
}

interface UIState {
  settings: { open: boolean; tab: SettingsTab };
  upgrade: { open: boolean; feature?: Feature };
  shortcutsOpen: boolean;
  zen: boolean;
  toasts: Toast[];
  confirmRequest: ConfirmRequest | null;
  openSettings(tab?: SettingsTab): void;
  closeSettings(): void;
  openUpgrade(feature?: Feature): void;
  closeUpgrade(): void;
  setShortcuts(open: boolean): void;
  setZen(zen: boolean): void;
  toast(t: Omit<Toast, "id"> | string): void;
  dismissToast(id: string): void;
}

export const useUI = create<UIState>()((set, get) => ({
  settings: { open: false, tab: "timer" },
  upgrade: { open: false },
  shortcutsOpen: false,
  zen: false,
  toasts: [],
  confirmRequest: null,
  openSettings: (tab) => set((s) => ({ settings: { open: true, tab: tab ?? s.settings.tab } })),
  closeSettings: () => set((s) => ({ settings: { ...s.settings, open: false } })),
  openUpgrade: (feature) => set({ upgrade: { open: true, feature } }),
  closeUpgrade: () => set((s) => ({ upgrade: { ...s.upgrade, open: false } })),
  setShortcuts: (open) => set({ shortcutsOpen: open }),
  setZen: (zen) => set({ zen }),
  toast: (t) => {
    const toast: Toast = typeof t === "string" ? { id: uid(), message: t } : { ...t, id: uid() };
    set((s) => ({ toasts: [...s.toasts.slice(-2), toast] }));
    window.setTimeout(() => get().dismissToast(toast.id), 4200);
  },
  dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

/** Promise-based confirm dialog. */
export function confirmAction(opts: Omit<ConfirmRequest, "resolve">): Promise<boolean> {
  return new Promise((resolve) => {
    useUI.setState({
      confirmRequest: {
        ...opts,
        resolve: (ok) => {
          useUI.setState({ confirmRequest: null });
          resolve(ok);
        },
      },
    });
  });
}

export const toast = (t: Omit<Toast, "id"> | string) => useUI.getState().toast(t);
