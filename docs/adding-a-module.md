# Adding a module

Wellness and fitness are registered as "coming soon" modules. This is the path from placeholder to a working module, using a simple daily wellness check-in as the example.

## 1. Data

Declare your records with the shared factories. They persist locally, show up in backups, and sync for Pro users with no database migration.

```ts
// src/modules/wellness/store.ts
"use client";
import { createCollection } from "@/core/data/collection";
import { createDocument } from "@/core/data/document";
import type { BaseRecord } from "@/core/data/record";

export interface CheckIn extends BaseRecord {
  day: string; // "2026-10-21"
  mood: 1 | 2 | 3 | 4 | 5;
  energy: 1 | 2 | 3 | 4 | 5;
  sleepHours: number | null;
  note: string;
}

export const useCheckIns = createCollection<CheckIn>("wellness.checkins");

export const useWellnessSettings = createDocument("wellness.settings", {
  reminderHour: 21,
});
```

Name collections `<module>.<thing>` so they never collide.

## 2. Time-based activity goes on the shared timeline

Anything with a start and an end (a workout, a meditation, a nap) should also be written as an `Entry`, so Insights can put it next to focus time:

```ts
import { useEntries } from "@/core/data/entries";

useEntries.getState().create({
  module: "fitness",
  kind: "focus", // extend EntryKind in core/data/entries.ts, e.g. "workout"
  mode: "run",
  startedAt,
  endedAt,
  durationMs,
  plannedMs: null,
  completed: true,
  pauses: 0,
  activityId: null,
  taskId: null,
  taskTitle: "Easy 8k",
  projectId: null,
  source: "manual",
});
```

When you add a new `EntryKind`, `selectFocus()` in `modules/insights/analytics.ts` keeps ignoring it, so existing focus charts are unaffected. Write sibling selectors (for example `selectWorkouts`) and reuse `bucketize`, `yearGrid` and `weeklyTrend`, which work on any entry list.

## 3. Manifest and route

```ts
// src/modules/wellness/manifest.ts
export const wellnessModule: ModuleManifest = {
  id: "wellness",
  name: "Wellness",
  tagline: "…",
  href: "/wellness",
  icon: Plant,
  status: "live", // was "soon"
};
```

Replace `src/app/(app)/wellness/page.tsx` with your view. Wrap anything that reads local data in `<ClientOnly>` to avoid hydration mismatches:

```tsx
export default function WellnessPage() {
  return (
    <ClientOnly>
      <WellnessView />
    </ClientOnly>
  );
}
```

The top bar and mobile tab bar read `MODULES` from `src/modules/registry.ts`, so navigation updates on its own.

## 4. Paywall

Add feature keys to `FEATURES` in `src/core/billing/plans.ts` and gate them:

```tsx
const canTrends = useCan("wellness.trends");
const gate = useGate();

<ProGate feature="wellness.trends">
  <MoodTrend />
</ProGate>

<Button onClick={() => gate("wellness.trends", openTrendDialog)}>Trends</Button>
```

Add the feature to `PRO_HIGHLIGHTS` and the comparison table in `PricingView.tsx` if it should be advertised.

## 5. Styling

Use the role tokens (`bg-page`, `bg-surface`, `text-ink`, `text-ink-2`, `text-ink-3`, `border-line`, `bg-fill`, `bg-accent`) rather than raw colours, and the `display` / `eyebrow` classes for headings and labels. Activity-style categories get a palette slot (`var(--series-1)` … `var(--series-8)`) assigned once at creation, never by rank.
