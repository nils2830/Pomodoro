import { cn } from "../lib/cn";

export function ProBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex h-[18px] items-center rounded-full bg-ink px-1.5 font-mono text-[9.5px] font-semibold tracking-[0.12em] text-page uppercase",
        className,
      )}
    >
      Pro
    </span>
  );
}
