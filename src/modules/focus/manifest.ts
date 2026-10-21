import { Timer } from "@phosphor-icons/react/dist/ssr";
import type { ModuleManifest } from "@/core/modules/types";

export const focusModule: ModuleManifest = {
  id: "focus",
  name: "Focus",
  tagline: "A calm timer for deep work.",
  href: "/",
  icon: Timer,
  status: "live",
};
