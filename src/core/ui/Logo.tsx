import { cn } from "../lib/cn";

/** Cadence mark: an open ring (a session) with a beat dot. */
export function LogoMark({ size = 24, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden className={className}>
      <path d="M16 4.5a11.5 11.5 0 1 1-11.5 11.5" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" />
      <circle cx="7.6" cy="7.6" r="3.1" fill="currentColor" />
      <circle cx="16" cy="16" r="2.4" fill="currentColor" />
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2 text-ink", className)}>
      <LogoMark size={22} />
      <span className="display text-[21px] leading-none font-[680] tracking-[-0.04em]">cadence</span>
    </span>
  );
}
