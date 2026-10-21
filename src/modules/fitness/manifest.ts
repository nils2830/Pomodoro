import { Barbell } from "@phosphor-icons/react/dist/ssr";
import type { ModuleManifest } from "@/core/modules/types";

export const fitnessModule: ModuleManifest = {
  id: "fitness",
  name: "Fitness",
  tagline: "Runs, lifts and rest days, next to everything else you track.",
  href: "/fitness",
  icon: Barbell,
  status: "soon",
  roadmap: [
    "Log workouts or import them from Strava and Garmin",
    "Weekly load, streaks and recovery in the same Insights view",
    "Interval timer built on the Focus engine",
  ],
};
