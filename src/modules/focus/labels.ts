import type { TimerMode } from "./types";

export const MODE_LABEL: Record<TimerMode, string> = {
  focus: "Focus",
  short: "Short break",
  long: "Long break",
};

export const MODE_PROMPT: Record<TimerMode, string> = {
  focus: "Time to focus.",
  short: "Breathe out.",
  long: "Step away for a bit.",
};
