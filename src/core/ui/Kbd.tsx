import type { ReactNode } from "react";

export function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="inline-flex h-6 min-w-6 items-center justify-center rounded-md border border-line border-b-2 bg-raised px-1.5 font-mono text-[11px] font-medium text-ink-2">
      {children}
    </kbd>
  );
}
