"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { TopBar } from "./TopBar";
import { MobileNav } from "./MobileNav";
import { ShortcutsDialog } from "./ShortcutsDialog";
import { useAppearance } from "./useAppearance";
import { useModeColors } from "./useModeColors";
import { ClientOnly } from "./ClientOnly";
import { Toaster } from "../ui/Toaster";
import { ConfirmDialog } from "../ui/ConfirmDialog";
import { useUI } from "../ui/store";
import { UpgradeDialog } from "../billing/UpgradeDialog";
import { AuthProvider } from "../auth/AuthProvider";
import { SyncProvider } from "../data/SyncProvider";
import { useTimerEngine } from "@/modules/focus/engine/useTimerEngine";
import { SettingsDialog } from "@/modules/focus/components/settings/SettingsDialog";
import { cn } from "../lib/cn";
import { isTypingTarget } from "../lib/dom";

function Engines({ isFocus }: { isFocus: boolean }) {
  useTimerEngine();
  useAppearance();
  useModeColors(isFocus);
  return null;
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isFocus = pathname === "/";
  const zen = useUI((s) => s.zen);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (isTypingTarget(e.target) || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "?") {
        e.preventDefault();
        useUI.getState().setShortcuts(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!isFocus && zen) useUI.getState().setZen(false);
  }, [isFocus, zen]);

  return (
    <div className={cn("grain relative flex min-h-svh flex-col overflow-x-clip transition-[background-color,color] duration-700", "bg-page text-ink")}>
      <ClientOnly>
        <Engines isFocus={isFocus} />
        <AuthProvider />
        <SyncProvider />
      </ClientOnly>
      {!zen && <TopBar />}
      <main className="relative z-[1] flex-1 pb-24 md:pb-0">{children}</main>
      {!zen && <MobileNav />}
      <ClientOnly>
        <SettingsDialog />
        <UpgradeDialog />
        <ConfirmDialog />
        <ShortcutsDialog />
        <Toaster />
      </ClientOnly>
    </div>
  );
}
