"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoMark } from "@/core/ui/Logo";
import { useT } from "@/core/i18n";
import { config } from "@/core/config";

export function SiteFooterNight() {
  const t = useT();
  const pathname = usePathname();
  if (pathname === "/login") return null;
  const da = pathname === "/da";
  const home = da ? "/da" : "/welcome";
  return (
    <footer className="relative z-[1] border-t border-line">
      <div className="mx-auto grid max-w-[1240px] gap-10 px-6 py-14 sm:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <div className="flex items-center gap-2 text-ink">
            <LogoMark size={22} />
            <span className="display text-[21px] tracking-[-0.05em]">steen</span>
          </div>
          <p className="mt-4 max-w-[34ch] text-[14px] leading-relaxed text-ink-3">
            {t("A calm focus timer. Warm up, sit down, stay steady. Made in {country}.", { country: t(config.legal.country) })}
          </p>
          <Link href={da ? "/welcome" : "/da"} hrefLang={da ? "en" : "da"} className="mt-5 inline-flex rounded-full px-3 py-1.5 text-[13px] text-ink-2 ring-1 ring-line hover:text-ink">
            {da ? "English" : "Dansk"}
          </Link>
        </div>
        <div className="grid gap-2 text-[14px]">
          <div className="eyebrow mb-1 text-ink-3">{t("Product")}</div>
          <Link href={`${home}#warmup`} className="text-ink-2 hover:text-ink">{t("Warm-up")}</Link>
          <Link href={`${home}#faces`} className="text-ink-2 hover:text-ink">{t("Faces")}</Link>
          <Link href={`${home}#insights`} className="text-ink-2 hover:text-ink">{t("Insights")}</Link>
          <Link href="/pricing" className="text-ink-2 hover:text-ink">{t("Pricing")}</Link>
        </div>
        <div className="grid gap-2 text-[14px]">
          <div className="eyebrow mb-1 text-ink-3">Steen</div>
          <Link href="/terms" className="text-ink-2 hover:text-ink">{t("Terms")}</Link>
          <Link href="/privacy" className="text-ink-2 hover:text-ink">{t("Privacy")}</Link>
          {config.legal.email.includes("@") && (
            <a href={`mailto:${config.legal.email}`} className="text-ink-2 hover:text-ink">
              {t("Contact")}
            </a>
          )}
        </div>
      </div>
      <div className="mx-auto max-w-[1240px] px-6 pb-8 text-[12.5px] text-ink-3">© {new Date().getFullYear()} Steen</div>
    </footer>
  );
}
