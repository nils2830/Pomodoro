/**
 * The single source of truth for what Free and Pro include.
 * UI gates call useCan(feature); the pricing page renders from this file.
 */
export type Plan = "free" | "pro";

export const FEATURES = {
  "faces.all": { label: "Every timer face", detail: "Dial, sun arc, tide, dot grid and plain words." },
  flow: { label: "Flow mode", detail: "Open-ended stopwatch sessions with proportional breaks." },
  "activities.unlimited": { label: "Unlimited activities", detail: "Track as many kinds of work as you like." },
  projects: { label: "Projects", detail: "Group tasks and see time per project." },
  templates: { label: "Task templates", detail: "Save a task list and load it any day." },
  "insights.history": { label: "Full history", detail: "Insights across 30 days, 90 days, a year or everything." },
  "insights.advanced": { label: "Deep insights", detail: "Rhythm map, year heatmap, sit-down patterns and observations." },
  export: { label: "CSV export", detail: "Every session in a spreadsheet-ready file." },
  "sounds.all": { label: "Full sound library", detail: "All alarm tones plus rain, ocean and noise soundscapes." },
  "themes.all": { label: "All themes", detail: "Grove, Velvet and Citrus colour themes." },
  sync: { label: "Cloud sync", detail: "Your data on every device, backed up." },
  popout: { label: "Pop-out timer", detail: "A floating mini timer that stays on top." },
} as const;

export type Feature = keyof typeof FEATURES;

export const LIMITS = {
  free: { activities: 3, insightsDays: 7 },
  pro: { activities: Number.POSITIVE_INFINITY, insightsDays: Number.POSITIVE_INFINITY },
} as const;

export const PRICING = {
  currency: "USD",
  symbol: "$",
  monthly: 4,
  yearly: 36,
} as const;

/** Features shown on the pricing page, in order. */
export const PRO_HIGHLIGHTS: Feature[] = [
  "insights.advanced",
  "insights.history",
  "faces.all",
  "flow",
  "sync",
  "sounds.all",
  "activities.unlimited",
  "projects",
  "templates",
  "export",
  "themes.all",
  "popout",
];

export const FREE_INCLUDES: string[] = [
  "Focus, short and long break timer",
  "Hide the timer, ring and wall-clock faces",
  "Tasks with estimates and notes",
  "Up to 3 activities",
  "Last 7 days of insights",
  "Daily goal and streaks",
  "Notifications, shortcuts and zen mode",
];
