import Link from "next/link";
import { ArrowLeft, Check } from "@phosphor-icons/react/dist/ssr";
import type { ModuleManifest } from "../modules/types";

/** Placeholder page for modules on the roadmap. */
export function ComingSoon({ module: m }: { module: ModuleManifest }) {
  const Icon = m.icon;
  return (
    <div className="mx-auto max-w-[1180px] px-5 pt-10 pb-24 sm:px-8 sm:pt-16">
      <div className="grid items-end gap-10 lg:grid-cols-[1.3fr_1fr]">
        <div>
          <div className="eyebrow flex items-center gap-2 text-ink-3">
            <span className="size-1.5 rounded-full bg-accent" /> In the works
          </div>
          <h1 className="display mt-5 text-[clamp(3.2rem,9vw,7.5rem)] leading-[0.85]">{m.name}</h1>
          <p className="mt-6 max-w-[34ch] text-[19px] leading-snug text-ink-2">{m.tagline}</p>
        </div>
        <div className="relative hidden aspect-square w-full max-w-[340px] place-items-center justify-self-end lg:grid">
          <div className="absolute inset-0 rounded-full border border-line" />
          <div className="absolute inset-[14%] rounded-full border border-line" />
          <div className="absolute inset-[28%] rounded-full bg-fill" />
          <Icon size={88} weight="duotone" className="relative text-ink" />
        </div>
      </div>
      {m.roadmap && (
        <div className="mt-16 border-t border-line">
          {m.roadmap.map((item, i) => (
            <div key={item} className="grid grid-cols-[48px_1fr] items-baseline gap-4 border-b border-line py-6 sm:grid-cols-[80px_1fr]">
              <span className="font-mono text-[13px] text-ink-3">0{i + 1}</span>
              <span className="display text-[clamp(1.25rem,2.4vw,1.75rem)] leading-tight">{item}</span>
            </div>
          ))}
        </div>
      )}
      <div className="mt-12 flex flex-wrap items-center gap-4 text-[15px] text-ink-2">
        <Check size={18} weight="bold" className="text-ink" />
        It will share your account, timeline and Insights with Focus. Nothing to migrate.
      </div>
      <Link href="/" className="mt-10 inline-flex items-center gap-2 rounded-full bg-ink px-5 py-3 text-sm font-semibold text-page">
        <ArrowLeft size={16} weight="bold" /> Back to Focus
      </Link>
    </div>
  );
}
