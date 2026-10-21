import { ChartLineUp } from "@phosphor-icons/react/dist/ssr";
import type { ModuleManifest } from "@/core/modules/types";

export const insightsModule: ModuleManifest = {
  id: "insights",
  name: "Insights",
  tagline: "How often you sit down, and what you do with it.",
  href: "/insights",
  icon: ChartLineUp,
  status: "live",
};
