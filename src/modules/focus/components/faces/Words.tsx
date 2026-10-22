import { MINUTE } from "@/core/lib/time";
import { localeTag, useLocale, useT } from "@/core/i18n";
import type { FaceProps } from "./types";

function focusPhrase(t: number): string {
  if (t < 0.04) return "Just getting started.";
  if (t < 0.22) return "Settling in.";
  if (t < 0.42) return "Finding the rhythm.";
  if (t < 0.58) return "About halfway.";
  if (t < 0.76) return "Past the middle.";
  if (t < 0.9) return "On the home stretch.";
  return "Almost there.";
}

function breakPhrase(t: number): string {
  if (t < 0.3) return "Rest your eyes.";
  if (t < 0.65) return "Halfway through the break.";
  if (t < 0.9) return "Ease back in soon.";
  return "Break's nearly over.";
}

function flowPhrase(ms: number, t: ReturnType<typeof useT>, tag: string): string {
  const min = ms / MINUTE;
  if (min < 3) return t("Just getting started.");
  if (min < 55) return t("About {count} minutes in.", { count: Math.round(min / 5) * 5 });
  if (min < 75) return t("About an hour in.");
  const h = Math.round((min / 60) * 2) / 2;
  return t("About {count} hours in.", { count: h.toLocaleString(tag) });
}

/** Time in plain language. Coarse on purpose. */
export function Words(p: FaceProps) {
  const t = useT();
  const locale = useLocale();
  const isFlow = p.flow && p.mode === "focus";
  const text =
    p.status === "idle"
      ? p.mode === "focus"
        ? t("Ready when you are.")
        : t("Take a breather.")
      : isFlow
        ? flowPhrase(p.elapsedMs, t, localeTag(locale))
        : p.mode === "focus"
          ? t(focusPhrase(p.progress))
          : t(breakPhrase(p.progress));
  return (
    <div className="grid h-full place-items-center px-4">
      <p key={text} className="display animate-rise max-w-[11ch] text-center text-[min(13cqw,26cqh)] leading-[0.95] text-balance">
        {text}
      </p>
    </div>
  );
}
