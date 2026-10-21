import Link from "next/link";
import { config } from "../config";
import { cn } from "../lib/cn";

export function SiteFooter({ className }: { className?: string }) {
  return (
    <footer className={cn("relative z-[1] border-t border-line", className)}>
      <div className="mx-auto flex max-w-[1320px] flex-wrap items-center gap-x-6 gap-y-2 px-5 py-6 text-[13px] text-ink-3 sm:px-6">
        <span>
          © {new Date().getFullYear()} {config.appName}
        </span>
        <nav aria-label="Footer" className="flex flex-wrap gap-x-5 gap-y-2">
          <Link href="/pricing" className="hover:text-ink">
            Pricing
          </Link>
          <Link href="/terms" className="hover:text-ink">
            Terms
          </Link>
          <Link href="/privacy" className="hover:text-ink">
            Privacy
          </Link>
          {config.legal.email.includes("@") && (
            <a href={`mailto:${config.legal.email}`} className="hover:text-ink">
              Contact
            </a>
          )}
        </nav>
      </div>
    </footer>
  );
}
