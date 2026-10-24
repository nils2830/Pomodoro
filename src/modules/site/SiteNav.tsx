"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { ArrowRight } from "@phosphor-icons/react";
import { LogoMark } from "@/core/ui/Logo";
import { useAuth } from "@/core/auth/store";
import { useT } from "@/core/i18n";
import { cn } from "@/core/lib/cn";

const LINKS = [
  { href: "#warmup", label: "Warm-up" },
  { href: "#faces", label: "Faces" },
  { href: "#insights", label: "Insights" },
  { href: "/pricing", label: "Pricing" },
];

export function SiteNav() {
  const t = useT();
  const pathname = usePathname();
  const status = useAuth((s) => s.status);
  const [scrolled, setScrolled] = useState(false);
  const onWelcome = pathname === "/welcome" || pathname === "/da";
  const home = pathname === "/da" ? "/da" : "/welcome";

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 24);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  if (pathname === "/login") return null;

  return (
    <motion.header
      initial={{ y: -24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.9, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
      className="fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-5"
    >
      <div
        className={cn(
          "mx-auto flex h-14 max-w-[1240px] items-center gap-2 rounded-full pr-2 pl-5 transition-[background-color,box-shadow,backdrop-filter] duration-500",
          scrolled || !onWelcome ? "bg-[#161513]/70 shadow-[0_10px_40px_-20px_rgb(0_0_0/0.8)] ring-1 ring-white/8 backdrop-blur-xl" : "bg-black/15 ring-1 ring-white/10 backdrop-blur-md",
        )}
      >
        <Link href={home} aria-label={t("Steen home")} className="mr-4 flex items-center gap-2 text-ink">
          <LogoMark size={22} animated />
          <span className="display text-[21px] leading-none tracking-[-0.05em]">steen</span>
        </Link>
        <nav aria-label={t("Site")} className="hidden items-center gap-1 md:flex">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href.startsWith("#") ? home + l.href : l.href} className="rounded-full px-3.5 py-2 text-[14px] text-ink/80 transition-colors hover:text-ink">
              {t(l.label)}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-1.5">
          {status === "signedIn" ? (
            <Link href="/" className="inline-flex h-10 items-center gap-1.5 rounded-full bg-btn px-5 text-[14px] font-medium text-btn-ink transition-transform hover:-translate-y-px">
              {t("Open Steen")} <ArrowRight size={14} weight="bold" />
            </Link>
          ) : (
            <>
              <Link href="/login" className="hidden h-10 items-center rounded-full px-4 text-[14px] text-ink/80 transition-colors hover:text-ink sm:inline-flex">
                {t("Sign in")}
              </Link>
              <Link
                href="/login?mode=signup"
                className="inline-flex h-10 items-center gap-1.5 rounded-full bg-btn px-5 text-[14px] font-medium text-btn-ink transition-transform hover:-translate-y-px"
              >
                {t("Start free")}
              </Link>
            </>
          )}
        </div>
      </div>
    </motion.header>
  );
}
