import type { Icon } from "@phosphor-icons/react";

/**
 * A module is a self-contained area of the platform (Focus, Insights,
 * Wellness, Fitness…). Adding one = a manifest + a route + its stores.
 */
export interface ModuleManifest {
  id: string;
  name: string;
  /** One-line description used in navigation and teasers. */
  tagline: string;
  href: string;
  icon: Icon;
  status: "live" | "soon";
  /** Bullet points shown on the coming-soon page. */
  roadmap?: string[];
}
