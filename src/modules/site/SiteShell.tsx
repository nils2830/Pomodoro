"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { AuthProvider } from "@/core/auth/AuthProvider";
import { Toaster } from "@/core/ui/Toaster";
import { ConfirmDialog } from "@/core/ui/ConfirmDialog";
import { ClientOnly } from "@/core/shell/ClientOnly";
import { SiteNav } from "./SiteNav";
import { SiteFooterNight } from "./SiteFooterNight";
import { cn } from "@/core/lib/cn";

/** Chrome for the public pages: welcome, sign-in, pricing, legal. Always night. */
export function SiteShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  // The welcome hero and the sign-in screen run edge to edge; other pages clear the floating nav.
  const fullBleed = pathname === "/welcome" || pathname === "/login";
  return (
    <div className="night grain relative flex min-h-svh flex-col">
      <ClientOnly>
        <AuthProvider />
      </ClientOnly>
      <SiteNav />
      <main className={cn("relative z-[1] flex-1", !fullBleed && "pt-20")}>{children}</main>
      <SiteFooterNight />
      <ClientOnly>
        <ConfirmDialog />
        <Toaster />
      </ClientOnly>
    </div>
  );
}
