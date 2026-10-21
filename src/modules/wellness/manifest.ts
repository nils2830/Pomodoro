import { Plant } from "@phosphor-icons/react/dist/ssr";
import type { ModuleManifest } from "@/core/modules/types";

export const wellnessModule: ModuleManifest = {
  id: "wellness",
  name: "Wellness",
  tagline: "Sleep, mood, water and the small habits that hold a day together.",
  href: "/wellness",
  icon: Plant,
  status: "soon",
  roadmap: [
    "Daily check-in: mood, energy and stress in three taps",
    "Sleep and hydration logs that sit on the same timeline as your focus",
    "See how rest changes the way you study",
  ],
};
