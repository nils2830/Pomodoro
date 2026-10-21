import type { ReactNode } from "react";

/** Shared layout for the terms and privacy pages. */
export function LegalPage({ eyebrow, title, updated, children }: { eyebrow: string; title: string; updated: string; children: ReactNode }) {
  return (
    <article className="mx-auto w-full max-w-[760px] px-5 pt-10 pb-24 sm:pt-16">
      <div className="eyebrow text-ink-3">{eyebrow}</div>
      <h1 className="display mt-4 text-[clamp(2.4rem,6vw,4rem)] leading-[0.9]">{title}</h1>
      <p className="mt-4 text-[13px] text-ink-3">Last updated {updated}</p>
      <div className="mt-10 space-y-8 border-t border-ink/80 pt-8 text-[15.5px] leading-relaxed text-ink-2 [&_a]:text-ink [&_a]:underline [&_a]:underline-offset-2 [&_h2]:display [&_h2]:mb-2 [&_h2]:text-[22px] [&_h2]:text-ink [&_li]:mt-1.5 [&_strong]:text-ink [&_ul]:list-disc [&_ul]:pl-5">
        {children}
      </div>
    </article>
  );
}
