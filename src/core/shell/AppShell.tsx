"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { TopBar } from "./TopBar";
import { MobileNav } from "./MobileNav";
import { ShortcutsDialog } from "./ShortcutsDialog";
import { useAppearance } from "./useAppearance";
import { useModeColors } from "./useModeColors";
import { useDocumentLang } from "../i18n";
import { ClientOnly } from "./ClientOnly";
import { SiteFooter } from "./SiteFooter";
import { FocusBackdrop } from "./FocusBackdrop";
import { Toaster } from "../ui/Toaster";
import { ConfirmDialog } from "../ui/ConfirmDialog";
import { useUI } from "../ui/store";
import { UpgradeDialog } from "../billing/UpgradeDialog";
import { CheckoutDialog } from "../billing/CheckoutDialog";
import { ProWelcome } from "../billing/ProWelcome";
import { NamePrompt } from "./NamePrompt";
import { Announcement } from "./Announcement";
import { Tour } from "./Tour";
import { DistractionCheck } from "@/modules/focus/components/DistractionCheck";
import { AuthProvider } from "../auth/AuthProvider";
import { AuthGate } from "../auth/AuthGate";
import { SyncProvider } from "../data/SyncProvider";
import { useTimerEngine } from "@/modules/focus/engine/useTimerEngine";
import { SettingsDialog } from "@/modules/focus/components/settings/SettingsDialog";
import { WarmupOverlay } from "@/modules/focus/warmup/WarmupOverlay";
import { cn } from "../lib/cn";
import { isTypingTarget } from "../lib/dom";

function Engines({ isFocus }: { isFocus: boolean }) {
  useTimerEngine();
  useAppearance();
  useModeColors(isFocus);
  useDocumentLang();
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
        <AuthGate />
        <SyncProvider />
      </ClientOnly>
      {isFocus && (
        <ClientOnly>
          <FocusBackdrop />
        </ClientOnly>
      )}
      {!zen && <TopBar />}
      {!zen && (
        <ClientOnly>
          <Announcement />
        </ClientOnly>
      )}
      <main className="relative z-[1] flex-1">{children}</main>
      {!zen && <SiteFooter className={cn("pb-24 md:pb-0", isFocus && "neutral bg-page")} />}
      {!zen && <MobileNav />}
      <ClientOnly>
        <SettingsDialog />
        <UpgradeDialog />
        <CheckoutDialog />
        <NamePrompt />
        <DistractionCheck />
        <Tour />
        <ProWelcome />
        <ConfirmDialog />
        <ShortcutsDialog />
        <WarmupOverlay />
        <Toaster />
      </ClientOnly>
    </div>
  );
}
