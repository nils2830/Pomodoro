"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { GearSix, UserCircle, Sparkle, ShieldCheck } from "@phosphor-icons/react";
import { MODULES } from "@/modules/registry";
import { Logo } from "../ui/Logo";
import { IconButton } from "../ui/Button";
import { useUI } from "../ui/store";
import { usePlan } from "../billing/entitlements";
import { useAuth } from "../auth/store";
import { cn } from "../lib/cn";
import { useT } from "../i18n";
import { DailyGoal } from "./DailyGoal";
import { ClientOnly } from "./ClientOnly";

export function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export function TopBar() {
  const pathname = usePathname();
  const openSettings = useUI((s) => s.openSettings);
  const t = useT();

  return (
    <header className="relative z-20 mx-auto flex h-[72px] w-full max-w-[1320px] items-center gap-3 px-4 sm:px-6">
      <Link href="/" aria-label={t("Steen home")} className="mr-2 shrink-0 rounded-full">
        <Logo />
      </Link>

      <nav aria-label={t("Modules")} className="hidden items-center gap-1 md:flex">
        {MODULES.map((m) => {
          const active = isActive(pathname, m.href);
          const Icon = m.icon;
          return (
            <Link
              key={m.id}
              href={m.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "group relative inline-flex h-10 items-center gap-2 rounded-full px-3.5 text-sm font-medium transition-colors",
                active ? "bg-ink text-page" : "text-ink-2 hover:bg-fill hover:text-ink",
              )}
            >
              <Icon size={17} weight={active ? "fill" : "bold"} />
              {t(m.name)}
              {m.status === "soon" && (
                <span className={cn("rounded-full px-1.5 py-px font-mono text-[9px] tracking-[0.1em] uppercase", active ? "bg-page/15" : "bg-fill text-ink-3")}>
                  {t("soon")}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="ml-auto flex items-center gap-1.5">
        <ClientOnly>
          <DailyGoal />
          <PlanButton />
        </ClientOnly>
        <IconButton label={t("Settings")} onClick={() => openSettings()} size="md">
          <GearSix size={20} weight="bold" />
        </IconButton>
        <ClientOnly fallback={<span className="size-10" />}>
          <AccountButton />
        </ClientOnly>
      </div>
    </header>
  );
}

function PlanButton() {
  const plan = usePlan();
  const pathname = usePathname();
  const t = useT();
  if (plan === "pro" || pathname === "/pricing") return null;
  return (
    <Link
      href="/pricing"
      className="hidden h-10 items-center gap-1.5 rounded-full border border-line px-4 text-sm font-semibold text-ink transition-colors hover:bg-fill sm:inline-flex"
    >
      <Sparkle size={15} weight="fill" />
      {t("Go Pro")}
    </Link>
  );
}

function AccountButton() {
  const user = useAuth((s) => s.user);
  const status = useAuth((s) => s.status);
  const isAdmin = useAuth((s) => s.isAdmin);
  const plan = usePlan();
  const t = useT();
  const initial = user?.email?.[0]?.toUpperCase();
  if (status === "signedOut")
    return (
      <Link
        href="/login"
        className="inline-flex h-10 items-center rounded-full bg-ink px-4 text-sm font-semibold text-page transition-opacity hover:opacity-90"
      >
        {t("Sign in")}
      </Link>
    );
  return (
    <>
      {isAdmin && (
        <Link
          href="/admin"
          aria-label={t("Admin")}
          title={t("Admin")}
          className="grid size-10 place-items-center rounded-full text-ink-2 transition-colors hover:bg-fill hover:text-ink"
        >
          <ShieldCheck size={20} weight="bold" />
        </Link>
      )}
      <AccountLink initial={initial} plan={plan} />
    </>
  );
}

function AccountLink({ initial, plan }: { initial?: string; plan: string }) {
  const t = useT();
  return (
    <Link
      href="/account"
      aria-label={t("Account")}
      title={t("Account")}
      className="relative grid size-10 place-items-center rounded-full text-ink-2 transition-colors hover:bg-fill hover:text-ink"
    >
      {initial ? (
        <span className="display grid size-8 place-items-center rounded-full bg-ink text-[15px] text-page">{initial}</span>
      ) : (
        <UserCircle size={24} weight="bold" />
      )}
      {plan === "pro" && (
        <span className="absolute -right-0.5 -bottom-0.5 rounded-full bg-ink px-1 font-mono text-[8px] font-semibold tracking-[0.08em] text-page ring-2 ring-page">
          PRO
        </span>
      )}
    </Link>
  );
}
