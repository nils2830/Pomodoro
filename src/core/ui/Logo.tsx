import { cn } from "../lib/cn";

/** The three stones of the Steen cairn, bottom to top (32×32 grid). */
export const CAIRN_PATHS = [
  "M3.42 25.47 C3.31 22.13 8.39 19.46 15.81 19.2 C24.01 18.92 28.49 21.25 28.61 24.59 C28.73 27.99 25.47 28.7 16.15 29.03 C6.84 29.35 3.54 28.87 3.42 25.47Z",
  "M6.9 13.91 C7.12 11.38 10.65 9.79 15.46 10.22 C20.78 10.68 23.46 12.81 23.24 15.34 C23.02 17.91 20.85 18.18 14.81 17.65 C8.76 17.12 6.68 16.48 6.9 13.91Z",
  "M11.88 7.24 C11.62 5.34 13.45 3.64 16.37 3.23 C19.59 2.78 21.52 3.95 21.79 5.85 C22.06 7.78 20.82 8.3 17.15 8.82 C13.49 9.33 12.15 9.17 11.88 7.24Z",
] as const;

/** Steen mark: a small cairn, three smooth stones in balance. */
export function LogoMark({ size = 24, className, animated }: { size?: number; className?: string; animated?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="currentColor" aria-hidden className={className}>
      {CAIRN_PATHS.map((d, i) => (
        <path
          key={i}
          d={d}
          className={animated ? "cairn-stone" : undefined}
          style={animated ? { animationDelay: `${0.1 + i * 0.16}s` } : undefined}
        />
      ))}
    </svg>
  );
}

export function Logo({ className, size = 22 }: { className?: string; size?: number }) {
  return (
    <span className={cn("inline-flex items-center gap-2 text-ink", className)}>
      <LogoMark size={size} />
      <span className="display leading-none font-[640] tracking-[-0.05em]" style={{ fontSize: size * 1.05 }}>
        steen
      </span>
    </span>
  );
}
