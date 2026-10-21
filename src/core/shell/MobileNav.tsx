"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MODULES } from "@/modules/registry";
import { cn } from "../lib/cn";
import { isActive } from "./TopBar";

export function MobileNav() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Modules"
      className="fixed inset-x-3 bottom-3 z-30 flex items-center justify-around rounded-full bg-ink/92 p-1.5 text-page shadow-[0_12px_40px_-12px_rgb(0_0_0/0.5)] backdrop-blur md:hidden"
    >
      {MODULES.map((m) => {
        const active = isActive(pathname, m.href);
        const Icon = m.icon;
        return (
          <Link
            key={m.id}
            href={m.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex h-12 flex-1 flex-col items-center justify-center gap-0.5 rounded-full text-[10.5px] font-medium transition-colors",
              active ? "bg-page text-ink" : "text-page/70",
            )}
          >
            <Icon size={19} weight={active ? "fill" : "bold"} />
            {m.name}
          </Link>
        );
      })}
    </nav>
  );
}
