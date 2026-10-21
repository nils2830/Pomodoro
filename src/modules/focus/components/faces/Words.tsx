import { MINUTE } from "@/core/lib/time";
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

function flowPhrase(ms: number): string {
  const min = ms / MINUTE;
  if (min < 3) return "Just getting started.";
  if (min < 55) return `About ${Math.round(min / 5) * 5} minutes in.`;
  if (min < 75) return "About an hour in.";
  const h = Math.round((min / 60) * 2) / 2;
  return `About ${h} hours in.`;
}

/** Time in plain language. Coarse on purpose. */
export function Words(p: FaceProps) {
  const isFlow = p.flow && p.mode === "focus";
  const text =
    p.status === "idle"
      ? p.mode === "focus"
        ? "Ready when you are."
        : "Take a breather."
      : isFlow
        ? flowPhrase(p.elapsedMs)
        : p.mode === "focus"
          ? focusPhrase(p.progress)
          : breakPhrase(p.progress);
  return (
    <div className="grid h-full place-items-center px-4">
      <p key={text} className="display animate-rise max-w-[11ch] text-center text-[min(13cqw,26cqh)] leading-[0.95] text-balance">
        {text}
      </p>
    </div>
  );
}
