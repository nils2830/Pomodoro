"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoMark } from "@/core/ui/Logo";
import { config } from "@/core/config";

export function SiteFooterNight() {
  const pathname = usePathname();
  if (pathname === "/login") return null;
  return (
    <footer className="relative z-[1] border-t border-line">
      <div className="mx-auto grid max-w-[1240px] gap-10 px-6 py-14 sm:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <div className="flex items-center gap-2 text-ink">
            <LogoMark size={22} />
            <span className="display text-[21px] tracking-[-0.05em]">steen</span>
          </div>
          <p className="mt-4 max-w-[34ch] text-[14px] leading-relaxed text-ink-3">A calm focus timer. Warm up, sit down, stay steady. Made in {config.legal.country}.</p>
        </div>
        <div className="grid gap-2 text-[14px]">
          <div className="eyebrow mb-1 text-ink-3">Product</div>
          <Link href="/welcome#warmup" className="text-ink-2 hover:text-ink">Warm-up</Link>
          <Link href="/welcome#faces" className="text-ink-2 hover:text-ink">Faces</Link>
          <Link href="/welcome#insights" className="text-ink-2 hover:text-ink">Insights</Link>
          <Link href="/pricing" className="text-ink-2 hover:text-ink">Pricing</Link>
        </div>
        <div className="grid gap-2 text-[14px]">
          <div className="eyebrow mb-1 text-ink-3">Steen</div>
          <Link href="/terms" className="text-ink-2 hover:text-ink">Terms</Link>
          <Link href="/privacy" className="text-ink-2 hover:text-ink">Privacy</Link>
          {config.legal.email.includes("@") && (
            <a href={`mailto:${config.legal.email}`} className="text-ink-2 hover:text-ink">
              Contact
            </a>
          )}
        </div>
      </div>
      <div className="mx-auto max-w-[1240px] px-6 pb-8 text-[12.5px] text-ink-3">© {new Date().getFullYear()} Steen</div>
    </footer>
  );
}
